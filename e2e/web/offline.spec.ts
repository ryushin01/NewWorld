import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

/**
 * 포트폴리오라 외부 서비스가 끊겨도 웹 데모가 내용과 함께 보여야 합니다.
 * localhost 밖으로 나가는 요청을 모두 막고, 그런 요청이 아예 없는지 봅니다.
 * 웹 데모는 Supabase 값 없이 빌드해 늘 데모 모드(가상 데이터, 브라우저 저장)입니다.
 */
const LOCAL = ['localhost', '127.0.0.1'];

async function blockExternal(page: Page): Promise<string[]> {
  const external: string[] = [];
  await page.context().route(
    (url) => !LOCAL.includes(url.hostname),
    async (route) => {
      external.push(route.request().url());
      await route.abort('internetdisconnected');
    },
  );
  return external;
}

/**
 * 알고 있지만 이 테스트에서 고치지 않은 접근성 문제입니다. 고치면 여기서 지웁니다.
 * 새로 생긴 위반은 이 목록에 넣어 넘기지 말고 먼저 고칩니다.
 * - expo-image의 웹 <img>에 alt가 없음(여행지 사진, 전환 중 겹친 사진)
 * - @gorhom/bottom-sheet가 지도 화면의 시트·손잡이에 role="slider"를 aria-valuenow 없이 붙임
 * - 카드·행 버튼의 accessibilityLabel이 보이는 글자를 그대로 담지 않음(label-content-name-mismatch)
 */
const KNOWN_A11Y_EXCLUDE = [
  '[data-expoimage="true"]',
  '[aria-label="Bottom Sheet"]',
  '[aria-label="Bottom sheet handle"]',
];
const KNOWN_A11Y_RULES = ['label-content-name-mismatch'];

async function expectNoA11yViolations(page: Page) {
  const axe = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .disableRules(KNOWN_A11Y_RULES);
  // 배열을 한 번에 넘기면 iframe·shadow DOM 경로로 읽으므로 선택자마다 따로 뺍니다.
  for (const selector of KNOWN_A11Y_EXCLUDE) axe.exclude(selector);
  const { violations } = await axe.analyze();
  expect(
    violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
}

test('외부 요청을 모두 막아도 둘러보기로 들어가 모든 탭이 데모 데이터와 함께 열린다', async ({
  page,
}) => {
  const external = await blockExternal(page);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await page.getByRole('button', { name: '둘러보기' }).click();
  await expect(page.getByText('기자 피라미드').first()).toBeVisible({ timeout: 20_000 });
  await expectNoA11yViolations(page);

  for (const [tab, content] of [
    ['환상', '아틀란티스'],
    ['지도', '웹 데모에서는 지도를 표시하지 않습니다'],
    ['기록', null],
    ['MY', null],
  ] as const) {
    await page.getByRole('tab', { name: tab }).click();
    if (content) await expect(page.getByText(content).first()).toBeVisible();
    await expectNoA11yViolations(page);
  }

  // 글꼴도 앱 번들에 들어 있어 외부에서 받지 않습니다.
  expect(await page.evaluate(() => document.fonts.status)).toBe('loaded');
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});
