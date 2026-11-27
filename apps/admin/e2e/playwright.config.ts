import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.ADMIN_E2E_PORT ?? 4382);

/**
 * 운영 어드민 데모 빌드(apps/admin/dist, VITE_DEMO=1)를 vite preview로 띄워
 * 외부 요청 없이 데모 입장 → 여행지 추가·수정 → 신고 처리가 되는지, axe 위반이 없는지 봅니다.
 * `pnpm run test:admin:e2e`가 먼저 빌드합니다.
 */
export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never', outputFolder: '../../../playwright-report/admin' }]]
    : 'list',
  outputDir: '../../../test-results/admin',
  // 시각 회귀 기준 이미지는 플랫폼 이름 없이 둡니다(Linux에서만 비교, visual.spec.ts).
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' } },
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `pnpm exec vite preview -c apps/admin/vite.config.mts --port ${PORT} --strictPort`,
    cwd: '../../..',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
