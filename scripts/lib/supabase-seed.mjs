// 운영 어드민 목데이터(apps/admin/src/shared/api/demo/seed.ts)를 Supabase에 그대로 넣는 SQL로 바꿉니다.
// 시각은 시드를 만든 기준 시각과의 차이로 적어(now() - interval) 언제 넣어도 "최근 30일" 같은 지표가 살아 있게 합니다.
import { withTsModules } from './load-ts.mjs';

/** 시드 SQL의 기준 시각. 바꾸면 SQL이 달라지므로 고정합니다. */
export const SEED_REFERENCE = new Date('2026-11-27T03:00:00.000Z');

export async function loadSeed() {
  return withTsModules(async (load) => {
    const { createSeed } = await load('/src/shared/api/demo/seed.ts');
    return createSeed(SEED_REFERENCE);
  });
}

const text = (value) => `'${String(value).replaceAll("'", "''")}'`;
const nullable = (value, as = text) => (value === null || value === undefined ? 'null' : as(value));
const num = (value) => {
  if (!Number.isFinite(value)) throw new Error(`숫자가 아닙니다: ${value}`);
  return String(value);
};
const json = (value) => `${text(JSON.stringify(value))}::jsonb`;
const textArray = (values) => `array[${values.map(text).join(', ')}]::text[]`;
/** 기준 시각과의 차이로 적은 시각 */
const at = (iso) => {
  const seconds = (SEED_REFERENCE.getTime() - new Date(iso).getTime()) / 1000;
  if (!Number.isFinite(seconds)) throw new Error(`시각이 아닙니다: ${iso}`);
  return seconds === 0 ? 'now()' : `now() - interval '${seconds} seconds'`;
};

const insert = (table, columns, rows, conflict) => {
  if (rows.length === 0) return '';
  const values = rows.map((row) => `  (${row.join(', ')})`).join(',\n');
  return `insert into ${table} (${columns.join(', ')}) values\n${values}\n${conflict};\n`;
};
const upsert = (key, columns) =>
  `on conflict (${key}) do update set ${columns
    .filter((column) => column !== key)
    .map((column) => `${column} = excluded.${column}`)
    .join(', ')}`;

