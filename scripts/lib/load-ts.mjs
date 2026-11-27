// 저장소의 TypeScript 모듈(앱 카탈로그·어드민 시드)을 Node 스크립트에서 불러옵니다.
// 어드민 Vite 설정의 경로 별칭(@catalog, @demo-master)을 그대로 쓰려고 Vite의 SSR 로더를 씁니다.
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../..', import.meta.url));

export async function withTsModules(run) {
  const server = await createServer({
    configFile: `${root}apps/admin/vite.config.mts`,
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    logLevel: 'error',
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  try {
    return await run((path) => server.ssrLoadModule(path));
  } finally {
    await server.close();
  }
}
