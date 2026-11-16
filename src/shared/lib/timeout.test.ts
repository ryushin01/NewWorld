import { withTimeout } from './timeout';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it('먼저 끝나면 그 값을 돌려주고 타이머를 남기지 않습니다', async () => {
  await expect(withTimeout(Promise.resolve('done'), 5000, 'late')).resolves.toBe('done');
  expect(jest.getTimerCount()).toBe(0);
});

it('시간 안에 끝나지 않으면 fallback을 돌려줍니다', async () => {
  const result = withTimeout(new Promise<string>(() => undefined), 5000, null);
  jest.advanceTimersByTime(5000);
  await expect(result).resolves.toBeNull();
  expect(jest.getTimerCount()).toBe(0);
});

it('실패하면 그 오류를 그대로 던지고 타이머를 지웁니다', async () => {
  await expect(withTimeout(Promise.reject(new Error('boom')), 5000, false)).rejects.toThrow('boom');
  expect(jest.getTimerCount()).toBe(0);
});
