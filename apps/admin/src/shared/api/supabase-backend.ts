import { createClient, type PostgrestError } from '@supabase/supabase-js';
import { z } from 'zod';
import { env, toAuthEmail } from '../config/env';
import {
  AdminError,
  loreSchema,
  realmSchema,
  reportActionSchema,
  reportStatusSchema,
  reportTargetSchema,
  type AdminBackend,
  type AdminSession,
  type Badge,
  type Course,
  type Destination,
} from './types';

/**
 * 실제 Supabase 백엔드. 테이블·정책은 supabase/migrations/20261127000000_admin.sql입니다.
 * 쓰기는 관리자(public.admins)만 RLS로 허용되고, 응답은 모두 zod로 검사합니다.
 */
const client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: { storageKey: 'newworld-admin.auth', persistSession: true, autoRefreshToken: true },
});

const AVATAR_BUCKET = 'avatars';
const SIGNED_URL_TTL = 60 * 60;

const destinationRow = z.object({
  id: z.string(),
  realm: realmSchema,
  lore: loreSchema,
  name: z.string(),
  original_name: z.string(),
  tagline: z.string(),
  group_name: z.string(),
  location: z.string(),
  era: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  overview: z.string(),
  hidden: z.boolean(),
  updated_at: z.string(),
  updated_by: z.string().nullable(),
});
const courseRow = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  stops: z.array(z.string()),
  hidden: z.boolean(),
  updated_at: z.string(),
  updated_by: z.string().nullable(),
});
const badgeRow = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  tone: realmSchema,
  rule: z.string(),
  hidden: z.boolean(),
  updated_at: z.string(),
  updated_by: z.string().nullable(),
});
const stampRow = z.object({
  id: z.string(),
  user_id: z.string(),
  catalog_id: z.string(),
  checked_at: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  distance_km: z.coerce.number(),
  method: z.enum(['gps', 'demo']),
  created_at: z.string(),
});
const userRow = z.object({
  id: z.string(),
  nickname: z.string(),
  avatar_path: z.string().nullable(),
  created_at: z.string(),
});
const reportRow = z.object({
  id: z.string(),
  reporter_id: z.string(),
  target_id: z.string(),
  target: reportTargetSchema,
  reason: z.string(),
  status: reportStatusSchema,
  resolution_note: z.string(),
  created_at: z.string(),
  handled_at: z.string().nullable(),
  handled_by: z.string().nullable(),
});

const toDestination = (row: z.infer<typeof destinationRow>): Destination => ({
  id: row.id,
  realm: row.realm,
  lore: row.lore,
  name: row.name,
  originalName: row.original_name,
  tagline: row.tagline,
  group: row.group_name,
  location: row.location,
  era: row.era,
  latitude: row.latitude,
  longitude: row.longitude,
  overview: row.overview,
  hidden: row.hidden,
  updatedAt: row.updated_at,
  updatedBy: row.updated_by,
});
const toCourse = (row: z.infer<typeof courseRow>): Course => ({
  id: row.id,
  title: row.title,
  summary: row.summary,
  stops: row.stops,
  hidden: row.hidden,
  updatedAt: row.updated_at,
  updatedBy: row.updated_by,
});
const toBadge = (row: z.infer<typeof badgeRow>): Badge => ({
  id: row.id,
  name: row.name,
  description: row.description,
  tone: row.tone,
  rule: row.rule,
  hidden: row.hidden,
  updatedAt: row.updated_at,
  updatedBy: row.updated_by,
});

/** Postgres 오류 코드를 화면용 한국어 오류로 바꿉니다. */
function fail(error: PostgrestError | Error): never {
  const code = 'code' in error ? error.code : '';
  if (code === '23505') throw new AdminError('같은 ID가 이미 있습니다.', 'conflict');
  if (code === '42501') throw new AdminError('관리자 권한이 없습니다.', 'forbidden');
  if (code === '23514') throw new AdminError('입력값이 허용 범위를 벗어났습니다.', 'invalid');
  throw new AdminError('서버 요청에 실패했습니다. 잠시 뒤 다시 시도해 주세요.');
}

async function rows<T>(
  query: PromiseLike<{ data: unknown; error: PostgrestError | null }>,
  schema: z.ZodType<T>,
): Promise<T[]> {
  const { data, error } = await query;
  if (error) fail(error);
  const parsed = z.array(schema).safeParse(data ?? []);
  if (!parsed.success) throw new AdminError('서버 응답 형식이 예상과 다릅니다.');
  return parsed.data;
}

async function one<T>(
  query: PromiseLike<{ data: unknown; error: PostgrestError | null }>,
  schema: z.ZodType<T>,
): Promise<T> {
  const [row] = await rows(
    query.then(({ data, error }) => ({ data: data === null ? [] : [data], error })),
    schema,
  );
  if (!row) throw new AdminError('항목을 찾을 수 없습니다.', 'not_found');
  return row;
}

async function currentSession(): Promise<AdminSession | null> {
  const { data } = await client.auth.getSession();
  if (!data.session) return null;
  const { data: isAdmin, error } = await client.rpc('is_admin');
  if (error) fail(error);
  if (isAdmin !== true) {
    await client.auth.signOut();
    throw new AdminError('관리자 계정이 아닙니다.', 'forbidden');
  }
  const email = data.session.user.email ?? '';
  return { name: email.split('@')[0] ?? '관리자', demo: false };
}

