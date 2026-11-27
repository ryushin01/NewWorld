import { BADGE_CATALOG } from '@catalog/badge-catalog';
import { FANTASY_DESTINATIONS } from '@catalog/catalog-fantasy';
import { REAL_DESTINATIONS } from '@catalog/catalog-real';
import { COURSES } from '@catalog/courses';
import masterAvatarUrl from '@demo-assets/ryushin0.webp';
import {
  MASTER_JOINED_AT,
  MASTER_NICKNAME,
  MASTER_USER_ID,
  MASTER_USERNAME,
  MASTER_VISITS,
} from '@demo-master';
import { demoAvatar, flaggedAvatar } from '../../lib/avatar';
import { seededRandom } from '../../lib/random';
import type { AdminUserRow, Badge, Course, Destination, Report, Stamp } from '../types';

/**
 * 운영 어드민 목데이터의 유일한 원천입니다. 실제 DB(supabase/migrations)의 표와 같은 모양으로 만들고,
 * 데모 백엔드(브라우저 저장소)와 Supabase 시드(`pnpm run db:seed:export` → supabase/seed/admin-demo.sql)가
 * 모두 이 함수의 결과를 씁니다. 여행지·코스·뱃지는 앱 카탈로그(src/entities/destination/model)에서 옵니다.
 *
 * | 키            | DB                                                 |
 * | ------------- | -------------------------------------------------- |
 * | authUsers     | auth.users (아이디 주소만, 비밀번호 없음)          |
 * | admins        | private.admins                                     |
 * | users         | public.profiles → public.admin_users(본명 뺀 보기) |
 * | avatarObjects | storage.objects (avatars 버킷)                     |
 * | destinations  | public.catalog_destinations                        |
 * | courses       | public.catalog_courses                             |
 * | badges        | public.catalog_badges                              |
 * | stamps        | public.checkins                                    |
 * | reports       | public.profile_reports                             |
 */
export type DemoData = {
  version: 2;
  seededAt: string;
  authUsers: AuthUser[];
  admins: AdminRow[];
  users: AdminUserRow[];
  avatarObjects: AvatarObject[];
  destinations: Destination[];
  courses: Course[];
  badges: Badge[];
  stamps: Stamp[];
  reports: Report[];
};

/** auth.users의 한 줄. 로그인은 아이디를 {아이디}@users.newworld.app 주소로 바꿔 합니다. */
export type AuthUser = { id: string; email: string; createdAt: string };
export type AdminRow = { userId: string; createdAt: string };
/**
 * 프로필 사진 파일. name은 버킷 안 경로({user_id}/avatar.jpg), url은 데모가 보여 줄 그림
 * (직접 그린 SVG data URI 또는 번들에 든 마스터 사진)입니다. Supabase 시드는 이것을 JPEG로 바꿔 올립니다.
 */
export type AvatarObject = { name: string; url: string };

const DAY = 24 * 60 * 60 * 1000;
const EMAIL_DOMAIN = 'users.newworld.app';

/** 늘 같은 UUID. 앞 8자리로 종류를 나눠 실제 회원 UUID와 겹치지 않게 합니다(5eed = seed). */
const seedUuid = (kind: number, index: number) =>
  `5eed${kind.toString(16).padStart(4, '0')}-0000-4000-8000-${index.toString(16).padStart(12, '0')}`;
const USER_KIND = 1;
const STAMP_KIND = 2;
const REPORT_KIND = 3;

/** 데모 관리자. private.admins에 들어 있고, 데모 모드의 처리·수정 기록(updated_by·handled_by)이 이 계정입니다. */
export const DEMO_ADMIN_ID = seedUuid(USER_KIND, 0xad);
export const demoUserId = (index: number) => seedUuid(USER_KIND, index);
export const demoReportId = (index: number) => seedUuid(REPORT_KIND, index);

const NICKNAMES = [
  '아틀란티스찾는중',
  '돌기둥수집가',
  '미궁의실타래',
  '사과의섬',
  '황금도시탐사대',
  '신선놀음',
  '세계의배꼽',
  '저승사자말고여행자',
  '스핑크스의질문',
  '원탁의기사',
  '구름위올림포스',
  '복사꽃마을',
  '초원의유목민',
  '바다건너니라이',
  '거석의평원',
  '앙코르의새벽',
  '룬문자해독가',
  '실크로드낙타',
  '마야달력',
  '샹그릴라가는길',
  '토르의망치',
  '청동거울',
  '두루마리지도',
  '북쪽끝툴레',
];