export function buildSeedSql(seed) {
  const nicknames = new Map(seed.users.map((user) => [user.id, user.nickname]));
  const userColumns = [
    'instance_id',
    'id',
    'aud',
    'role',
    'email',
    'encrypted_password',
    'email_confirmed_at',
    'raw_app_meta_data',
    'raw_user_meta_data',
    'created_at',
    'updated_at',
    'confirmation_token',
    'recovery_token',
    'email_change_token_new',
    'email_change',
  ];
  const profileColumns = ['id', 'nickname', 'name', 'avatar_path', 'created_at', 'updated_at'];
  const destinationColumns = [
    'id',
    'realm',
    'lore',
    'name',
    'original_name',
    'tagline',
    'group_name',
    'location',
    'era',
    'latitude',
    'longitude',
    'overview',
    'hidden',
    'updated_at',
    'updated_by',
  ];
  const courseColumns = ['id', 'title', 'summary', 'stops', 'hidden', 'updated_at', 'updated_by'];
  const badgeColumns = [
    'id',
    'name',
    'description',
    'tone',
    'rule',
    'hidden',
    'updated_at',
    'updated_by',
  ];
  const checkinColumns = [
    'id',
    'user_id',
    'catalog_id',
    'checked_at',
    'latitude',
    'longitude',
    'distance_km',
    'method',
    'created_at',
  ];
  const reportColumns = [
    'id',
    'reporter_id',
    'target_id',
    'target',
    'reason',
    'status',
    'resolution_note',
    'created_at',
    'handled_at',
    'handled_by',
  ];

  return `-- scripts/export-supabase-seed.mjs가 만든 파일입니다. 손으로 고치지 말고 \`pnpm run db:seed:export\`로 다시 만듭니다.
-- 원천: apps/admin/src/shared/api/demo/seed.ts(운영 어드민 데모와 같은 목데이터), 앱 카탈로그, src/shared/api/demo-master.ts
-- 회원은 모두 가상이고 비밀번호가 없어 로그인할 수 없습니다(본명은 비움). 관리자 로그인은 docs/supabase-restore.md를 따릅니다.
-- 프로필 사진 파일은 SQL로 넣을 수 없어 \`pnpm run db:seed:export -- --avatars <폴더>\`로 만든 JPEG를 avatars 버킷에 올립니다.
-- 여러 번 실행해도 됩니다: 카탈로그는 이 내용으로 덮어쓰고, 회원·스탬프·신고는 이미 있으면 건너뜁니다.

begin;

-- 회원(auth.users). 가입 트리거가 profiles를 만들고, 아래에서 닉네임·사진·가입일을 맞춥니다.
${insert(
  'auth.users',
  userColumns,
  seed.authUsers.map((user) => [
    text('00000000-0000-0000-0000-000000000000'),
    text(user.id),
    text('authenticated'),
    text('authenticated'),
    text(user.email),
    text(''),
    at(user.createdAt),
    json({ provider: 'email', providers: ['email'] }),
    json({ nickname: nicknames.get(user.id) ?? '' }),
    at(user.createdAt),
    at(user.createdAt),
    text(''),
    text(''),
    text(''),
    text(''),
  ]),
  'on conflict (id) do nothing',
)}
-- 프로필(관리자 보기 admin_users의 원본). 본명(name)은 비웁니다.
${insert(
  'public.profiles',
  profileColumns,
  seed.users.map((user) => [
    text(user.id),
    text(user.nickname),
    text(''),
    nullable(user.avatarPath),
    at(user.createdAt),
    at(user.createdAt),
  ]),
  upsert('id', profileColumns),
)}
-- 데모 관리자
${insert(
  'private.admins',
  ['user_id', 'created_at'],
  seed.admins.map((admin) => [text(admin.userId), at(admin.createdAt)]),
  'on conflict (user_id) do nothing',
)}
-- 수록 여행지·코스·뱃지(앱 카탈로그와 같음)
${insert(
  'public.catalog_destinations',
  destinationColumns,
  seed.destinations.map((item) => [
    text(item.id),
    text(item.realm),
    text(item.lore),
    text(item.name),
    text(item.originalName),
    text(item.tagline),
    text(item.group),
    text(item.location),
    text(item.era),
    num(item.latitude),
    num(item.longitude),
    text(item.overview),
    String(item.hidden),
    at(item.updatedAt),
    nullable(item.updatedBy),
  ]),
  upsert('id', destinationColumns),
)}
${insert(
  'public.catalog_courses',
  courseColumns,
  seed.courses.map((item) => [
    text(item.id),
    text(item.title),
    text(item.summary),
    textArray(item.stops),
    String(item.hidden),
    at(item.updatedAt),
    nullable(item.updatedBy),
  ]),
  upsert('id', courseColumns),
)}
${insert(
  'public.catalog_badges',
  badgeColumns,
  seed.badges.map((item) => [
    text(item.id),
    text(item.name),
    text(item.description),
    text(item.tone),
    text(item.rule),
    String(item.hidden),
    at(item.updatedAt),
    nullable(item.updatedBy),
  ]),
  upsert('id', badgeColumns),
)}
-- 현장 인증 스탬프
${insert(
  'public.checkins',
  checkinColumns,
  seed.stamps.map((item) => [
    text(item.id),
    text(item.userId),
    text(item.destinationId),
    at(item.checkedAt),
    num(item.latitude),
    num(item.longitude),
    num(item.distanceKm),
    text(item.method),
    at(item.createdAt),
  ]),
  'on conflict do nothing',
)}
-- 닉네임·프로필 사진 신고
${insert(
  'public.profile_reports',
  reportColumns,
  seed.reports.map((item) => [
    text(item.id),
    text(item.reporterId),
    text(item.targetId),
    text(item.target),
    text(item.reason),
    text(item.status),
    text(item.resolutionNote),
    at(item.createdAt),
    nullable(item.handledAt, at),
    nullable(item.handledBy),
  ]),
  'on conflict (id) do nothing',
)}
commit;
`;
}
