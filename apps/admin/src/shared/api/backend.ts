import { env } from '../config/env';
import type { AdminBackend } from './types';

let pending: Promise<AdminBackend> | null = null;

/**
 * 모드에 맞는 백엔드를 한 번만 불러옵니다.
 * 데모 빌드에서는 Supabase 클라이언트 조각을 내려받지 않습니다(오프라인·번들 크기).
 */
export function loadBackend(): Promise<AdminBackend> {
  pending ??= env.demo
    ? import('./demo/demo-backend').then(({ createDemoBackend }) => createDemoBackend())
    : import('./supabase-backend').then(({ supabaseBackend }) => supabaseBackend);
  return pending;
}
