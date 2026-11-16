import { chunk, fetchAllPages } from './pages';

const pager = (total: number) =>
  jest.fn(async (from: number, to: number) => ({
    data: Array.from(
      { length: Math.max(0, Math.min(to, total - 1) - from + 1) },
      (_, i) => from + i,
    ),
    error: null,
  }));

it('1,000행을 넘는 목록도 끝까지 받습니다', async () => {
  const fetchPage = pager(1001);
  await expect(fetchAllPages(fetchPage)).resolves.toHaveLength(1001);
  expect(fetchPage.mock.calls).toEqual([
    [0, 999],
    [1000, 1999],
  ]);
});

it('한 쪽이 덜 차면 더 묻지 않습니다', async () => {
  const fetchPage = pager(3);
  await expect(fetchAllPages(fetchPage)).resolves.toEqual([0, 1, 2]);
  expect(fetchPage).toHaveBeenCalledTimes(1);
});

it('조회 오류는 그대로 던집니다', async () => {
  const error = { message: 'JWT expired' };
  await expect(fetchAllPages(async () => ({ data: null, error }))).rejects.toBe(error);
});

it('정한 수만큼 나눕니다', () => {
  expect(chunk(['a', 'b', 'c'], 2)).toEqual([['a', 'b'], ['c']]);
});
