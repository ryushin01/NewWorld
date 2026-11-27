import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.WEB_E2E_PORT ?? 4320);

/**
 * 웹 데모(GitHub Pages와 같은 정적 빌드)를 띄워 외부 연결 없이 도는지 검사합니다.
 * `pnpm run test:web`이 `/` 경로로 빌드(EXPO_WEB_BASE_URL=)한 뒤 `scripts/serve-web.mjs`로 dist/를 띄웁니다.
 * GitHub Pages처럼 없는 경로에 404.html(같은 앱)을 주므로 하위 경로를 바로 열 수 있습니다.
 * 포트는 `WEB_E2E_PORT`로 바꿀 수 있습니다.
 * 휴대폰 앱의 화면 흐름은 Maestro(`pnpm run test:e2e`)가 맡습니다.
 */
export default defineConfig({
  testDir: '.',
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'ko-KR',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'mobile', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: `node scripts/serve-web.mjs ${PORT}`,
    // 작업 폴더(저장소 루트)의 dist/를 띄웁니다.
    cwd: '../..',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
