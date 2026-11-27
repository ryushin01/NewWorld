import type { AdminUser, Destination, Report, Stamp } from '@admin/shared/api';
import { dailyCounts, overview, topDestinations } from './stats';

const now = new Date('2026-11-27T03:00:00.000Z'); // 서울 12:00
const destination = (id: string, name: string): Destination => ({
  id,
  realm: 'real',
  lore: 'fact',
  name,
  originalName: '',
  tagline: '',
  group: '유럽',
  location: '',
  era: '',
  latitude: 0,
  longitude: 0,
  overview: '',
  hidden: id === 'b',
  updatedAt: now.toISOString(),
});
const stamp = (id: string, destinationId: string, checkedAt: string): Stamp => ({
  id,
  userId: 'u1',
  destinationId,
  checkedAt,
  distanceKm: 0.1,
  method: 'gps',
});

describe('dailyCounts', () => {
  it('서울 날짜로 묶고 빈 날은 0으로 채운다', () => {
    const result = dailyCounts(
      ['2026-11-26T16:00:00.000Z', '2026-11-27T01:00:00.000Z', '2026-11-25T10:00:00.000Z'],
      3,
      now,
    );
    expect(result).toEqual([
      { day: '2026-11-25', count: 1 },
      { day: '2026-11-26', count: 0 },
      { day: '2026-11-27', count: 2 },
    ]);
  });
});

describe('topDestinations', () => {
  it('스탬프가 많은 순, 같으면 이름순이고 스탬프 없는 곳은 뺀다', () => {
    const list = [destination('a', '나'), destination('b', '가'), destination('c', '다')];
    const stamps = [
      stamp('1', 'a', now.toISOString()),
      stamp('2', 'b', now.toISOString()),
      stamp('3', 'a', now.toISOString()),
    ];
    expect(
      topDestinations(stamps, list, 5).map((item) => [item.destination.id, item.count]),
    ).toEqual([
      ['a', 2],
      ['b', 1],
    ]);
  });
});

describe('overview', () => {
  it('최근 가입·대기 신고·숨긴 여행지를 센다', () => {
    const users: AdminUser[] = [
      { id: 'u1', nickname: '하나', avatarUrl: null, createdAt: '2026-11-20T00:00:00.000Z' },
      { id: 'u2', nickname: '둘', avatarUrl: null, createdAt: '2026-09-01T00:00:00.000Z' },
    ];
    const reports: Report[] = [
      {
        id: 'r',
        reporterId: 'u1',
        targetId: 'u2',
        target: 'nickname',
        reason: 'x',
        status: 'open',
        resolutionNote: '',
        createdAt: now.toISOString(),
        handledAt: null,
      },
    ];
    expect(
      overview({ users, stamps: [], reports, destinations: [destination('b', '가')] }, 30, now),
    ).toEqual({
      users: 2,
      recentSignups: 1,
      stamps: 0,
      recentStamps: 0,
      openReports: 1,
      hiddenDestinations: 1,
    });
  });
});
