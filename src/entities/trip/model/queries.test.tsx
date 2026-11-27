import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { Trip } from '@/shared/api';
import { createQueryWrapper } from '@/shared/lib/query-test-utils';
import { useDeleteTrip, useSaveTrip, useTrip, useTrips } from './queries';

let mockTrips: Trip[] = [];
jest.mock('@/shared/api', () => ({
  QUERY_ROOTS: { trips: 'trips' },
  backend: {
    trips: {
      list: async () => mockTrips,
      save: async (trip: Trip) => {
        mockTrips = [trip, ...mockTrips.filter((item) => item.id !== trip.id)];
        return trip;
      },
      remove: async (id: string) => {
        mockTrips = mockTrips.filter((item) => item.id !== id);
      },
    },
  },
}));

const trip: Trip = {
  id: 't1',
  title: '아더왕의 길 걷기',
  startDate: '2027-05-01',
  endDate: '2027-05-09',
  stops: ['stonehenge', 'avalon'],
  memo: '',
};

beforeEach(() => {
  mockTrips = [];
});

it('저장한 여정이 목록과 상세에 보이고, 지우면 사라집니다', async () => {
  const { wrapper } = createQueryWrapper();
  const { result } = await renderHook(
    () => ({ list: useTrips(), one: useTrip('t1'), save: useSaveTrip(), remove: useDeleteTrip() }),
    { wrapper },
  );
  await waitFor(() => expect(result.current.list.data).toEqual([]));
  expect(result.current.one.data).toBeUndefined();

  await act(async () => {
    await result.current.save.mutateAsync(trip);
  });
  await waitFor(() => expect(result.current.one.data?.title).toBe('아더왕의 길 걷기'));

  await act(async () => {
    await result.current.remove.mutateAsync('t1');
  });
  await waitFor(() => expect(result.current.list.data).toEqual([]));
});
