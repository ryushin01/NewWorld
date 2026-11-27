import {
  BADGE_CATALOG,
  COURSES,
  DESTINATIONS,
  MYTH_SPACES,
  type BadgeDefinition,
  type Destination,
} from '@/entities/destination';
import type { CheckIn } from '@/shared/api';

export type { BadgeIcon } from '@/entities/destination';

/** 뱃지의 이름·설명·색은 entities/destination의 BADGE_CATALOG(어드민·DB 시드와 같은 원천)에서 옵니다. */
export type Badge = BadgeDefinition & {
  /** 인증 스탬프로 얼마나 채웠는지와 목표. 목표에 닿은 순간의 인증 날짜가 획득일입니다. */
  progress: (stamped: StampedDestination[]) => {
    current: number;
    target: number;
    earnedAt: string | null;
  };
};

export type StampedDestination = { destination: Destination; checkedAt: string };

export type BadgeStatus = {
  badge: Badge;
  current: number;
  target: number;
  earned: boolean;
  earnedAt: string | null;
};

/** 조건에 맞는 인증을 날짜순으로 세고, target번째가 찍힌 날을 획득일로 봅니다. */
const countUntil = (
  stamped: StampedDestination[],
  target: number,
  match: (item: StampedDestination) => boolean,
) => {
  const hits = stamped.filter(match);
  return {
    current: Math.min(hits.length, target),
    target,
    earnedAt: hits.length >= target ? hits[target - 1].checkedAt : null,
  };
};

const CONTINENTS = ['아프리카', '아메리카', '아시아', '유럽', '오세아니아'];

const isMyth = (item: StampedDestination) => item.destination.lore === 'myth';
const isFantasy = (item: StampedDestination) => item.destination.realm === 'fantasy';
const inSpace = (space: keyof typeof MYTH_SPACES) => (item: StampedDestination) =>
  MYTH_SPACES[space].includes(item.destination.id);
const any = () => true;

type Progress = Badge['progress'];

const fiveContinents: Progress = (stamped) => {
  const seen: string[] = [];
  let earnedAt: string | null = null;
  for (const item of stamped) {
    const group = item.destination.group;
    if (item.destination.realm !== 'real' || !CONTINENTS.includes(group) || seen.includes(group))
      continue;
    seen.push(group);
    if (seen.length === CONTINENTS.length) earnedAt = item.checkedAt;
  }
  return { current: seen.length, target: CONTINENTS.length, earnedAt };
};

/** 뱃지별 획득 계산. 코스 완주 뱃지(course-…)는 코스의 여행지를 모두 인증했는지 셉니다. */
const PROGRESS: Record<string, Progress> = {
  'first-step': (stamped) => countUntil(stamped, 1, any),
  'collector-5': (stamped) => countUntil(stamped, 5, any),
  'collector-10': (stamped) => countUntil(stamped, 10, any),
  'collector-25': (stamped) => countUntil(stamped, 25, any),
  'legend-walker': (stamped) => countUntil(stamped, 1, isFantasy),
  'legend-keeper': (stamped) => countUntil(stamped, 5, isFantasy),
  'five-continents': fiveContinents,
  'myth-gate': (stamped) => countUntil(stamped, 1, isMyth),
  'myth-paradise': (stamped) => countUntil(stamped, 3, inSpace('paradise')),
  'myth-afterlife': (stamped) => countUntil(stamped, 3, inSpace('afterlife')),
  'myth-divine': (stamped) => countUntil(stamped, 3, inSpace('divine')),
  'myth-odyssey': (stamped) => countUntil(stamped, 10, isMyth),
  ...Object.fromEntries(
    COURSES.map((course): [string, Progress] => [
      `course-${course.id}`,
      (stamped) =>
        countUntil(stamped, course.stops.length, (item) =>
          course.stops.includes(item.destination.id),
        ),
    ]),
  ),
};

export const BADGES: Badge[] = BADGE_CATALOG.map((definition) => {
  const progress = PROGRESS[definition.id];
  if (!progress) throw new Error(`뱃지 ${definition.id}의 획득 계산이 없습니다.`);
  return { ...definition, progress };
});

const byId = new Map(DESTINATIONS.map((item) => [item.id, item]));

const toStamped = (checkins: CheckIn[]): StampedDestination[] =>
  [...checkins]
    .sort((a, b) => a.checkedAt.localeCompare(b.checkedAt))
    .flatMap((checkin) => {
      const destination = byId.get(checkin.catalogId);
      return destination ? [{ destination, checkedAt: checkin.checkedAt }] : [];
    });

export const evaluateBadges = (checkins: CheckIn[], badges = BADGES): BadgeStatus[] => {
  const stamped = toStamped(checkins);
  return badges.map((badge) => {
    const { current, target, earnedAt } = badge.progress(stamped);
    return { badge, current, target, earned: earnedAt !== null, earnedAt };
  });
};

/** 인증 전후를 비교해 이번에 새로 받은 뱃지만 돌려줍니다. */
export const newlyEarned = (before: CheckIn[], after: CheckIn[]) => {
  const had = new Set(
    evaluateBadges(before)
      .filter((item) => item.earned)
      .map((item) => item.badge.id),
  );
  return evaluateBadges(after).filter((item) => item.earned && !had.has(item.badge.id));
};
