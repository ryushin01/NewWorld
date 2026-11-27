import { DESTINATIONS } from '@/entities/destination';
import { MASTER_CHECKINS } from '@/shared/api/demo-data';
import { MASTER_JOINED_AT, MASTER_VISITS } from '@/shared/api/demo-master';
import { BADGES, evaluateBadges } from './badges';

/** 두 좌표 사이 거리(km, 하버사인) */
const distanceKm = (a: { latitude: number; longitude: number }, b: typeof a) => {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const h =
    Math.sin(rad(b.latitude - a.latitude) / 2) ** 2 +
    Math.cos(rad(a.latitude)) *
      Math.cos(rad(b.latitude)) *
      Math.sin(rad(b.longitude - a.longitude) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};
const DAY = 24 * 60 * 60 * 1000;

describe('ryushin0(마스터) 데모 계정', () => {
  it('카탈로그의 여행지를 빠짐없이 한 번씩, 인증 반경 안에서 다녀왔습니다', () => {
    expect(MASTER_VISITS.map((visit) => visit.catalogId).sort()).toEqual(
      DESTINATIONS.map((item) => item.id).sort(),
    );
    for (const visit of MASTER_VISITS) {
      const destination = DESTINATIONS.find((item) => item.id === visit.catalogId);
      expect(destination).toMatchObject({
        name: visit.name,
        realm: visit.realm,
        location: visit.location,
        group: visit.group,
      });
      if (!destination) continue;
      expect(visit.distanceKm).toBeLessThan(3);
      expect(Math.abs(distanceKm(visit, destination) - visit.distanceKm)).toBeLessThan(0.05);
    }
  });

  it('방문 날짜는 가입 뒤 2년 가까이 고르게 퍼져 있고 미래가 아닙니다', () => {
    const times = MASTER_VISITS.map((visit) => Date.parse(visit.visitedAt));
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(times[0]).toBeGreaterThan(Date.parse(MASTER_JOINED_AT));
    expect(times.at(-1)).toBeLessThanOrEqual(Date.parse('2026-11-27T00:00:00.000Z'));
    expect((times.at(-1) ?? 0) - times[0]).toBeGreaterThan(600 * DAY);
    // 여행 사이가 석 달을 넘게 비지 않습니다.
    for (let i = 1; i < times.length; i += 1)
      expect(times[i] - times[i - 1]).toBeLessThan(90 * DAY);
  });

  it('받을 수 있는 기념 뱃지를 모두 받았고, 획득일은 조건을 채운 인증 날짜입니다', () => {
    const statuses = evaluateBadges(MASTER_CHECKINS);
    expect(statuses).toHaveLength(BADGES.length);
    for (const status of statuses) {
      expect(status.earned).toBe(true);
      expect(status.current).toBe(status.target);
      expect(MASTER_VISITS.some((visit) => visit.visitedAt === status.earnedAt)).toBe(true);
    }
    const byId = new Map(statuses.map((status) => [status.badge.id, status]));
    expect(byId.get('first-step')?.earnedAt).toBe(MASTER_VISITS[0].visitedAt);
    expect(byId.get('collector-25')?.earnedAt).toBe(MASTER_VISITS[24].visitedAt);
    // 코스 완주 뱃지는 코스의 마지막 여행지를 인증한 날 받습니다.
    for (const status of statuses.filter((item) => item.badge.id.startsWith('course-')))
      expect(status.target).toBeGreaterThanOrEqual(2);
  });
});
