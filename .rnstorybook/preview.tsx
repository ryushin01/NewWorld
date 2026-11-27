import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Preview } from '@storybook/react-native';
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
};

export default preview;
