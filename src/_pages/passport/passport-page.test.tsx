import { act, render, screen } from '@testing-library/react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '~/tamagui.config';
import { PassportPage } from './passport-page';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('expo-sharing', () => ({ shareAsync: jest.fn() }));
jest.mock('react-native-view-shot', () => ({ captureRef: jest.fn() }));
jest.mock('sonner-native', () => ({ toast: { error: jest.fn() } }));
jest.mock('@/shared/ui/header', () => ({ Header: () => null }));
jest.mock('@/entities/checkin', () => ({ useCheckins: () => ({ data: [] }) }));
jest.mock('@/entities/place', () => ({ usePlaces: () => ({ data: [] }) }));
jest.mock('@/entities/profile', () => ({
  ProfileAvatar: () => null,
  useProfile: () => ({
    data: { nickname: '여행자', name: '', avatarUrl: null },
    isPending: false,
    fetchStatus: 'idle',
  }),
}));

it('여권 공유를 빠르게 두 번 눌러도 이미지를 한 번만 만들어 공유합니다', async () => {
  let finish: (uri: string) => void = () => undefined;
  jest.mocked(captureRef).mockReturnValue(new Promise((resolve) => (finish = resolve)));
  await render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <PassportPage />
    </TamaguiProvider>,
  );
  // 다음 렌더를 기다리지 않고 같은 처리기를 연달아 부릅니다(fireEvent는 누를 때마다 렌더를 기다림).
  // Tamagui의 눌림 요소는 누름을 onClick으로 받습니다.
  const { onClick } = screen.getByTestId('passport-share').props as { onClick: () => void };
  await act(async () => {
    onClick();
    onClick();
  });
  await act(async () => finish('file:///passport.png'));
  expect(captureRef).toHaveBeenCalledTimes(1);
  expect(Sharing.shareAsync).toHaveBeenCalledTimes(1);
  expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///passport.png', {
    mimeType: 'image/png',
    dialogTitle: '신세계 여권 공유',
  });
});
