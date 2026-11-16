import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import type { Destination } from '@/entities/destination';
import { backend, type Place } from '@/shared/api';
import { useEnsureCatalogPlace, useToggleWish } from './use-destination-save';

jest.mock('@/shared/api', () => ({
  ...jest.requireActual('@/shared/api/query-roots'),
  backend: { places: { list: jest.fn(), create: jest.fn(), update: jest.fn() } },
}));

const places = jest.mocked(backend.places);

const destination = {
  id: 'petra',
  realm: 'real',
  name: '페트라',
  location: '요르단',
  latitude: 30,
  longitude: 35,
  group: '아시아',
} as Destination;

const saved = {
  id: 'p1',
  name: '페트라',
  kind: 'real',
  address: '요르단',
  latitude: 30,
  longitude: 35,
  memo: '',
  tags: [],
  catalogId: 'petra',
  wishlisted: true,
  recordCount: 1,
  lastVisitedAt: null,
  createdAt: '',
} as Place;

// gcTime이 Infinity면 캐시 정리 타이머를 두지 않아 테스트가 끝난 뒤 작업자가 바로 끝납니다.
const testClient = () =>
  new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity }, mutations: { gcTime: Infinity } },
  });

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={testClient()}>{children}</QueryClientProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  places.create.mockResolvedValue(saved);
  places.update.mockResolvedValue(saved);
});

it('더블 클릭해도 장소를 한 번만 만듭니다', async () => {
  places.list.mockResolvedValue([]);
  const { result } = await renderHook(() => useToggleWish(), { wrapper });
  await act(async () => {
    result.current(destination);
    result.current(destination);
  });
  await waitFor(() => expect(places.create).toHaveBeenCalledTimes(1));
  expect(places.create.mock.calls[0][0]).toMatchObject({ catalogId: 'petra', wishlisted: true });
});

it('이미 저장했으면 새로 만들지 않고 표시만 바꿉니다', async () => {
  places.list.mockResolvedValue([saved]);
  const { result } = await renderHook(() => useToggleWish(), { wrapper });
  await act(async () => result.current(destination));
  await waitFor(() => expect(places.update).toHaveBeenCalledTimes(1));
  expect(places.create).not.toHaveBeenCalled();
  expect(places.update.mock.calls[0][1]).toMatchObject({ wishlisted: false });
});

it('기록용 장소는 저장된 행을 재사용합니다', async () => {
  places.list.mockResolvedValue([saved]);
  const { result } = await renderHook(() => useEnsureCatalogPlace(), { wrapper });
  await expect(result.current(destination)).resolves.toBe('p1');
  expect(places.create).not.toHaveBeenCalled();
});
