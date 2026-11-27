import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { z } from 'zod';

/**
 * Storybook의 모든 스토리를 하나씩 열어 axe 위반이 있으면 실패하고(.storybook/preview.tsx의 a11y.test='error'와 같음),
 * 스토리 화면을 기준 이미지와 비교합니다. 시각 회귀는 Linux(CI·Playwright Docker)에서만 비교합니다.
 */
const indexSchema = z.object({
  entries: z.record(z.string(), z.object({ id: z.string(), type: z.string(), title: z.string() })),
});
const index = indexSchema.parse(
  JSON.parse(readFileSync(join(__dirname, '../../storybook-static/index.json'), 'utf8')),
);
const stories = Object.values(index.entries).filter((entry) => entry.type === 'story');
const visual = process.platform === 'linux';

test('스토리가 있다', () => {
  expect(stories.length).toBeGreaterThan(0);
});

for (const story of stories) {
  test(`${story.title} / ${story.id}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    // 날짜를 고정해 "오늘" 같은 값이 바뀌어도 화면이 같게 합니다.
    await page.clock.setFixedTime(new Date('2026-11-27T03:00:00.000Z'));
    // addon-a11y가 스토리를 열 때 스스로 axe를 돌리면 겹치므로 수동 모드로 엽니다.
    await page.goto(`/iframe.html?viewMode=story&id=${story.id}&globals=a11y.manual:!true`);
    // 스토리를 그리면 Storybook이 body에 sb-show-main을, 실패하면 sb-show-errordisplay를 붙입니다
    // (모달은 #storybook-root 밖에 그려지므로 body로 판단합니다).
    await page.waitForFunction(() =>
      ['sb-show-main', 'sb-show-errordisplay'].some((name) =>
        document.body.classList.contains(name),
      ),
    );
    expect(await page.locator('body').getAttribute('class')).toContain('sb-show-main');
    // 모달이 나타나는 중(투명도 변화)에 대비를 재지 않도록 애니메이션이 끝나기를 기다립니다.
    await page.waitForFunction(() =>
      document
        .getAnimations()
        // 돌림표처럼 끝없이 도는 애니메이션은 기다리지 않습니다.
        .every(
          (animation) =>
            animation.playState !== 'running' ||
            animation.effect?.getTiming().iterations === Infinity,
        ),
    );
    await page.evaluate(() => document.fonts.ready);

    const { violations } = await new AxeBuilder({ page })
      .exclude('#storybook-docs')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .disableRules(['label-content-name-mismatch'])
      .analyze();
    expect(
      violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
    ).toEqual([]);
    expect(errors).toEqual([]);

    if (visual) await expect(page).toHaveScreenshot(`${story.id}.png`);
  });
}
