import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import type { ComponentType } from 'react';
import { env } from '@/shared/config';

type Breadcrumb = Parameters<NonNullable<Sentry.ReactNativeOptions['beforeBreadcrumb']>>[0];

/** 서명 주소의 토큰처럼 주소 뒤에 붙은 값은 지웁니다. */
const stripQuery = (url: unknown) => (typeof url === 'string' ? url.split('?')[0] : url);

/**
 * 오류 기록에 개인 내용이 실리지 않게 다듬습니다. 콘솔 기록은 버리고(오류 화면이 남기는 기록 포함),
 * 요청 주소는 쿼리를 지웁니다.
 */
export const scrubBreadcrumb = (breadcrumb: Breadcrumb): Breadcrumb | null => {
  if (breadcrumb.category === 'console') return null;
  if (!breadcrumb.data || !('url' in breadcrumb.data)) return breadcrumb;
  return { ...breadcrumb, data: { ...breadcrumb.data, url: stripQuery(breadcrumb.data.url) } };
};

export const monitoringEnabled = env.sentryDsn !== '';

if (monitoringEnabled) {
  Sentry.init({
    dsn: env.sentryDsn,
    release: `newworld@${Constants.expoConfig?.version ?? 'unknown'}`,
    environment: __DEV__ ? 'development' : 'production',
    // 아이디·IP 같은 개인 정보와 화면 캡처·뷰 구조는 보내지 않습니다. 성능 추적도 무료 한도를 아끼려 끕니다.
    sendDefaultPii: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    enableCaptureFailedRequests: false,
    beforeBreadcrumb: scrubBreadcrumb,
  });
}

/** 오류 화면 등에서 잡은 오류를 보냅니다. DSN이 없으면 아무것도 하지 않습니다. */
export const reportError = (error: unknown) => {
  if (monitoringEnabled) Sentry.captureException(error);
};

/** 앱 뿌리를 감싸 화면 전환·누름 기록과 처리하지 않은 오류를 모읍니다. DSN이 없으면 그대로 둡니다. */
export const withMonitoring = <P extends Record<string, unknown>>(
  component: ComponentType<P>,
): ComponentType<P> => (monitoringEnabled ? Sentry.wrap(component) : component);
