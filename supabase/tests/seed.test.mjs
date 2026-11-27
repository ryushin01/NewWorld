// 운영 어드민 목데이터에서 만든 Supabase 시드(supabase/seed/admin-demo.sql)를 마이그레이션과 함께
// 실제 Postgres(PGlite)에 넣어, 표가 목데이터와 똑같이 채워지고 어드민 RLS와 함께 동작하는지 봅니다.
// auth·storage 스키마는 Supabase가 제공하므로 시드가 쓰는 칸만 대역으로 만듭니다.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { buildSeedSql, loadSeed } from '../../scripts/lib/supabase-seed.mjs';

const seed = await loadSeed();
const sql = buildSeedSql(seed);
const ADMIN = seed.admins[0].userId;
const MASTER = seed.users.find((user) => user.nickname === 'ryushin0').id;

const db = new PGlite();
await db.exec(`
  create role authenticated nologin;
  create role service_role nologin;
  create role anon nologin;
  create schema auth;
  create table auth.users (
    instance_id uuid, id uuid primary key, aud text, role text, email text,
    encrypted_password text, email_confirmed_at timestamptz,
    raw_app_meta_data jsonb, raw_user_meta_data jsonb,
    created_at timestamptz, updated_at timestamptz,
    confirmation_token text, recovery_token text, email_change_token_new text, email_change text
  );
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
  grant usage on schema auth to authenticated;
  grant execute on function auth.uid() to authenticated;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  create function storage.foldername(name text) returns text[] language sql immutable as
    $$ select string_to_array(name, '/') $$;
  alter table storage.objects enable row level security;
  grant usage on schema storage to authenticated;
  grant all on storage.objects to authenticated;
  grant execute on function storage.foldername(text) to authenticated;
`);
const migrations = new URL('../migrations/', import.meta.url);
for (const file of readdirSync(migrations).sort()) {
  await db.exec(readFileSync(new URL(file, migrations), 'utf8'));
}
await db.exec(`
  grant usage on schema public to authenticated;
  grant all on all tables in schema public to authenticated;
`);
await db.exec(sql);

const as = async (uid, query, params) => {
  await db.exec(`reset role; set test.uid = '${uid}'; set role authenticated;`);
  try {
    return (await db.query(query, params)).rows;
  } finally {
    await db.exec('reset role');
  }
};
const count = async (table) =>
  Number((await db.query(`select count(*)::int as n from ${table}`)).rows[0].n);

test('커밋된 시드 SQL은 지금 목데이터로 만든 것과 같습니다(pnpm run db:seed:export)', () => {
  const committed = readFileSync(new URL('../seed/admin-demo.sql', import.meta.url), 'utf8');
  assert.equal(committed, sql);
});

test('시드가 모든 표를 목데이터와 같은 수로 채우고, 다시 넣어도 늘지 않습니다', async () => {
  const expected = {
    'auth.users': seed.authUsers.length,
    'public.profiles': seed.users.length,
    'private.admins': seed.admins.length,
    'public.catalog_destinations': 55,
    'public.catalog_courses': seed.courses.length,
    'public.catalog_badges': seed.badges.length,
    'public.checkins': seed.stamps.length,
    'public.profile_reports': seed.reports.length,
  };
  for (const [table, n] of Object.entries(expected)) assert.equal(await count(table), n, table);
  await db.exec(sql);
  for (const [table, n] of Object.entries(expected)) assert.equal(await count(table), n, table);
});

test('표의 내용이 목데이터와 칸까지 같습니다(본명은 비어 있음)', async () => {
  const destinations = (await db.query('select * from public.catalog_destinations order by id'))
    .rows;
  for (const row of destinations) {
    const item = seed.destinations.find((destination) => destination.id === row.id);
    assert.deepEqual(
      [row.realm, row.lore, row.name, row.original_name, row.tagline, row.group_name],
      [item.realm, item.lore, item.name, item.originalName, item.tagline, item.group],
    );
    assert.deepEqual(
      [row.location, row.era, row.latitude, row.longitude, row.overview, row.hidden],
      [item.location, item.era, item.latitude, item.longitude, item.overview, item.hidden],
    );
  }
  const courses = (await db.query('select id, stops from public.catalog_courses')).rows;
  for (const row of courses)
    assert.deepEqual(row.stops, seed.courses.find((course) => course.id === row.id).stops);

  const profiles = (await db.query('select id, nickname, name, avatar_path from public.profiles'))
    .rows;
  for (const row of profiles) {
    const user = seed.users.find((item) => item.id === row.id);
    assert.equal(row.nickname, user.nickname);
    assert.equal(row.avatar_path, user.avatarPath);
    assert.equal(row.name, '');
  }

  // 시각은 기준 시각과의 차이로 들어가므로 순서·간격이 목데이터와 같습니다.
  const [first, last] = [seed.stamps.at(-1), seed.stamps[0]];
  const { rows } = await db.query(
    `select extract(epoch from (b.checked_at - a.checked_at)) as gap
     from public.checkins a, public.checkins b where a.id = $1 and b.id = $2`,
    [first.id, last.id],
  );
  assert.equal(
    Math.round(Number(rows[0].gap)),
    Math.round((Date.parse(last.checkedAt) - Date.parse(first.checkedAt)) / 1000),
  );
  const early = await db.query(
    `select count(*)::int as n from public.checkins c join public.profiles p on p.id = c.user_id
     where c.checked_at < p.created_at`,
  );
  assert.equal(early.rows[0].n, 0);
});

test('데모 관리자는 어드민 정책으로 회원·스탬프·신고를 보고 신고를 처리합니다', async () => {
  assert.equal((await as(ADMIN, 'select public.is_admin() as ok'))[0].ok, true);
  const users = await as(ADMIN, 'select * from public.admin_users');
  assert.equal(users.length, seed.users.length);
  assert.equal('name' in users[0], false);
  assert.equal((await as(ADMIN, 'select id from public.checkins')).length, seed.stamps.length);
  assert.equal(
    (await as(ADMIN, 'select id from public.profile_reports')).length,
    seed.reports.length,
  );

  const report = seed.reports.find((item) => item.status === 'open' && item.target === 'nickname');
  await as(ADMIN, 'select public.admin_handle_report($1, $2, $3)', [
    report.id,
    'reset_nickname',
    '광고 닉네임',
  ]);
  const [target] = await as(ADMIN, 'select nickname from public.admin_users where id = $1', [
    report.targetId,
  ]);
  assert.equal(target.nickname, `여행자${report.targetId.replaceAll('-', '').slice(-4)}`);
  const handled = await as(
    ADMIN,
    'select status, handled_by from public.profile_reports where id = $1',
    [report.id],
  );
  assert.deepEqual(handled[0], { status: 'resolved', handled_by: ADMIN });
});

test('ryushin0(마스터)은 일반 회원이라 자기 스탬프 55개만 보고, 관리자 보기는 비어 있습니다', async () => {
  assert.equal((await as(MASTER, 'select public.is_admin() as ok'))[0].ok, false);
  assert.equal((await as(MASTER, 'select * from public.admin_users')).length, 0);
  const mine = await as(MASTER, 'select catalog_id from public.checkins');
  assert.equal(mine.length, 55);
  assert.equal(new Set(mine.map((row) => row.catalog_id)).size, 55);
  assert.equal((await as(MASTER, 'select id from public.catalog_destinations')).length, 55);
  await assert.rejects(
    as(
      MASTER,
      `update public.catalog_destinations set name = '탈취' where id = 'giza' returning id`,
    ).then((rows) => {
      if (rows.length === 0) throw new Error('RLS가 막음');
    }),
  );
});
