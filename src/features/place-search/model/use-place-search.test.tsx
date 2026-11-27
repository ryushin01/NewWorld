import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { SearchResult } from '@/shared/api';
import { createQueryWrapper } from '@/shared/lib/query-test-utils';
import { usePlaceSearch } from './use-place-search';

const mockPlaces = jest.fn<Promise<SearchResult[]>, [string]>();
jest.mock('@/shared/api', () => ({
  backend: { search: { places: (query: string) => mockPlaces(query) } },
}));

const cusco: SearchResult = {
  id: 's1',
  name: '쿠스코',
  address: '페루 쿠스코주',
  latitude: -13.53,
  longitude: -71.97,
};

beforeEach(() => {
  jest.useFakeTimers();
  mockPlaces.mockReset().mockResolvedValue([cusco]);
});
afterEach(() => jest.useRealTimers());

it('입력을 멈춘 뒤에만 앞뒤 공백을 뺀 검색어로 찾습니다', async () => {
  const { wrapper } = createQueryWrapper();
  const { result, rerender } = await renderHook(
    ({ query }: { query: string }) => usePlaceSearch(query),
    { wrapper, initialProps: { query: '' } },
  );
  expect(mockPlaces).not.toHaveBeenCalled();

  await rerender({ query: ' 쿠' });
  await rerender({ query: ' 쿠스코 ' });
  expect(result.current.term).toBe('');
  await act(async () => {
    jest.advanceTimersByTime(300);
  });
  await waitFor(() => expect(result.current.data).toEqual([cusco]));
  expect(result.current.term).toBe('쿠스코');
  expect(mockPlaces).toHaveBeenCalledTimes(1);
  expect(mockPlaces).toHaveBeenCalledWith('쿠스코');
});
