import { BADGE_CATALOG } from '@catalog/badge-catalog';
import { FANTASY_DESTINATIONS } from '@catalog/catalog-fantasy';
import { REAL_DESTINATIONS } from '@catalog/catalog-real';
import { COURSES } from '@catalog/courses';
import { MASTER_USER_ID } from '@demo-master';
import { LIMITS, LORES_BY_REALM } from '../types';
import { createSeed, DEMO_ADMIN_ID } from './seed';

/**
 * 목데이터가 실제 DB(supabase/migrations)의 제약과 관계를 지키는지 봅니다.
 * 같은 데이터가 Supabase 시드(supabase/seed/admin-demo.sql)로도 나가므로 여기서 어긋나면 시드도 깨집니다.
 */
const now = new Date('2026-11-27T03:00:00.000Z');
const seed = createSeed(now);
const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/;
const within = (value: string, min: number, max: number) =>
  value.trim().length >= min && value.length <= max;
const ms = (iso: string) => new Date(iso).getTime();

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

describe('어드민 목데이터', () => {
  it('여행지·코스·뱃지는 앱 카탈로그와 같은 원천에서 오고 DB 제약을 지킨다', () => {
    const catalog = [...REAL_DESTINATIONS, ...FANTASY_DESTINATIONS];
    expect(seed.destinations.map((item) => item.id)).toEqual(catalog.map((item) => item.id));
    for (const [index, item] of seed.destinations.entries()) {
      const source = catalog[index];
      expect(item).toMatchObject({
        name: source?.name,
        tagline: source?.tagline,
        overview: source?.overview,
        latitude: source?.latitude,
        longitude: source?.longitude,
      });
      expect(item.id).toMatch(ID_PATTERN);
      expect(LORES_BY_REALM[item.realm]).toContain(item.lore);
      expect(within(item.name, 1, LIMITS.destinationName)).toBe(true);
      expect(within(item.tagline, 1, LIMITS.tagline)).toBe(true);
      expect(within(item.group, 1, LIMITS.group)).toBe(true);
      expect(item.originalName.length).toBeLessThanOrEqual(LIMITS.originalName);
      expect(item.location.length).toBeLessThanOrEqual(LIMITS.location);
      expect(item.era.length).toBeLessThanOrEqual(LIMITS.era);
      expect(item.overview.length).toBeLessThanOrEqual(LIMITS.overview);
      expect(Math.abs(item.latitude)).toBeLessThanOrEqual(90);
      expect(Math.abs(item.longitude)).toBeLessThanOrEqual(180);
    }

    const ids = new Set(seed.destinations.map((item) => item.id));
    expect(seed.courses.map((item) => item.id)).toEqual(COURSES.map((item) => item.id));
    for (const course of seed.courses) {
      expect(course.id).toMatch(ID_PATTERN);
      expect(within(course.title, 1, LIMITS.courseTitle)).toBe(true);
      expect(within(course.summary, 1, LIMITS.courseSummary)).toBe(true);
      expect(course.stops.length).toBeGreaterThanOrEqual(2);
      expect(course.stops.length).toBeLessThanOrEqual(LIMITS.courseStops);
      for (const stop of course.stops) expect(ids.has(stop)).toBe(true);
    }

    expect(seed.badges.map((item) => item.id)).toEqual(BADGE_CATALOG.map((item) => item.id));
    for (const badge of seed.badges) {
      expect(within(badge.name, 1, LIMITS.badgeName)).toBe(true);
      expect(within(badge.description, 1, LIMITS.badgeDescription)).toBe(true);
      expect(badge.rule.length).toBeLessThanOrEqual(60);
    }
    // 코스 완주 뱃지가 코스마다 하나씩 있습니다.
    for (const course of seed.courses)
      expect(seed.badges.some((badge) => badge.id === `course-${course.id}`)).toBe(true);
  });

  it('회원·관리자·로그인 계정·프로필 사진이 서로 맞고, 실제 개인정보는 없다', () => {
    const userIds = seed.users.map((user) => user.id);
    expect(new Set(userIds).size).toBe(userIds.length);
    expect(seed.authUsers.map((user) => user.id)).toEqual(userIds);
    for (const id of userIds) expect(id).toMatch(UUID);

    const emails = seed.authUsers.map((user) => user.email);
    expect(new Set(emails).size).toBe(emails.length);
    for (const email of emails) expect(email).toMatch(/^[a-z0-9-]+@users\.newworld\.app$/);

    expect(seed.admins).toEqual([{ userId: DEMO_ADMIN_ID, createdAt: expect.any(String) }]);
    expect(userIds).toContain(DEMO_ADMIN_ID);
    expect(userIds).toContain(MASTER_USER_ID);

    const files = new Set(seed.avatarObjects.map((file) => file.name));
    for (const user of seed.users) {
      expect(within(user.nickname, 2, 20)).toBe(true);
      expect(ms(user.createdAt)).toBeLessThanOrEqual(now.getTime());
      if (user.avatarPath) {
        expect(user.avatarPath.startsWith(`${user.id}/`)).toBe(true);
        expect(user.avatarPath.length).toBeLessThanOrEqual(200);
        expect(files.has(user.avatarPath)).toBe(true);
      }
    }
    // 본명 칸(profiles.name)은 목데이터에 아예 없습니다.
    for (const user of seed.users) expect(Object.keys(user)).not.toContain('name');
  });

  it('스탬프는 있는 회원·여행지를 잇고, 가입 뒤·지금 전에 인증 반경 안에서 찍혔다', () => {
    const users = new Map(seed.users.map((user) => [user.id, user]));
    const destinations = new Map(seed.destinations.map((item) => [item.id, item]));
    const pairs = new Set<string>();
    for (const stamp of seed.stamps) {
      const user = users.get(stamp.userId);
      const destination = destinations.get(stamp.destinationId);
      if (!user || !destination) throw new Error(`관계가 끊긴 스탬프 ${stamp.id}`);
      expect(stamp.id).toMatch(UUID);
      const pair = `${stamp.userId}:${stamp.destinationId}`;
      expect(pairs.has(pair)).toBe(false);
      pairs.add(pair);
      expect(ms(stamp.checkedAt)).toBeGreaterThanOrEqual(ms(user.createdAt));
      expect(ms(stamp.checkedAt)).toBeLessThanOrEqual(now.getTime());
      expect(stamp.createdAt).toBe(stamp.checkedAt);
      expect(stamp.distanceKm).toBeGreaterThanOrEqual(0);
      expect(stamp.distanceKm).toBeLessThan(3);
      expect(Math.abs(distanceKm(stamp, destination) - stamp.distanceKm)).toBeLessThan(0.05);
    }
    expect(seed.stamps.some((stamp) => stamp.userId === DEMO_ADMIN_ID)).toBe(false);
  });

  it('ryushin0(마스터)은 여행지 55곳을 모두 인증해 모든 코스를 완주했다', () => {
    const mine = seed.stamps.filter((stamp) => stamp.userId === MASTER_USER_ID);
    const stamped = new Set(mine.map((stamp) => stamp.destinationId));
    expect(stamped.size).toBe(55);
    expect(seed.destinations.every((item) => stamped.has(item.id))).toBe(true);
    for (const course of seed.courses)
      expect(course.stops.every((stop) => stamped.has(stop))).toBe(true);
    const master = seed.users.find((user) => user.id === MASTER_USER_ID);
    expect(master).toMatchObject({ nickname: 'ryushin0' });
    expect(master?.avatarPath).toBe(`${MASTER_USER_ID}/avatar.jpg`);
  });

  it('신고는 있는 회원 사이이고, 처리 상태와 처리 기록이 맞는다', () => {
    const userIds = new Set(seed.users.map((user) => user.id));
    const admins = new Set(seed.admins.map((admin) => admin.userId));
    for (const report of seed.reports) {
      expect(report.id).toMatch(UUID);
      expect(userIds.has(report.reporterId)).toBe(true);
      expect(userIds.has(report.targetId)).toBe(true);
      expect(report.reporterId).not.toBe(report.targetId);
      expect(within(report.reason, 1, LIMITS.note)).toBe(true);
      expect(report.resolutionNote.length).toBeLessThanOrEqual(LIMITS.note);
      if (report.status === 'open') {
        expect(report).toMatchObject({ handledAt: null, handledBy: null, resolutionNote: '' });
      } else {
        expect(admins.has(report.handledBy ?? '')).toBe(true);
        expect(ms(report.handledAt ?? '')).toBeGreaterThanOrEqual(ms(report.createdAt));
        expect(ms(report.handledAt ?? '')).toBeLessThanOrEqual(now.getTime());
      }
      // 사진 신고는 사진이 있는 회원에게만 갑니다.
      if (report.target === 'avatar')
        expect(seed.users.find((user) => user.id === report.targetId)?.avatarPath).toBeTruthy();
    }
  });

  it('같은 시각이면 늘 같은 데이터를 만든다(시드 SQL이 바뀌지 않음)', () => {
    expect(createSeed(now)).toEqual(seed);
  });
});
