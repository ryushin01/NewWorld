import { act, renderHook } from '@testing-library/react-native';
import type { Session } from '@/shared/api';
import { useSessionBootstrap, useSessionStore } from './session';

let mockCached: Session | null = null;
let mockResolve: (session: Session | null) => void = () => undefined;
let mockReject: (error: Error) => void = () => undefined;
let mockListener: (session: Session | null) => void = () => undefined;
const mockUnsubscribe = jest.fn();
jest.mock('@/shared/api', () => ({
  backend: {
    auth: {
      getCachedSession: () => mockCached,
      getSession: () =>
        new Promise<Session | null>((resolve, reject) => {
          mockResolve = resolve;
          mockReject = reject;
        }),
      subscribe: (listener: (session: Session | null) => void) => {
        mockListener = listener;
        return mockUnsubscribe;
      },
    },
  },
}));

const guest: Session = { userId: 'u1', username: 'guest' };

beforeEach(() => {
  mockCached = null;
  useSessionStore.setState({ session: null, ready: false });
});

it('기기에 남은 세션으로 먼저 시작하고, 확인이 실패해도 그대로 둡니다', async () => {
  mockCached = guest;
  await renderHook(() => useSessionBootstrap());
  expect(useSessionStore.getState()).toMatchObject({ session: guest, ready: true });
  await act(async () => mockReject(new Error('offline')));
  expect(useSessionStore.getState().session).toEqual(guest);
});

it('남은 세션이 없고 확인도 실패하면 로그아웃 상태로 준비를 끝냅니다', async () => {
  await renderHook(() => useSessionBootstrap());
  expect(useSessionStore.getState().ready).toBe(false);
  await act(async () => mockReject(new Error('offline')));
  expect(useSessionStore.getState()).toMatchObject({ session: null, ready: true });
});

it('서버 세션과 이후 바뀐 세션을 반영하고, 끝나면 구독을 풉니다', async () => {
  const { unmount } = await renderHook(() => useSessionBootstrap());
  await act(async () => mockResolve(guest));
  expect(useSessionStore.getState().session).toEqual(guest);
  await act(async () => mockListener(null));
  expect(useSessionStore.getState().session).toBeNull();
  await unmount();
  expect(mockUnsubscribe).toHaveBeenCalled();
});
