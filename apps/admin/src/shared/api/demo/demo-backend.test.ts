import { COURSES } from '@catalog/courses';
import { AdminError } from '../types';
import { createDemoBackend, DEMO_STORAGE_KEY } from './demo-backend';
import { demoReportId, demoUserId } from './seed';

const fixed = () => new Date('2026-11-27T03:00:00.000Z');

describe('데모 백엔드', () => {
  it('시드에 앱 카탈로그 여행지·코스와 신고가 들어 있고, 코스의 여행지는 모두 실제로 있다', async () => {
    const backend = createDemoBackend({ storage: null, now: fixed });
    const destinations = await backend.listDestinations();
    const ids = new Set(destinations.map((item) => item.id));
    expect(destinations.length).toBe(55);
    expect((await backend.listCourses()).length).toBe(COURSES.length);
    for (const course of COURSES) for (const stop of course.stops) expect(ids.has(stop)).toBe(true);
    for (const stamp of await backend.listStamps()) expect(ids.has(stamp.destinationId)).toBe(true);
    expect((await backend.listReports()).filter((report) => report.status === 'open')).toHaveLength(
      5,
    );
  });

  it('같은 ID로 여행지를 새로 만들면 conflict 오류를 낸다', async () => {
    const backend = createDemoBackend({ storage: null, now: fixed });
    const [first] = await backend.listDestinations();
    if (!first) throw new Error('시드가 비었습니다.');
    await expect(backend.saveDestination(first, 'create')).rejects.toMatchObject({
      code: 'conflict',
    });
    await expect(
      backend.saveDestination({ ...first, id: 'nowhere' }, 'update'),
    ).rejects.toBeInstanceOf(AdminError);
  });

  it('추가·숨기기가 브라우저 저장소에 남고, 초기화하면 처음 시드로 돌아간다', async () => {
    const backend = createDemoBackend({ storage: localStorage, now: fixed });
    const [first] = await backend.listDestinations();
    if (!first) throw new Error('시드가 비었습니다.');
    await backend.saveDestination({ ...first, id: 'new-place', name: '새 여행지' }, 'create');
    await backend.setDestinationHidden(first.id, true);

    const again = createDemoBackend({ storage: localStorage, now: fixed });
    const list = await again.listDestinations();
    expect(list[0]?.name).toBe('새 여행지');
    expect(list.find((item) => item.id === first.id)?.hidden).toBe(true);

    await again.resetDemo?.();
    expect((await again.listDestinations()).some((item) => item.id === 'new-place')).toBe(false);
  });

  it('깨진 저장값은 버리고 새 시드로 시작한다', async () => {
    localStorage.setItem(DEMO_STORAGE_KEY, '{"version":1,"destinations":"망가짐"}');
    const backend = createDemoBackend({ storage: localStorage, now: fixed });
    expect((await backend.listDestinations()).length).toBe(55);
  });

  it('닉네임 신고를 조치하면 닉네임을 초기화하고 같은 항목의 다른 신고도 닫는다', async () => {
    const backend = createDemoBackend({ storage: null, now: fixed });
    await backend.handleReport(demoReportId(1), 'reset_nickname', '광고 닉네임');
    const reports = await backend.listReports();
    expect(reports.find((item) => item.id === demoReportId(1))?.status).toBe('resolved');
    expect(reports.find((item) => item.id === demoReportId(2))?.status).toBe('resolved');
    const user = (await backend.listUsers()).find((item) => item.id === demoUserId(25));
    expect(user?.nickname).toBe('여행자0019');
    await expect(backend.handleReport(demoReportId(1), 'dismiss', '다시')).rejects.toMatchObject({
      code: 'conflict',
    });
  });

  it('사진 신고를 조치하면 프로필 사진을 내린다', async () => {
    const backend = createDemoBackend({ storage: null, now: fixed });
    await backend.handleReport(demoReportId(3), 'remove_avatar', '불쾌한 사진');
    expect(
      (await backend.listUsers()).find((item) => item.id === demoUserId(26))?.avatarUrl,
    ).toBeNull();
  });

  it('입장하면 세션이 생기고 나가면 사라진다', async () => {
    const backend = createDemoBackend({ storage: localStorage, now: fixed });
    expect(await backend.getSession()).toBeNull();
    await backend.signIn();
    expect(await backend.getSession()).toEqual({ name: '데모 관리자', demo: true });
    await backend.signOut();
    expect(await backend.getSession()).toBeNull();
  });
});
