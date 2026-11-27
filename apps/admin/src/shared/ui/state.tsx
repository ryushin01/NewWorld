import type { ReactNode } from 'react';

export function Loading({ label = '불러오는 중입니다' }: { label?: string }) {
  return (
    <p className="state" role="status">
      {label}…
    </p>
  );
}

export function ErrorState({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : '알 수 없는 오류가 났습니다.';
  return (
    <p className="state state--error" role="alert">
      {message}
    </p>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="state">{children}</p>;
}