/** 신고 처리 예시용 회원(닉네임 광고, 거슬리는 사진) */
const FLAGGED = [
  { index: 25, nickname: '광고문의카톡ABC', daysAgo: 3, flagged: false },
  { index: 26, nickname: '그림자여행자', daysAgo: 2, flagged: true },
] as const;

/** 인기 여행지가 생기도록 이 여행지들에 가중치를 둡니다. */
const POPULAR = [
  'giza',
  'stonehenge',
  'machu-picchu',
  'atlantis',
  'avalon',
  'knossos',
  'angkor-wat',
  'olympus',
];

/** 여행지에서 km만큼 떨어진 인증 위치(앱의 인증 반경 3km 안). */
const offsetBy = (latitude: number, longitude: number, km: number, angle: number) => {
  const dLat = (km / 111.32) * Math.cos(angle);
  const cos = Math.max(Math.cos((latitude * Math.PI) / 180), 0.01);
  const dLng = (km / (111.32 * cos)) * Math.sin(angle);
  const round = (value: number) => Math.round(value * 1e6) / 1e6;
  return {
    latitude: round(Math.min(90, Math.max(-90, latitude + dLat))),
    longitude: round(((longitude + dLng + 540) % 360) - 180),
  };
};

export function createSeed(now = new Date()): DemoData {
  const at = now.toISOString();
  const nowMs = now.getTime();
  const iso = (ms: number) => new Date(ms).toISOString();
  const random = seededRandom(20261127);
  const pick = <T>(items: readonly T[]): T => {
    const item = items[Math.floor(random() * items.length)];
    if (item === undefined) throw new Error('빈 목록에서 고를 수 없습니다.');
    return item;
  };

  const destinations: Destination[] = [...REAL_DESTINATIONS, ...FANTASY_DESTINATIONS].map(
    (item) => ({
      id: item.id,
      realm: item.realm,
      lore: item.lore,
      name: item.name,
      originalName: item.originalName,
      tagline: item.tagline,
      group: item.group,
      location: item.location,
      era: item.era,
      latitude: item.latitude,
      longitude: item.longitude,
      overview: item.overview,
      hidden: false,
      updatedAt: at,
      updatedBy: null,
    }),
  );

  const courses: Course[] = COURSES.map((course) => ({
    id: course.id,
    title: course.title,
    summary: course.summary,
    stops: [...course.stops],
    hidden: false,
    updatedAt: at,
    updatedBy: null,
  }));

  const badges: Badge[] = BADGE_CATALOG.map((badge) => ({
    id: badge.id,
    name: badge.name,
    description: badge.description,
    tone: badge.tone,
    rule: badge.rule,
    hidden: false,
    updatedAt: at,
    updatedBy: null,
  }));

  // 데모 관리자는 가장 먼저(90일 전) 가입했고, 일반 회원은 최근 60일에 고르게 가입했습니다.
  const adminCreatedAt = iso(nowMs - 90 * DAY);
  const users: AdminUserRow[] = [
    { id: DEMO_ADMIN_ID, nickname: '신세계운영팀', avatarPath: null, createdAt: adminCreatedAt },
  ];
  const avatarObjects: AvatarObject[] = [];
  const avatarFor = (id: string, url: string) => {
    const name = `${id}/avatar.jpg`;
    avatarObjects.push({ name, url });
    return name;
  };
  // ryushin0(마스터): 여행지를 모두 다녀온 계정. 관리자 다음으로 먼저 가입했습니다.
  users.push({
    id: MASTER_USER_ID,
    nickname: MASTER_NICKNAME,
    avatarPath: avatarFor(MASTER_USER_ID, masterAvatarUrl),
    createdAt: MASTER_JOINED_AT,
  });
  NICKNAMES.forEach((nickname, index) => {
    const id = demoUserId(index + 1);
    users.push({
      id,
      nickname,
      avatarPath: index % 4 === 3 ? null : avatarFor(id, demoAvatar(index, nickname.slice(0, 1))),
      createdAt: iso(
        nowMs - (60 - Math.floor((index / NICKNAMES.length) * 58)) * DAY - random() * DAY,
      ),
    });
  });
  for (const item of FLAGGED) {
    const id = demoUserId(item.index);
    const svg = item.flagged ? flaggedAvatar() : demoAvatar(item.index, item.nickname.slice(0, 1));
    users.push({
      id,
      nickname: item.nickname,
      avatarPath: avatarFor(id, svg),
      createdAt: iso(nowMs - item.daysAgo * DAY),
    });
  }

  // 로그인 아이디: 데모 관리자 demo-admin, 마스터 ryushin0, 회원 n번은 demo01~demo26
  const handleOf = (id: string) =>
    id === DEMO_ADMIN_ID
      ? 'demo-admin'
      : id === MASTER_USER_ID
        ? MASTER_USERNAME
        : `demo${String(Number.parseInt(id.slice(-12), 16)).padStart(2, '0')}`;
  const authUsers: AuthUser[] = users.map((user) => ({
    id: user.id,
    email: `${handleOf(user.id)}@${EMAIL_DOMAIN}`,
    createdAt: user.createdAt,
  }));
  const admins: AdminRow[] = [{ userId: DEMO_ADMIN_ID, createdAt: adminCreatedAt }];

  const byId = new Map(destinations.map((item) => [item.id, item]));
  const ids = destinations.map((item) => item.id);
  const stamps: Stamp[] = [];
  MASTER_VISITS.forEach((visit, index) => {
    stamps.push({
      id: seedUuid(STAMP_KIND, 0x1000 + index),
      userId: MASTER_USER_ID,
      destinationId: visit.catalogId,
      checkedAt: visit.visitedAt,
      latitude: visit.latitude,
      longitude: visit.longitude,
      distanceKm: visit.distanceKm,
      method: 'gps',
      createdAt: visit.visitedAt,
    });
  });
  for (const user of users) {
    if (user.id === DEMO_ADMIN_ID || user.id === MASTER_USER_ID) continue;
    const joined = new Date(user.createdAt).getTime();
    const count = Math.floor(random() * 9);
    const seen = new Set<string>();
    for (let i = 0; i < count; i += 1) {
      const destinationId = random() < 0.45 ? pick(POPULAR) : pick(ids);
      if (seen.has(destinationId)) continue;
      seen.add(destinationId);
      const destination = byId.get(destinationId);
      if (!destination) throw new Error(`없는 여행지 ${destinationId}`);
      const checkedAt = iso(joined + random() * (nowMs - joined));
      const distanceKm = Math.round(random() * 900) / 1000;
      const method = random() < 0.8 ? 'gps' : 'demo';
      const angle = random() * 2 * Math.PI;
      stamps.push({
        id: seedUuid(STAMP_KIND, stamps.length + 1),
        userId: user.id,
        destinationId,
        checkedAt,
        ...offsetBy(destination.latitude, destination.longitude, distanceKm, angle),
        distanceKm,
        method,
        createdAt: checkedAt,
      });
    }
  }
  stamps.sort((a, b) => b.checkedAt.localeCompare(a.checkedAt));

  const report = (
    index: number,
    reporter: number,
    target: number,
    kind: Report['target'],
    reason: string,
    hoursAgo: number,
    status: Report['status'] = 'open',
  ): Report => {
    const created = nowMs - hoursAgo * 60 * 60 * 1000;
    const open = status === 'open';
    return {
      id: demoReportId(index),
      reporterId: demoUserId(reporter),
      targetId: demoUserId(target),
      target: kind,
      reason,
      status,
      resolutionNote: open ? '' : '운영 정책에 맞지 않는 신고라 기각했습니다.',
      createdAt: iso(created),
      handledAt: open ? null : iso(created + 3 * 60 * 60 * 1000),
      handledBy: open ? null : DEMO_ADMIN_ID,
    };
  };
  const reports: Report[] = [
    report(1, 3, 25, 'nickname', '닉네임에 광고 연락처를 넣었습니다.', 5),
    report(2, 11, 25, 'nickname', '홍보용 계정 같아요.', 9),
    report(3, 7, 26, 'avatar', '프로필 사진이 불쾌감을 줍니다.', 20),
    report(4, 14, 9, 'nickname', '다른 사람을 흉내 내는 닉네임입니다.', 30),
    report(5, 2, 18, 'avatar', '저작권이 있는 그림 같습니다.', 52),
    report(6, 5, 12, 'nickname', '닉네임이 마음에 들지 않아요.', 120, 'dismissed'),
  ];

  return {
    version: 2,
    seededAt: at,
    authUsers,
    admins,
    users,
    avatarObjects,
    destinations,
    courses,
    badges,
    stamps,
    reports,
  };
}

/** 신고 처리 함수(admin_handle_report)와 같은 규칙으로 초기화한 닉네임입니다. */
export const resetNickname = (id: string) => `여행자${id.replaceAll('-', '').slice(-4)}`;
