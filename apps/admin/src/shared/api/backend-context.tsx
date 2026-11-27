import { createContext, useContext, type ReactNode } from 'react';
import type { AdminBackend } from './types';

const BackendContext = createContext<AdminBackend | null>(null);

export function BackendProvider({
  backend,
  children,
}: {
  backend: AdminBackend;
  children: ReactNode;
}) {
  return <BackendContext value={backend}>{children}</BackendContext>;
}

export function useBackend() {
  const backend = useContext(BackendContext);
  if (!backend) throw new Error('BackendProvider 안에서만 쓸 수 있습니다.');
  return backend;
}
