import { defineConfig, devices } from '@playwright/test';

const PORT = 4320;

/**
 * 웹 데모(GitHub Pages와 같은 정적 빌드)를 띄워 외부 연결 없이 도는지 검사합니다.
 * `pnpm run test:web`이 `/` 경로로 빌드(EXPO_WEB_BASE_URL=)한 뒤 `expo serve`로 dist/를 띄웁니다.
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
    command: `pnpm exec expo serve --port ${PORT}`,
    // expo serve는 작업 폴더의 dist/를 띄웁니다(저장소 루트).
    cwd: '../..',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
