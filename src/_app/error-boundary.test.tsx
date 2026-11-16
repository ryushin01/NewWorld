import { fireEvent, render, screen } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AppErrorBoundary } from './error-boundary';

jest.mock('expo-splash-screen', () => ({ hideAsync: jest.fn(() => Promise.resolve()) }));

it('화면 오류 때 빈 화면 대신 안내와 다시 시도를 보여 주고 스플래시를 내립니다', async () => {
  const retry = jest.fn(() => Promise.resolve());
  const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  await render(<AppErrorBoundary error={new Error('boom')} retry={retry} />);
  expect(screen.getByText(/화면을 보여 주지 못했습니다/)).toBeTruthy();
  expect(SplashScreen.hideAsync).toHaveBeenCalled();
  await fireEvent.press(screen.getByLabelText('다시 시도'));
  expect(retry).toHaveBeenCalledTimes(1);
  spy.mockRestore();
});
