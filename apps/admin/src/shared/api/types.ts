import { z } from 'zod';

/** 실존 유적(real)인지 환상 세계(fantasy)인지 */
export const realmSchema = z.enum(['real', 'fantasy']);
export type Realm = z.infer<typeof realmSchema>;

/** 신화·전설은 환상 세계, 역사·사실은 실존 유적의 분류입니다(앱 myth.ts와 같음). */
export const loreSchema = z.enum(['myth', 'legend', 'history', 'fact']);
export type Lore = z.infer<typeof loreSchema>;

export const LORE_LABELS: Record<Lore, string> = {
  myth: '신화',
  legend: '전설',
  history: '역사',
  fact: '사실',
};
export const REALM_LABELS: Record<Realm, string> = { real: '실존 유적', fantasy: '환상 세계' };
export const LORES_BY_REALM: Record<Realm, readonly Lore[]> = {
  real: ['history', 'fact'],
  fantasy: ['myth', 'legend'],
};

/** 입력 길이 상한. DB 제약(20261127000000_admin.sql)과 함께 고칩니다. */
export const LIMITS = {
  destinationName: 60,
  originalName: 100,
  tagline: 80,
  group: 40,
  location: 60,
  era: 60,
  overview: 2000,
  courseTitle: 40,
  courseSummary: 200,
  courseStops: 12,
  badgeName: 30,
  badgeDescription: 120,
  note: 200,
} as const;

const isoDate = z.string().min(1);

export const destinationSchema = z.object({
  id: z.string().min(1),
  realm: realmSchema,
  lore: loreSchema,
  name: z.string(),
  originalName: z.string(),
  tagline: z.string(),
  group: z.string(),
  location: z.string(),
  era: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  overview: z.string(),
  hidden: z.boolean(),
  updatedAt: isoDate,
  /** 마지막으로 고친 관리자(updated_by). 시드로 넣은 값은 비어 있습니다. */
  updatedBy: z.string().nullable(),
});
export type Destination = z.infer<typeof destinationSchema>;

export const courseSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  summary: z.string(),
  stops: z.array(z.string()),
  hidden: z.boolean(),
  updatedAt: isoDate,
  updatedBy: z.string().nullable(),
});
export type Course = z.infer<typeof courseSchema>;

export const badgeSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  description: z.string(),
  tone: realmSchema,
  /** 획득 조건. 계산 규칙은 앱 코드(features/badges)에 있어 어드민에서는 바꾸지 않습니다. */
  rule: z.string(),
  hidden: z.boolean(),
  updatedAt: isoDate,
  updatedBy: z.string().nullable(),
});
export type Badge = z.infer<typeof badgeSchema>;

export const stampSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  destinationId: z.string().min(1),
  checkedAt: isoDate,
  /** 인증한 기기의 위치(checkins.latitude·longitude) */
  latitude: z.number(),
  longitude: z.number(),
  distanceKm: z.number(),
  method: z.enum(['gps', 'demo']),
  createdAt: isoDate,
});
export type Stamp = z.infer<typeof stampSchema>;

export const userSchema = z.object({
  id: z.string().min(1),
  nickname: z.string(),
  avatarUrl: z.string().nullable(),
  createdAt: isoDate,
});
export type AdminUser = z.infer<typeof userSchema>;

/**
 * 관리자 회원 보기(public.admin_users)의 한 줄. 본명은 없고, 사진은 저장소 경로입니다.
 * 화면에는 서명 주소(데모는 저장소 대역의 그림)로 바꾼 AdminUser를 줍니다.
 */
export const adminUserRowSchema = z.object({
  id: z.string().min(1),
  nickname: z.string(),
  avatarPath: z.string().nullable(),
  createdAt: isoDate,
});
export type AdminUserRow = z.infer<typeof adminUserRowSchema>;

export const reportTargetSchema = z.enum(['nickname', 'avatar']);
export type ReportTarget = z.infer<typeof reportTargetSchema>;
export const REPORT_TARGET_LABELS: Record<ReportTarget, string> = {
  nickname: '닉네임',
  avatar: '프로필 사진',
};

export const reportStatusSchema = z.enum(['open', 'resolved', 'dismissed']);
export type ReportStatus = z.infer<typeof reportStatusSchema>;
export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: '처리 대기',
  resolved: '조치함',
  dismissed: '기각',
};

export const reportSchema = z.object({
  id: z.string().min(1),
  reporterId: z.string().min(1),
  targetId: z.string().min(1),
  target: reportTargetSchema,
  reason: z.string(),
  status: reportStatusSchema,
  resolutionNote: z.string(),
  createdAt: isoDate,
  handledAt: z.string().nullable(),
  /** 처리한 관리자(handled_by) */
  handledBy: z.string().nullable(),
});
export type Report = z.infer<typeof reportSchema>;

/** 신고 처리: 닉네임 초기화, 프로필 사진 내리기, 기각 */
export const reportActionSchema = z.enum(['reset_nickname', 'remove_avatar', 'dismiss']);
export type ReportAction = z.infer<typeof reportActionSchema>;

export type DestinationInput = Omit<Destination, 'hidden' | 'updatedAt' | 'updatedBy'>;
export type CourseInput = Omit<Course, 'hidden' | 'updatedAt' | 'updatedBy'>;
export type BadgeInput = Pick<Badge, 'name' | 'description'>;

export type AdminSession = { name: string; demo: boolean };

/** 어드민 화면이 쓰는 데이터 입구. 데모(브라우저 저장소)와 Supabase가 같은 모양을 따릅니다. */
export type AdminBackend = {
  mode: 'demo' | 'supabase';
  getSession(): Promise<AdminSession | null>;
  /** 데모에서는 아이디·비밀번호 없이 관리자로 들어갑니다. */
  signIn(credentials?: { username: string; password: string }): Promise<AdminSession>;
  signOut(): Promise<void>;
  listDestinations(): Promise<Destination[]>;
  /** id가 이미 있으면 고치고 없으면 새로 만듭니다. */
  saveDestination(input: DestinationInput, mode: 'create' | 'update'): Promise<Destination>;
  setDestinationHidden(id: string, hidden: boolean): Promise<void>;
  listCourses(): Promise<Course[]>;
  saveCourse(input: CourseInput, mode: 'create' | 'update'): Promise<Course>;
  setCourseHidden(id: string, hidden: boolean): Promise<void>;
  listBadges(): Promise<Badge[]>;
  saveBadge(id: string, input: BadgeInput): Promise<Badge>;
  setBadgeHidden(id: string, hidden: boolean): Promise<void>;
  listStamps(): Promise<Stamp[]>;
  revokeStamp(id: string): Promise<void>;
  listUsers(): Promise<AdminUser[]>;
  listReports(): Promise<Report[]>;
  handleReport(id: string, action: ReportAction, note: string): Promise<void>;
  /** 데모 데이터를 처음 상태로 되돌립니다(데모 모드만). */
  resetDemo?(): Promise<void>;
};

/** 사용자에게 보여 줄 수 있는 오류. 메시지는 한국어입니다. */
export class AdminError extends Error {
  constructor(
    message: string,
    readonly code: 'conflict' | 'not_found' | 'forbidden' | 'invalid' | 'unknown' = 'unknown',
  ) {
    super(message);
    this.name = 'AdminError';
  }
}
