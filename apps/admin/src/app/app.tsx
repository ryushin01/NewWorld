import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { BackendProvider, type AdminBackend } from '@admin/shared/api';
import { matchPath, navigate, ParamsProvider, usePath } from '@admin/shared/lib';
import { AnnouncerProvider, ErrorState, Loading } from '@admin/shared/ui';
import { useSession } from '@admin/entities/session';
import { LoginPage } from '@admin/pages/login';
import { NotFoundPage } from '@admin/pages/not-found';
import { LoadingScreen } from '@admin/widgets/loading-screen';
import { Shell } from '@admin/widgets/shell';
import { ROUTES } from './routes';

function Router() {
  const path = usePath();
  const session = useSession();
  const previous = useRef<{ path: string; signedIn: boolean | undefined } | null>(null);
  const signedIn = session.data === undefined ? undefined : Boolean(session.data);

  // 화면이 바뀌거나 막 로그인했으면 새 화면의 제목(h1)으로 초점을 옮겨 화면 낭독기가 바뀐 화면을 알 수 있게 합니다.
  // 처음 열거나 새로고침했을 때는 옮기지 않아 Tab이 본문 바로가기부터 시작합니다.
  useEffect(() => {
    const before = previous.current;
    previous.current = { path, signedIn };
    if (signedIn === undefined || !before || before.signedIn === undefined) return;
    if (before.path === path && before.signedIn === signedIn) return;
    window.scrollTo(0, 0);
    const frame = requestAnimationFrame(() => {
      const title = document.querySelector<HTMLElement>('[data-page-title]');
      title?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [path, signedIn]);

  useEffect(() => {
    if (session.data && (path === '/' || path === '/login'))
      navigate('/dashboard', { replace: true });
  }, [path, session.data]);

  if (session.isPending) return <Loading label="관리자 정보를 확인하는 중입니다" />;
  if (session.error) {
    return (
      <>
        <ErrorState error={session.error} />
        <LoginPage />
      </>
    );
  }
  if (!session.data) return <LoginPage />;

  for (const route of ROUTES) {
    const params = matchPath(route.pattern, path);
    if (params) {
      return (
        <Shell session={session.data}>
          <ParamsProvider params={params}>
            <route.Page />
          </ParamsProvider>
        </Shell>
      );
    }
  }
  return (
    <Shell session={session.data}>
      {path === '/' || path === '/login' ? <Loading /> : <NotFoundPage />}
    </Shell>
  );
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
    },
  });
}

/** 백엔드(데모·Supabase)를 받아 쿼리·알림·라우터를 묶습니다. 테스트는 백엔드를 직접 넘깁니다. */
export function App({
  backend,
  queryClient,
}: {
  backend: AdminBackend;
  queryClient?: QueryClient;
}) {
  const [client] = useState(() => queryClient ?? createQueryClient());
  return (
    <QueryClientProvider client={client}>
      <BackendProvider backend={backend}>
        <AnnouncerProvider>
          <LoadingScreen />
          <Router />
        </AnnouncerProvider>
      </BackendProvider>
    </QueryClientProvider>
  );
}
