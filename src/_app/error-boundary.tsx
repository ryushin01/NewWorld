import type { ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { TamaguiProvider, View } from 'tamagui';
import { MessageView } from '@/shared/ui';
import { tamaguiConfig } from '../../tamagui.config';
import { reportError } from './monitoring';

/**
 * 화면을 그리다 예외가 나면 Release 앱은 빈 화면으로 멈춥니다. 그 대신 안내와 다시 시도를 보여 줍니다.
 * 루트 레이아웃 전체를 대신해 그려지므로 테마를 다시 두고, 시작 중에 났다면 남은 스플래시를 내립니다.
 */
export const AppErrorBoundary = ({ error, retry }: ErrorBoundaryProps) => {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
    reportError(error);
    console.error(error);
  }, [error]);
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={scheme}>
      <View flex={1} backgroundColor="surface" testID="app-error">
        <MessageView
          message="화면을 보여 주지 못했습니다. 다시 시도해도 같으면 앱을 껐다가 다시 열어 주세요."
          actionLabel="다시 시도"
          onAction={() => void retry()}
        />
      </View>
    </TamaguiProvider>
  );
};
