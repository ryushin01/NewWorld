import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { CheckIn } from '@/shared/api';
import { createQueryWrapper } from '@/shared/lib/query-test-utils';
import { useCheckins, useCreateCheckin } from './queries';

let mockCheckins: CheckIn[] = [];
jest.mock('@/shared/api', () => ({
  QUERY_ROOTS: { checkins: 'checkins' },
  backend: {
    checkins: {
      list: async () => mockCheckins,
      create: async (checkIn: CheckIn) => {
        mockCheckins = [...mockCheckins, checkIn];
        return checkIn;
      },
    },
  },
}));

it('현장 인증을 저장하면 인증 목록을 다시 받아 보여 줍니다', async () => {
  const { wrapper } = createQueryWrapper();
  const { result } = await renderHook(() => ({ list: useCheckins(), create: useCreateCheckin() }), {
    wrapper,
  });
  await waitFor(() => expect(result.current.list.data).toEqual([]));
  const checkIn: CheckIn = {
    id: 'c1',
    catalogId: 'giza',
    checkedAt: '2026-11-27T00:00:00.000Z',
    latitude: 29.97,
    longitude: 31.13,
    distanceKm: 0.2,
    method: 'demo',
  };
  await act(async () => {
    await result.current.create.mutateAsync(checkIn);
  });
  await waitFor(() =>
    expect(result.current.list.data?.map((item) => item.catalogId)).toEqual(['giza']),
  );
});
