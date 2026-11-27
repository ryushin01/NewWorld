import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ChecklistItem } from '@/shared/api';
import { createQueryWrapper } from '@/shared/lib/query-test-utils';
import { useChecklist, useRemoveChecklist, useUpsertChecklist } from './queries';

const mockList = jest.fn<Promise<ChecklistItem[]>, []>();
const mockUpsert = jest.fn<Promise<void>, [ChecklistItem[]]>();
const mockRemove = jest.fn<Promise<void>, [string[]]>();
jest.mock('@/shared/api', () => ({
  QUERY_ROOTS: { checklist: 'checklist' },
  backend: {
    checklist: {
      list: () => mockList(),
      upsert: (items: ChecklistItem[]) => mockUpsert(items),
      remove: (ids: string[]) => mockRemove(ids),
    },
  },
}));

const item = (id: string, position: number, checked = false): ChecklistItem => ({
  id,
  title: id,
  category: 'docs',
  checked,
  position,
  listName: '기본',
});

const setup = async () => {
  const { wrapper } = createQueryWrapper();
  const { result } = await renderHook(
    () => ({ list: useChecklist(), upsert: useUpsertChecklist(), remove: useRemoveChecklist() }),
    { wrapper },
  );
  await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
  return { result };
};

beforeEach(() => {
  mockList.mockReset().mockResolvedValue([item('a', 0), item('b', 1)]);
  mockUpsert.mockReset().mockResolvedValue();
  mockRemove.mockReset().mockResolvedValue();
});

it('체크 항목을 응답을 기다리지 않고 바로 바꾸고 순서를 지킵니다', async () => {
  let finish: () => void = () => undefined;
  mockUpsert.mockImplementation(() => new Promise<void>((resolve) => (finish = resolve)));
  const { result } = await setup();
  await act(async () => {
    result.current.upsert.mutate([item('c', 0.5), item('a', 0, true)]);
  });
  await waitFor(() =>
    expect(result.current.list.data?.map((entry) => [entry.id, entry.checked])).toEqual([
      ['a', true],
      ['c', false],
      ['b', false],
    ]),
  );
  await act(async () => finish());
});

it('저장이 실패하면 바꾸기 전 목록으로 되돌립니다', async () => {
  mockRemove.mockRejectedValue(new Error('거절'));
  mockList
    .mockResolvedValueOnce([item('a', 0), item('b', 1)])
    .mockResolvedValue([item('a', 0), item('b', 1)]);
  const { result } = await setup();
  await act(async () => {
    result.current.remove.mutate(['a']);
  });
  await waitFor(() => expect(result.current.remove.isError).toBe(true));
  expect(result.current.list.data?.map((entry) => entry.id)).toEqual(['a', 'b']);
});

it('지운 항목은 목록에서 빠집니다', async () => {
  mockList.mockResolvedValueOnce([item('a', 0), item('b', 1)]).mockResolvedValue([item('b', 1)]);
  const { result } = await setup();
  await act(async () => {
    result.current.remove.mutate(['a']);
  });
  await waitFor(() => expect(result.current.remove.isSuccess).toBe(true));
  expect(mockRemove).toHaveBeenCalledWith(['a']);
  await waitFor(() => expect(result.current.list.data?.map((entry) => entry.id)).toEqual(['b']));
});
