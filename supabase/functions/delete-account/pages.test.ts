import { chunk, fetchAllPages } from './pages';

type Row = { storage_path: string };
const paths = (count: number): Row[] =>
  Array.from({ length: count }, (_, i) => ({
    storage_path: `u/r/${String(i).padStart(5, '0')}.jpg`,
  }));

const server = (rows: Row[], pageSize: number) =>
  jest.fn(async (after: string | null) => ({
    data: rows.filter((row) => after === null || row.storage_path > after).slice(0, pageSize),
    error: null,
  }));

it('1,000행을 넘어도 마지막 경로 다음부터 끝까지 읽습니다', async () => {
  const fetchPage = server(paths(2500), 1000);
  const rows = await fetchAllPages(fetchPage, (row) => row.storage_path);
  expect(rows).toHaveLength(2500);
  expect(fetchPage.mock.calls).toEqual([[null], ['u/r/00999.jpg'], ['u/r/01999.jpg']]);
});

it('딱 나누어떨어지면 빈 쪽을 한 번 더 읽고 멈춥니다', async () => {
  const fetchPage = server(paths(2000), 1000);
  await expect(fetchAllPages(fetchPage, (row) => row.storage_path)).resolves.toHaveLength(2000);
  expect(fetchPage).toHaveBeenCalledTimes(3);
});

it('조회가 실패하면 지우지 않도록 오류를 던집니다', async () => {
  const error = new Error('timeout');
  await expect(
    fetchAllPages(
      async () => ({ data: null, error }),
      (row: Row) => row.storage_path,
    ),
  ).rejects.toBe(error);
});

it('경로를 정한 수만큼 나눕니다', () => {
  expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  expect(chunk([], 100)).toEqual([]);
});
