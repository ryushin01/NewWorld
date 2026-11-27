import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { Place, PlaceInput } from '@/shared/api';
import { DEMO_PLACES } from '@/shared/api/demo-data';
import { createQueryWrapper } from '@/shared/lib/query-test-utils';
import { placeKeys, useDeletePlace, usePlace, usePlaces, useSavePlace } from './queries';

const mockList = jest.fn<Promise<Place[]>, []>();
const mockGet = jest.fn<Promise<Place>, [string]>();
const mockCreate = jest.fn<Promise<Place>, [PlaceInput]>();
const mockUpdate = jest.fn<Promise<Place>, [string, PlaceInput]>();
const mockRemove = jest.fn<Promise<void>, [string]>();
jest.mock('@/shared/api', () => ({
  QUERY_ROOTS: { places: 'places', records: 'records' },
  backend: {
    places: {
      list: () => mockList(),
      get: (id: string) => mockGet(id),
      create: (input: PlaceInput) => mockCreate(input),
      update: (id: string, input: PlaceInput) => mockUpdate(id, input),
      remove: (id: string) => mockRemove(id),
    },
  },
}));

const [first, second] = DEMO_PLACES;
const input: PlaceInput = {
  name: first.name,
  kind: first.kind,
  address: first.address,
  latitude: first.latitude,
  longitude: first.longitude,
  memo: '',
  tags: [],
  catalogId: null,
  wishlisted: false,
};

beforeEach(() => {
  mockList.mockReset().mockResolvedValue(DEMO_PLACES);
  mockGet.mockReset().mockImplementation(async (id) => {
    const found = DEMO_PLACES.find((place) => place.id === id);
    if (!found) throw new Error('장소를 찾을 수 없습니다.');
    return found;
  });
  mockCreate.mockReset().mockResolvedValue(first);
  mockUpdate.mockReset().mockResolvedValue(first);
  mockRemove.mockReset().mockResolvedValue();
});

it('장소 목록과 장소 하나를 불러옵니다', async () => {
  const { wrapper } = createQueryWrapper();
  const { result } = await renderHook(() => ({ list: usePlaces(), one: usePlace(second.id) }), {
    wrapper,
  });
  await waitFor(() => expect(result.current.one.data?.name).toBe(second.name));
  expect(result.current.list.data).toHaveLength(DEMO_PLACES.length);
});

it('꺼 둔 장소 조회는 요청하지 않습니다', async () => {
  const { wrapper } = createQueryWrapper();
  const { result } = await renderHook(() => usePlace('', { enabled: false }), { wrapper });
  expect(result.current.fetchStatus).toBe('idle');
  expect(mockGet).not.toHaveBeenCalled();
});

it('id가 없으면 새로 만들고, 있으면 고친 뒤 목록을 다시 받습니다', async () => {
  const { wrapper } = createQueryWrapper();
  const { result } = await renderHook(
    () => ({ list: usePlaces(), create: useSavePlace(), update: useSavePlace(first.id) }),
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

it('지운 장소는 상세 캐시에서 빼고 목록을 다시 받습니다', async () => {
  const { client, wrapper } = createQueryWrapper();
  const { result } = await renderHook(() => ({ list: usePlaces(), remove: useDeletePlace() }), {
    wrapper,
  });
  await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
  client.setQueryData(placeKeys.detail(first.id), first);
  await act(async () => {
    await result.current.remove.mutateAsync(first.id);
  });
  expect(mockRemove).toHaveBeenCalledWith(first.id);
  expect(client.getQueryData(placeKeys.detail(first.id))).toBeUndefined();
});
