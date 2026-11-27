import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

/**
 * 테스트용 QueryClient와 감싸는 컴포넌트. gcTime이 Infinity면 캐시 정리 타이머를 두지 않아
 * 테스트가 끝난 뒤 작업자가 바로 끝나고, 재시도를 꺼 실패를 바로 확인합니다.
 */
export const createQueryWrapper = () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity, retry: false },
      mutations: { gcTime: Infinity },
    },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
};
