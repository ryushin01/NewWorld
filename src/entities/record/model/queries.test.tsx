import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { RecordSaveInput, TripRecord } from '@/shared/api';
import { DEMO_RECORDS } from '@/shared/api/demo-data';
import { createQueryWrapper } from '@/shared/lib/query-test-utils';
import { useDeleteRecord, useRecord, useRecords, useSaveRecord } from './queries';

const mockList = jest.fn<Promise<TripRecord[]>, []>();
const mockGet = jest.fn<Promise<TripRecord>, [string]>();
const mockCreate = jest.fn<Promise<TripRecord>, [RecordSaveInput]>();
const mockUpdate = jest.fn<Promise<TripRecord>, [string, RecordSaveInput]>();
const mockRemove = jest.fn<Promise<void>, [string]>();
jest.mock('@/shared/api', () => ({
  QUERY_ROOTS: { places: 'places', records: 'records' },
  backend: {
    records: {
      list: () => mockList(),
      get: (id: string) => mockGet(id),
      create: (input: RecordSaveInput) => mockCreate(input),
      update: (id: string, input: RecordSaveInput) => mockUpdate(id, input),
      remove: (id: string) => mockRemove(id),
    },
  },
}));

const [first] = DEMO_RECORDS;
const { id: _id, placeName: _name, placeKind: _kind, photos: _photos, ...record } = first;
const input: RecordSaveInput = { record, keptPhotos: [], newPhotos: [] };

beforeEach(() => {
  mockList.mockReset().mockResolvedValue(DEMO_RECORDS);
  mockGet.mockReset().mockResolvedValue(first);
  mockCreate.mockReset().mockResolvedValue(first);
  mockUpdate.mockReset().mockResolvedValue(first);
  mockRemove.mockReset().mockResolvedValue();
});

it('장소를 넘기면 그 장소의 기록만 보여 주고, 기록 하나도 불러옵니다', async () => {
  const { wrapper } = createQueryWrapper();
  const { result } = await renderHook(
    () => ({ all: useRecords(), mine: useRecords(first.placeId), one: useRecord(first.id) }),
    { wrapper },
  );
  await waitFor(() => expect(result.current.one.data?.title).toBe(first.title));
  expect(result.current.all.data).toHaveLength(DEMO_RECORDS.length);
  expect(result.current.mine.data?.map((item) => item.id)).toEqual([first.id]);
  // 장소별 목록도 전체 목록 하나를 함께 씁니다.
  expect(mockList).toHaveBeenCalledTimes(1);
});

it('새 기록과 고친 기록을 저장한 뒤 목록을 다시 받습니다', async () => {
  const { wrapper } = createQueryWrapper();
  const { result } = await renderHook(
    () => ({ list: useRecords(), create: useSaveRecord(), update: useSaveRecord(first.id) }),
    { wrapper },
  );
  await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
  await act(async () => {
    await result.current.create.mutateAsync(input);
    await result.current.update.mutateAsync(input);
  });
  expect(mockCreate).toHaveBeenCalledWith(input);
  expect(mockUpdate).toHaveBeenCalledWith(first.id, input);
  await waitFor(() => expect(mockList).toHaveBeenCalledTimes(3));
});

it('지운 기록은 상세 캐시에서 빠집니다', async () => {
  const { wrapper } = createQueryWrapper();
  const { result } = await renderHook(
    () => ({ one: useRecord(first.id), remove: useDeleteRecord() }),
    { wrapper },
  );
  await waitFor(() => expect(result.current.one.isSuccess).toBe(true));
  await act(async () => {
    await result.current.remove.mutateAsync(first.id);
  });
  expect(mockRemove).toHaveBeenCalledWith(first.id);
});
