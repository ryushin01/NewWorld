import type { AdminUser, Destination, Report, Stamp } from '@admin/shared/api';
import { dayKey } from '@admin/shared/lib';

const DAY = 24 * 60 * 60 * 1000;

export type DailyCount = { day: string; count: number };

/** 오늘을 포함한 최근 days일의 날짜별 개수(서울 기준). 비어 있는 날은 0입니다. */
export function dailyCounts(dates: string[], days: number, now: Date): DailyCount[] {
  const counts = new Map<string, number>();
  for (const iso of dates) {
    const key = dayKey(new Date(iso));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from({ length: days }, (_, index) => {
    const day = dayKey(new Date(now.getTime() - (days - 1 - index) * DAY));
    return { day, count: counts.get(day) ?? 0 };
  });
}

export type RankedDestination = { destination: Destination; count: number };

/** 스탬프가 많은 여행지 순. 같으면 이름순입니다. */
export function topDestinations(
  stamps: Stamp[],
  destinations: Destination[],
  limit: number,
): RankedDestination[] {
  const counts = new Map<string, number>();
  for (const stamp of stamps)
    counts.set(stamp.destinationId, (counts.get(stamp.destinationId) ?? 0) + 1);
  return destinations
    .flatMap((destination) => {
      const count = counts.get(destination.id) ?? 0;
      return count ? [{ destination, count }] : [];
    })
    .sort((a, b) => b.count - a.count || a.destination.name.localeCompare(b.destination.name, 'ko'))
    .slice(0, limit);
}

export type RankedUser = { user: AdminUser; count: number };

/** 스탬프를 많이 모은 회원 순. 같으면 닉네임순이고, 스탬프가 없는 회원은 뺍니다. */
export function topCollectors(stamps: Stamp[], users: AdminUser[], limit: number): RankedUser[] {
  const counts = new Map<string, number>();
  for (const stamp of stamps) counts.set(stamp.userId, (counts.get(stamp.userId) ?? 0) + 1);
  return users
    .flatMap((user) => {
      const count = counts.get(user.id) ?? 0;
      return count ? [{ user, count }] : [];
    })
    .sort((a, b) => b.count - a.count || a.user.nickname.localeCompare(b.user.nickname, 'ko'))
    .slice(0, limit);
}

export type Overview = {
  users: number;
  recentSignups: number;
  stamps: number;
  recentStamps: number;
  openReports: number;
  hiddenDestinations: number;
};

export function overview(
  input: { users: AdminUser[]; stamps: Stamp[]; reports: Report[]; destinations: Destination[] },
  days: number,
  now: Date,
): Overview {
  const since = now.getTime() - days * DAY;
  const recent = (iso: string) => new Date(iso).getTime() >= since;
  return {
    users: input.users.length,
    recentSignups: input.users.filter((user) => recent(user.createdAt)).length,
    stamps: input.stamps.length,
    recentStamps: input.stamps.filter((stamp) => recent(stamp.checkedAt)).length,
    openReports: input.reports.filter((report) => report.status === 'open').length,
    hiddenDestinations: input.destinations.filter((item) => item.hidden).length,
  };
}
