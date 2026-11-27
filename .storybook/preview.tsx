import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Preview } from '@storybook/react-native-web-vite';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider, View } from 'tamagui';
import { tamaguiConfig } from '../tamagui.config';

// 뱃지·축하 화면처럼 조회 훅을 쓰는 스토리가 있어 Storybook 전용 QueryClient를 둡니다(데모 백엔드).
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const preview: Preview = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
            <View flex={1} padding={16} backgroundColor="white">
              <Story />
            </View>
          </TamaguiProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    // 접근성 위반은 경고가 아니라 오류로 봅니다(addon-a11y 패널과 e2e/storybook 검사).
    // label-content-name-mismatch는 웹 데모 E2E와 같이 아직 고치지 않은 알려진 문제라 끕니다.
    a11y: {
      test: 'error',
      config: { rules: [{ id: 'label-content-name-mismatch', enabled: false }] },
    },
  },
};

export default preview;
