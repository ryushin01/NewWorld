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
  it('코스를 추가·수정·숨기고, 없는 코스나 같은 ID는 오류를 낸다', async () => {
    const backend = createDemoBackend({ storage: null, now: fixed });
    const [first] = await backend.listCourses();
    if (!first) throw new Error('시드가 비었습니다.');
    const { hidden: _hidden, updatedAt: _updatedAt, ...input } = first;
    await expect(backend.saveCourse(input, 'create')).rejects.toMatchObject({ code: 'conflict' });
    await expect(backend.saveCourse({ ...input, id: 'nowhere' }, 'update')).rejects.toMatchObject({
      code: 'not_found',
    });
    await expect(backend.setCourseHidden('nowhere', true)).rejects.toMatchObject({
      code: 'not_found',
    });

    await backend.saveCourse({ ...input, id: 'silk-road', title: '비단길' }, 'create');
    await backend.saveCourse({ ...input, title: '아더왕의 길(개정)' }, 'update');
    await backend.setCourseHidden(first.id, true);
    const courses = await backend.listCourses();
    expect(courses[0]).toMatchObject({ id: 'silk-road', title: '비단길', hidden: false });
    expect(courses.find((item) => item.id === first.id)).toMatchObject({
      title: '아더왕의 길(개정)',
      hidden: true,
      updatedAt: fixed().toISOString(),
    });
  });

  it('뱃지 이름을 고치고 숨기며, 없는 뱃지는 오류를 낸다', async () => {
    const backend = createDemoBackend({ storage: null, now: fixed });
    const saved = await backend.saveBadge('first-step', { name: '첫걸음', description: '처음' });
    expect(saved).toMatchObject({ id: 'first-step', name: '첫걸음', description: '처음' });
    await backend.setBadgeHidden('first-step', true);
    expect((await backend.listBadges()).find((item) => item.id === 'first-step')?.hidden).toBe(
      true,
    );
    await expect(
      backend.saveBadge('nowhere', { name: '없음', description: '' }),
    ).rejects.toMatchObject({ code: 'not_found' });
    await expect(backend.setBadgeHidden('nowhere', true)).rejects.toMatchObject({
      code: 'not_found',
    });
  });

  it('스탬프를 취소하면 목록에서 빠진다', async () => {
    const backend = createDemoBackend({ storage: null, now: fixed });
    const [first] = await backend.listStamps();
    if (!first) throw new Error('시드가 비었습니다.');
    await backend.revokeStamp(first.id);
    expect((await backend.listStamps()).some((item) => item.id === first.id)).toBe(false);
  });

  it('신고를 기각하면 그 신고만 닫고, 없는 신고나 여행지는 오류를 낸다', async () => {
    const backend = createDemoBackend({ storage: null, now: fixed });
    await backend.handleReport(demoReportId(1), 'dismiss', '문제없음');
    const reports = await backend.listReports();
    expect(reports.find((item) => item.id === demoReportId(1))).toMatchObject({
      status: 'dismissed',
      resolutionNote: '문제없음',
    });
    expect(reports.find((item) => item.id === demoReportId(2))?.status).toBe('open');
    await expect(backend.handleReport('nowhere', 'dismiss', '')).rejects.toMatchObject({
      code: 'not_found',
    });
    await expect(backend.setDestinationHidden('nowhere', true)).rejects.toMatchObject({
      code: 'not_found',
    });
  });
});
