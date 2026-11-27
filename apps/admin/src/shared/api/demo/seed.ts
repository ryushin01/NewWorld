import { FANTASY_DESTINATIONS } from '@catalog/catalog-fantasy';
import { REAL_DESTINATIONS } from '@catalog/catalog-real';
import { COURSES } from '@catalog/courses';
import { demoAvatar, flaggedAvatar } from '../../lib/avatar';
import { seededRandom } from '../../lib/random';
import type { AdminUser, Badge, Course, Destination, Report, Stamp } from '../types';

/** 데모 데이터 한 벌. 브라우저 저장소에 이 모양으로 저장합니다. */
export type DemoData = {
  version: 1;
  seededAt: string;
  destinations: Destination[];
  courses: Course[];
  badges: Badge[];
  users: AdminUser[];
  stamps: Stamp[];
  reports: Report[];
};

const DAY = 24 * 60 * 60 * 1000;

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

/** 앱이 실제로 쓰는 뱃지(features/badges/model/badges.ts)의 이름·설명·조건입니다. */
const BASE_BADGES: Omit<Badge, 'updatedAt' | 'hidden'>[] = [
  {
    id: 'first-step',
    name: '첫 발자국',
    description: '처음으로 현장 인증 스탬프를 찍었습니다',
    tone: 'real',
    rule: '스탬프 1개',
  },
  {
    id: 'collector-5',
    name: '스탬프 수집가',
    description: '현장 인증 스탬프 5개',
    tone: 'real',
    rule: '스탬프 5개',
  },
  {
    id: 'collector-10',
    name: '노련한 탐험가',
    description: '현장 인증 스탬프 10개',
    tone: 'real',
    rule: '스탬프 10개',
  },
  {
    id: 'collector-25',
    name: '세계를 걷는 사람',
    description: '현장 인증 스탬프 25개',
    tone: 'real',
    rule: '스탬프 25개',
  },
  {
    id: 'legend-walker',
    name: '전설을 걷다',
    description: '환상 세계의 현실 연고지에서 처음 인증했습니다',
    tone: 'fantasy',
    rule: '환상 세계 1곳',
  },
  {
    id: 'legend-keeper',
    name: '전설의 기록자',
    description: '환상 세계 연고지 5곳에서 인증했습니다',
    tone: 'fantasy',
    rule: '환상 세계 5곳',
  },
  {
    id: 'five-continents',
    name: '다섯 대륙',
    description: '아프리카, 아메리카, 아시아, 유럽, 오세아니아의 유적을 모두 인증했습니다',
    tone: 'real',
    rule: '다섯 대륙의 실존 유적',
  },
  {
    id: 'myth-gate',
    name: '신화의 문',
    description: '신화 속 장소의 현실 연고지에서 처음 인증했습니다',
    tone: 'fantasy',
    rule: '신화 1곳',
  },
  {
    id: 'myth-paradise',
    name: '낙원을 찾아서',
    description: '에덴, 엘리시온, 무릉도원 같은 낙원 3곳에서 인증했습니다',
    tone: 'fantasy',
    rule: '낙원 3곳',
  },
  {
    id: 'myth-afterlife',
    name: '저승 순례자',
    description: '하데스의 명계, 요미노쿠니, 시발바 같은 저승 3곳에서 인증했습니다',
    tone: 'fantasy',
    rule: '저승 3곳',
  },
  {
    id: 'myth-divine',
    name: '신들의 거처',
    description: '올림포스, 아스가르드, 수미산 같은 신들의 거처 3곳에서 인증했습니다',
    tone: 'fantasy',
    rule: '신들의 거처 3곳',
  },
  {
    id: 'myth-odyssey',
    name: '신화 대모험',
    description: '신화 속 장소 10곳에서 인증했습니다',
    tone: 'fantasy',
    rule: '신화 10곳',
  },
];

export function createSeed(now = new Date()): DemoData {
  const at = now.toISOString();
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
    }),
  );

  const courses: Course[] = COURSES.map((course) => ({ ...course, hidden: false, updatedAt: at }));

  const badges: Badge[] = [
    ...BASE_BADGES,
    ...COURSES.map((course) => ({
      id: `course-${course.id}`,
      name: `${course.title} 완주`,
      description: `${course.title} 코스의 ${course.stops.length}곳을 모두 인증했습니다`,
      tone: 'real' as const,
      rule: `코스 ${course.stops.length}곳`,
    })),
  ].map((badge) => ({ ...badge, hidden: false, updatedAt: at }));

  // 가입일은 최근 60일에 고르게, 앞쪽 회원일수록 먼저 가입했습니다.
  const users: AdminUser[] = NICKNAMES.map((nickname, index) => ({
    id: `demo-user-${String(index + 1).padStart(2, '0')}`,
    nickname,
    avatarUrl: index % 4 === 3 ? null : demoAvatar(index, nickname.slice(0, 1)),
    createdAt: new Date(
      now.getTime() - (60 - Math.floor((index / NICKNAMES.length) * 58)) * DAY - random() * DAY,
    ).toISOString(),
  }));
  // 신고 예시: 닉네임과 프로필 사진이 거슬리는 회원 두 명
  users.push(
    {
      id: 'demo-user-25',
      nickname: '광고문의카톡ABC',
      avatarUrl: demoAvatar(25, '광'),
      createdAt: new Date(now.getTime() - 3 * DAY).toISOString(),
    },
    {
      id: 'demo-user-26',
      nickname: '그림자여행자',
      avatarUrl: flaggedAvatar(),
      createdAt: new Date(now.getTime() - 2 * DAY).toISOString(),
    },
  );

  // 인기 여행지가 생기도록 앞쪽 여행지에 가중치를 둡니다.
  const popular = [
    'giza',
    'stonehenge',
    'machu-picchu',
    'atlantis',
    'avalon',
    'knossos',
    'angkor-wat',
    'olympus',
  ];
  const ids = destinations.map((item) => item.id);
  const stamps: Stamp[] = [];
  for (const user of users) {
    const joined = new Date(user.createdAt).getTime();
    const count = Math.floor(random() * 9);
    const seen = new Set<string>();
    for (let i = 0; i < count; i += 1) {
      const destinationId = random() < 0.45 ? pick(popular) : pick(ids);
      if (seen.has(destinationId)) continue;
      seen.add(destinationId);
      const checkedAt = joined + random() * (now.getTime() - joined);
      stamps.push({
        id: `demo-stamp-${stamps.length + 1}`,
        userId: user.id,
        destinationId,
        checkedAt: new Date(checkedAt).toISOString(),
        distanceKm: Math.round(random() * 900) / 1000,
        method: random() < 0.8 ? 'gps' : 'demo',
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
    const created = now.getTime() - hoursAgo * 60 * 60 * 1000;
    return {
      id: `demo-report-${index}`,
      reporterId: `demo-user-${String(reporter).padStart(2, '0')}`,
      targetId: `demo-user-${String(target).padStart(2, '0')}`,
      target: kind,
      reason,
      status,
      resolutionNote: status === 'open' ? '' : '운영 정책에 맞지 않는 신고라 기각했습니다.',
      createdAt: new Date(created).toISOString(),
      handledAt: status === 'open' ? null : new Date(created + 3 * 60 * 60 * 1000).toISOString(),
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

  return { version: 1, seededAt: at, destinations, courses, badges, users, stamps, reports };
}