export const supabaseBackend: AdminBackend = {
  mode: 'supabase',
  getSession: currentSession,
  async signIn(credentials) {
    if (!credentials) throw new AdminError('아이디와 비밀번호를 입력해 주세요.', 'invalid');
    const { error } = await client.auth.signInWithPassword({
      email: toAuthEmail(credentials.username),
      password: credentials.password,
    });
    if (error) throw new AdminError('아이디 또는 비밀번호가 맞지 않습니다.', 'invalid');
    const session = await currentSession();
    if (!session) throw new AdminError('로그인하지 못했습니다.');
    return session;
  },
  async signOut() {
    await client.auth.signOut();
  },
  async listDestinations() {
    const list = await rows(
      client.from('catalog_destinations').select('*').order('updated_at', { ascending: false }),
      destinationRow,
    );
    return list.map(toDestination);
  },
  async saveDestination(input, mode) {
    const row = {
      id: input.id,
      realm: input.realm,
      lore: input.lore,
      name: input.name,
      original_name: input.originalName,
      tagline: input.tagline,
      group_name: input.group,
      location: input.location,
      era: input.era,
      latitude: input.latitude,
      longitude: input.longitude,
      overview: input.overview,
    };
    const query =
      mode === 'create'
        ? client.from('catalog_destinations').insert(row).select().single()
        : client.from('catalog_destinations').update(row).eq('id', input.id).select().single();
    return toDestination(await one(query, destinationRow));
  },
  async setDestinationHidden(id, hidden) {
    const { error } = await client.from('catalog_destinations').update({ hidden }).eq('id', id);
    if (error) fail(error);
  },
  async listCourses() {
    const list = await rows(client.from('catalog_courses').select('*').order('id'), courseRow);
    return list.map(toCourse);
  },
  async saveCourse(input, mode) {
    const row = { id: input.id, title: input.title, summary: input.summary, stops: input.stops };
    const query =
      mode === 'create'
        ? client.from('catalog_courses').insert(row).select().single()
        : client.from('catalog_courses').update(row).eq('id', input.id).select().single();
    return toCourse(await one(query, courseRow));
  },
  async setCourseHidden(id, hidden) {
    const { error } = await client.from('catalog_courses').update({ hidden }).eq('id', id);
    if (error) fail(error);
  },
  async listBadges() {
    const list = await rows(client.from('catalog_badges').select('*').order('id'), badgeRow);
    return list.map(toBadge);
  },
  async saveBadge(id, input) {
    return toBadge(
      await one(
        client.from('catalog_badges').update(input).eq('id', id).select().single(),
        badgeRow,
      ),
    );
  },
  async setBadgeHidden(id, hidden) {
    const { error } = await client.from('catalog_badges').update({ hidden }).eq('id', id);
    if (error) fail(error);
  },
  async listStamps() {
    const list = await rows(
      client
        .from('checkins')
        .select(
          'id, user_id, catalog_id, checked_at, latitude, longitude, distance_km, method, created_at',
        )
        .order('checked_at', { ascending: false })
        .limit(5000),
      stampRow,
    );
    return list.map((row) => ({
      id: row.id,
      userId: row.user_id,
      destinationId: row.catalog_id,
      checkedAt: row.checked_at,
      latitude: row.latitude,
      longitude: row.longitude,
      distanceKm: row.distance_km,
      method: row.method,
      createdAt: row.created_at,
    }));
  },
  async revokeStamp(id) {
    const { error } = await client.from('checkins').delete().eq('id', id);
    if (error) fail(error);
  },
  async listUsers() {
    const list = await rows(
      client.from('admin_users').select('*').order('created_at', { ascending: false }),
      userRow,
    );
    const paths = list.flatMap((row) => (row.avatar_path ? [row.avatar_path] : []));
    const urls = new Map<string, string>();
    if (paths.length) {
      const { data } = await client.storage
        .from(AVATAR_BUCKET)
        .createSignedUrls(paths, SIGNED_URL_TTL);
      for (const item of data ?? [])
        if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
    }
    return list.map((row) => ({
      id: row.id,
      nickname: row.nickname,
      avatarUrl: row.avatar_path ? (urls.get(row.avatar_path) ?? null) : null,
      createdAt: row.created_at,
    }));
  },
  async listReports() {
    const list = await rows(
      client.from('profile_reports').select('*').order('created_at', { ascending: false }),
      reportRow,
    );
    return list.map((row) => ({
      id: row.id,
      reporterId: row.reporter_id,
      targetId: row.target_id,
      target: row.target,
      reason: row.reason,
      status: row.status,
      resolutionNote: row.resolution_note,
      createdAt: row.created_at,
      handledAt: row.handled_at,
      handledBy: row.handled_by,
    }));
  },
  async handleReport(id, action, note) {
    const { error } = await client.rpc('admin_handle_report', {
      p_report_id: id,
      p_action: reportActionSchema.parse(action),
      p_note: note,
    });
    // 처리 함수는 이유를 한국어로 돌려줍니다(이미 처리함, 권한 없음 등).
    if (error)
      throw new AdminError(
        error.message || '신고를 처리하지 못했습니다.',
        error.code === '42501' ? 'forbidden' : 'conflict',
      );
  },
};
