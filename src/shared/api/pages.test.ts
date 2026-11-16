import { chunk, fetchAllPages } from './pages';

type Row = { id: string };
const ids = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ id: `r${String(i).padStart(5, '0')}` }));

/** 키 순서로 정렬한 표에서 after 다음 pageSize개를 돌려주는 가짜 서버 */
const server = (rows: Row[], pageSize: number) =>
  jest.fn(async (after: string | null) => ({
    data: rows.filter((row) => after === null || row.id > after).slice(0, pageSize),
    error: null,
  }));

it('1,000행을 넘는 목록도 끝까지 받습니다', async () => {
  const rows = ids(1001);
  const fetchPage = server(rows, 1000);
  await expect(fetchAllPages(fetchPage, (row) => row.id)).resolves.toHaveLength(1001);
  expect(fetchPage.mock.calls).toEqual([[null], ['r00999']]);
});

it('읽는 사이 앞쪽 행이 지워져도 뒤쪽 행을 빠뜨리지 않습니다', async () => {
  const rows = ids(5);
  const fetchPage = jest.fn(async (after: string | null) => {
    const page = rows.filter((row) => after === null || row.id > after).slice(0, 2);
    // 첫 쪽을 받은 뒤 다른 기기가 맨 앞 행을 지웁니다(offset이었다면 r00002가 빠짐).
    if (after === null) rows.shift();
    return { data: page, error: null };
  });
  const result = await fetchAllPages(fetchPage, (row) => row.id, 2);
  expect(result.map((row) => row.id)).toEqual(['r00000', 'r00001', 'r00002', 'r00003', 'r00004']);
});

it('한 쪽이 덜 차면 더 묻지 않습니다', async () => {
  const fetchPage = server(ids(3), 1000);
  await expect(fetchAllPages(fetchPage, (row) => row.id)).resolves.toHaveLength(3);
  expect(fetchPage).toHaveBeenCalledTimes(1);
});

it('조회 오류는 그대로 던집니다', async () => {
  const error = { message: 'JWT expired' };
  await expect(
    fetchAllPages(
      async () => ({ data: null, error }),
      (row: Row) => row.id,
    ),
  ).rejects.toBe(error);
});

it('정한 수만큼 나눕니다', () => {
  expect(chunk(['a', 'b', 'c'], 2)).toEqual([['a', 'b'], ['c']]);
});
