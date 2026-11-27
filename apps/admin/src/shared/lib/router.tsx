import {
  createContext,
  useContext,
  useSyncExternalStore,
  type AnchorHTMLAttributes,
  type ReactNode,
} from 'react';

/**
 * 해시 주소(#/destinations) 라우터. GitHub Pages 하위 경로(/NewWorld/admin/)에서
 * 새로고침해도 404가 나지 않고, 서버 설정 없이 오프라인에서도 돕니다.
 * '#main'처럼 '/'로 시작하지 않는 해시는 화면 이동으로 보지 않습니다.
 */
const subscribe = (callback: () => void) => {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
};

let lastPath = '/';
const readPath = () => {
  const hash = window.location.hash;
  if (hash.startsWith('#/')) lastPath = hash.slice(1).split('?')[0] ?? '/';
  else if (!hash) lastPath = '/';
  return lastPath;
};

export function usePath() {
  return useSyncExternalStore(subscribe, readPath, () => '/');
}

export function navigate(to: string, options: { replace?: boolean } = {}) {
  const url = `${window.location.pathname}${window.location.search}#${to}`;
  if (options.replace) {
    window.history.replaceState(null, '', url);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = to;
  }
}

/** '/destinations/:id/edit' 같은 패턴과 주소를 맞춰 보고 매개변수를 돌려줍니다. */
export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params: Record<string, string> = {};
  for (const [index, part] of patternParts.entries()) {
    const value = pathParts[index] ?? '';
    if (part.startsWith(':')) params[part.slice(1)] = decodeURIComponent(value);
    else if (part !== value) return null;
  }
  return params;
}

const ParamsContext = createContext<Record<string, string>>({});
export const ParamsProvider = ({
  params,
  children,
}: {
  params: Record<string, string>;
  children: ReactNode;
}) => <ParamsContext value={params}>{children}</ParamsContext>;

export function useParam(name: string) {
  return useContext(ParamsContext)[name] ?? '';
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string };

/** 앱 안 이동 링크. 실제 <a href="#/…">라 새 탭 열기·복사도 됩니다. */
export function Link({ to, children, ...rest }: LinkProps) {
  return (
    <a href={`#${to}`} {...rest}>
      {children}
    </a>
  );
}
