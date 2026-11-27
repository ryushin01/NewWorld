import { expect, type Page, test } from '@playwright/test';

/**
 * 웹 데모 주요 화면의 시각 회귀. 기준 이미지(e2e/web/__screenshots__)는 Linux(CI·Playwright Docker)에서 만들고,
 * 글꼴 렌더링이 다른 macOS에서는 비교하지 않습니다. 날짜를 고정해 "오늘의 여행지" 같은 값이 바뀌지 않게 합니다.
 * 다시 만들기: docs/development.md의 시각 회귀
 */
test.skip(process.platform !== 'linux', '시각 회귀 기준 이미지는 Linux에서만 비교합니다.');

const NOW = new Date('2026-11-27T03:00:00.000Z');

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  // 화면에 보이는 사진만 기다립니다(화면 밖의 lazy 사진은 불러오지 않음).
  await page.waitForFunction(() =>
    [...document.images]
      .filter((image) => {
        const box = image.getBoundingClientRect();
        return box.bottom > 0 && box.top < innerHeight && box.width > 0;
      })
      .every((image) => image.complete),
  );
}

async function enter(page: Page, account: '둘러보기' | 'ryushin0(마스터)로 둘러보기') {
  await page.clock.setFixedTime(NOW);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: account, exact: true }).click();
  await expect(page.getByText('기자 피라미드').first()).toBeVisible({ timeout: 20_000 });
}

test('로그인 화면', async ({ page }) => {
  await page.clock.setFixedTime(NOW);
  await page.goto('/');
  await expect(page.getByRole('button', { name: '둘러보기', exact: true })).toBeVisible();
  await settle(page);
  await expect(page).toHaveScreenshot('sign-in.png');
});

test('둘러보기: 탭과 상세 화면', async ({ page }) => {
  await enter(page, '둘러보기');
  await settle(page);
  await expect(page).toHaveScreenshot('home.png');

  for (const [tab, name] of [
    ['환상', 'fantasy'],
    ['기록', 'records'],
    ['MY', 'my'],
  ] as const) {
    await page.getByRole('tab', { name: tab }).click();
    await settle(page);
    await expect(page).toHaveScreenshot(`${name}.png`);
  }

  for (const [path, text, name] of [
    ['/destination/giza', '고대 7대 불가사의 중 유일하게 남은 곳', 'destination'],
    ['/courses', '아더왕의 길', 'courses'],
  ] as const) {
    await page.goto(path);
    await expect(page.getByText(text).first()).toBeVisible();
    await settle(page);
    await expect(page).toHaveScreenshot(`${name}.png`);
  }
});

test('ryushin0(마스터)의 여행 여권', async ({ page }) => {
  await enter(page, 'ryushin0(마스터)로 둘러보기');
  await page.goto('/passport');
  await expect(page.getByText('기념 뱃지 21/21').first()).toBeVisible();
  await settle(page);
  await expect(page).toHaveScreenshot('master-passport.png');
});
