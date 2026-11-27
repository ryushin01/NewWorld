import { defineConfig } from '@playwright/test';

const PORT = Number(process.env.STORYBOOK_E2E_PORT ?? 6107);

/**
 * 웹 Storybook 정적 빌드(storybook-static, `pnpm run build:storybook`)를 띄워
 * 스토리마다 axe(위반이면 실패)와 시각 회귀(toHaveScreenshot)를 봅니다.
 * 기준 이미지는 Linux CI와 같은 환경에서 만듭니다(docs/development.md의 시각 회귀).
 */
export default defineConfig({
  testDir: '.',
  timeout: 120_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never', outputFolder: '../../playwright-report/storybook' }]]
    : 'list',
  outputDir: '../../test-results/storybook',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' } },
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    viewport: { width: 480, height: 640 },
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'storybook' }],
  webServer: {
    command: `node scripts/serve-web.mjs ${PORT}`,
    cwd: '../..',
    env: { SERVE_DIR: 'storybook-static' },
    url: `http://localhost:${PORT}/index.json`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
