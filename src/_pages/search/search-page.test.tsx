import { fireEvent, render, screen } from '@testing-library/react-native';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '~/tamagui.config';
import { usePlaceSearch } from '@/features/place-search';
import { SearchPage } from './search-page';

// FlashList는 ESM으로만 배포되어 Jest에서 읽지 못하므로 같은 속성을 받는 FlatList로 대신합니다.
jest.mock('@shopify/flash-list', () => ({
  FlashList: jest.requireActual('react-native').FlatList,
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@/features/place-search', () => ({ usePlaceSearch: jest.fn() }));
jest.mock('@/entities/place', () => ({
  KindIcon: () => null,
  usePlaces: () => ({ data: [] }),
}));
jest.mock('@/shared/api', () => ({ backend: { mode: 'supabase' } }));

type SearchState = {
  data?: { id: string; name: string; address: string; latitude: number; longitude: number }[];
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  error?: Error;
};

const show = async (state: SearchState) => {
  jest.mocked(usePlaceSearch).mockReturnValue({ refetch: jest.fn(), ...state } as never);
  await render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <SearchPage />
    </TamaguiProvider>,
  );
  await fireEvent.changeText(screen.getByTestId('search-input'), '아발론');
};

it('서버 검색을 기다리는 동안에도 도감 결과를 보여 주고, 서버 결과 자리에만 찾는 중을 알립니다', async () => {
  // 입력 직후(디바운스)에는 쿼리가 꺼져 있어도 결과가 오기 전이므로 찾는 중입니다.
  await show({ isPending: true, isFetching: false, isError: false });
  expect(screen.getByTestId('search-destination-avalon')).toBeTruthy();
  expect(screen.getByTestId('search-remote-loading')).toBeTruthy();
  expect(
    screen.queryByText('검색 결과가 없습니다. 지도에서 직접 위치를 설정해 보세요.'),
  ).toBeNull();
  expect(screen.queryByText('검색 중입니다.')).toBeNull();
});

it('서버 결과가 오면 찾는 중 안내를 지웁니다', async () => {
  await show({
    data: [{ id: 'r1', name: 'Glastonbury Tor', address: 'England', latitude: 51, longitude: -2 }],
    isPending: false,
    isFetching: false,
    isError: false,
  });
  expect(screen.getByTestId('search-destination-avalon')).toBeTruthy();
  expect(screen.queryByTestId('search-remote-loading')).toBeNull();
  expect(screen.getByText('새 장소로 추가')).toBeTruthy();
});

it('서버 검색이 실패해도 도감 결과는 두고 실패만 알립니다', async () => {
  await show({ isPending: false, isFetching: false, isError: true, error: new Error('x') });
  expect(screen.getByTestId('search-destination-avalon')).toBeTruthy();
  expect(
    screen.getByText('새 장소를 검색하지 못했습니다. 연결을 확인하거나 지도에서 설정해 주세요.'),
  ).toBeTruthy();
  expect(screen.queryByTestId('search-remote-loading')).toBeNull();
});
