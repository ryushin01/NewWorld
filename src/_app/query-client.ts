import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { QUERY_ROOTS, sync } from '@/shared/api';
import { storageAdapter } from '@/shared/lib';

const DAY = 24 * 60 * 60 * 1000;
const RETRY_INTERVAL = 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    // 조회 함수가 끊긴 상태를 직접 처리해 마지막 값을 돌려주므로 멈추지 않게 합니다.
    queries: { staleTime: 30 * 1000, gcTime: 7 * DAY, retry: 2, networkMode: 'always' },
    mutations: { networkMode: 'always' },
  },
});

const queryPersister = createAsyncStoragePersister({
  storage: storageAdapter,
  key: 'newworld.query-cache',
  throttleTime: 1000,
});

export const persistOptions = {
  persister: queryPersister,
  maxAge: 7 * DAY,
  dehydrateOptions: {
    shouldDehydrateQuery: (query: { state: { status: string }; meta?: Record<string, unknown> }) =>
      query.state.status === 'success' && query.meta?.persist !== false,
  },
};

/** 앱이 앞으로 나오거나 네트워크가 돌아오면 서버와 다시 동기화합니다. */
export const connectQueryManagers = () => {
  // 웹은 인터넷 확인으로 사이트 맨 위(/)를 요청하는데, Pages의 /NewWorld 밖이라 404가 납니다.
  // 앱은 연결 여부(isConnected, 웹은 브라우저의 온라인 상태)만 쓰므로 웹에서는 확인 요청을 끕니다.
  if (Platform.OS === 'web') NetInfo.configure({ reachabilityShouldRun: () => false });
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => {
      const online = state.isConnected !== false;
      setOnline(online);
      sync.setOnline(online);
    }),
  );
  const onAppState = (status: AppStateStatus) => {
    focusManager.setFocused(status === 'active');
    if (status === 'active') void sync.flush({ force: true });
  };
  const subscription = AppState.addEventListener('change', onAppState);
  // 일시적인 서버 오류나 잘못된 연결 상태 보고로 멈춘 전송을 다시 시도합니다.
  const timer = setInterval(() => void sync.flush({ force: true }), RETRY_INTERVAL);
  // 밀린 변경을 올린 뒤에는 서버 데이터 목록만 다시 받습니다(프로필·장소 검색은 동기화와 무관).
  const unsubscribeSynced = sync.onSynced(() => {
    for (const root of Object.values(QUERY_ROOTS)) {
      void queryClient.invalidateQueries({ queryKey: [root] });
    }
  });
  return () => {
    subscription.remove();
    clearInterval(timer);
    unsubscribeSynced();
  };
};
