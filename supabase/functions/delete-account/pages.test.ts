import { chunk, fetchAllPages } from './pages';

const pager = (total: number) =>
  jest.fn(async (from: number, to: number) => ({
    data: Array.from(
      { length: Math.max(0, Math.min(to, total - 1) - from + 1) },
      (_, i) => from + i,
    ),
    error: null,
  }));

it('1,000행을 넘어도 끝까지 나눠 읽습니다', async () => {
  const fetchPage = pager(2500);
  const rows = await fetchAllPages(fetchPage);
  expect(rows).toHaveLength(2500);
  expect(rows.at(-1)).toBe(2499);
  expect(fetchPage.mock.calls).toEqual([
    [0, 999],
    [1000, 1999],
    [2000, 2999],
  ]);
});

it('딱 나누어떨어지면 빈 쪽을 한 번 더 읽고 멈춥니다', async () => {
  const fetchPage = pager(2000);
  await expect(fetchAllPages(fetchPage)).resolves.toHaveLength(2000);
  expect(fetchPage).toHaveBeenCalledTimes(3);
});

it('조회가 실패하면 지우지 않도록 오류를 던집니다', async () => {
  const error = new Error('timeout');
  await expect(fetchAllPages(async () => ({ data: null, error }))).rejects.toBe(error);
});

it('경로를 정한 수만큼 나눕니다', () => {
  expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  expect(chunk([], 100)).toEqual([]);
});
