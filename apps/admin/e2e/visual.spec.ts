import { expect, type Page, test } from '@playwright/test';

/**
 * 운영 어드민 주요 화면의 시각 회귀(데스크톱·모바일). 기준 이미지(apps/admin/e2e/__screenshots__)는
 * Linux(CI·Playwright Docker)에서 만들고 macOS에서는 비교하지 않습니다. 시드가 지금 시각 기준이라 날짜를 고정합니다.
 */
test.skip(process.platform !== 'linux', '시각 회귀 기준 이미지는 Linux에서만 비교합니다.');

const NOW = new Date('2026-11-27T03:00:00.000Z');

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every((image) => image.complete));
}

test('로그인과 주요 화면', async ({ page }) => {
  await page.clock.setFixedTime(NOW);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: '관리자로 둘러보기' })).toBeVisible();
  await settle(page);
  await expect(page).toHaveScreenshot('login.png');

  await page.getByRole('button', { name: '관리자로 둘러보기' }).click();
  await expect(page.getByText('처리 대기 신고')).toBeVisible();
  await settle(page);
  await expect(page).toHaveScreenshot('dashboard.png');

  for (const [path, heading, name] of [
    ['/#/destinations', '여행지', 'destinations'],
    ['/#/destinations/giza', '기자 피라미드', 'destination'],
    ['/#/reports', '신고 처리', 'reports'],
    ['/#/users', '사용자', 'users'],
    ['/#/users/5eed0001-0000-4000-8000-000000000000', 'ryushin0', 'user-master'],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await settle(page);
    await expect(page).toHaveScreenshot(`${name}.png`);
  }
});
