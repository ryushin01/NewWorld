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

async function enterDemo(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: '둘러보기', exact: true }).click();
  await expect(page.getByText('기자 피라미드').first()).toBeVisible({ timeout: 20_000 });
}

/**
 * 웹 데모의 모든 경로를 주소로 바로 엽니다(GitHub Pages처럼 404.html이 같은 앱을 줌).
 * 경로마다 데모 데이터가 담긴 내용이 보이고 axe 위반이 없어야 합니다.
 * 계정 관련 화면(비밀번호·복구 코드)도 데모에서 폼이 뜨는지만 봅니다.
 */
const ROUTES: [path: string, content: string][] = [
  ['/fantasy', '아틀란티스'],
  ['/map', '웹 데모에서는 지도를 표시하지 않습니다'],
  ['/records', '구름이 걷히던 아침'],
  ['/my', '둘러보는 여행자'],
  ['/destination/giza', '고대 7대 불가사의 중 유일하게 남은 곳'],
  ['/destination/atlantis', '하룻밤 만에 가라앉은 해양 제국'],
  ['/courses', '아더왕의 길'],
  ['/timeline', '괴베클리 테페'],
  ['/passport', '기념 뱃지'],
  ['/places', '이름 모를 언덕의 고분'],
  ['/place/p5', '안내판이 없어 찾기 어려움'],
  ['/place/p5/edit', '장소 수정'],
  ['/place/new', '위치 정보가 없습니다'],
  ['/map-pick', '이 위치로 설정'],
  ['/record/r1', '문지기의 집에서 내려다본 전경'],
  ['/record/r2', '배를 젓던 아홉 자매'],
  ['/record/r1/edit', '그날 날씨 불러오기'],
  ['/record/new?placeId=p2', '앙코르 와트 기록'],
  ['/record/new?catalogId=stonehenge', '스톤헨지'],
  ['/trips', '아직 여정이 없습니다'],
  ['/trip/new', '가고 싶어요에서 고르기'],
  ['/search', '이름 모를 언덕의 고분'],
  ['/stats', '자주 간 장소'],
  ['/checklist', '유적 여행 기본 목록으로 시작'],
  ['/sync', '대기 중인 변경이 없습니다'],
  ['/profile-edit', '닉네임'],
  ['/password', '새 비밀번호 확인'],
  ['/recovery-code', '새 코드 발급'],
];

test('외부 요청을 모두 막아도 모든 경로를 바로 열면 데모 데이터와 함께 뜨고 axe 위반이 없다', async ({
  page,
}) => {
  test.setTimeout(ROUTES.length * 15_000);
  const external = await blockExternal(page);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`${page.url()}: ${error.message}`));
  await enterDemo(page);

  for (const [path, content] of ROUTES) {
    await test.step(path, async () => {
      await page.goto(path);
      await expect(page.getByText(content).first()).toBeVisible({ timeout: 20_000 });
      await expectNoA11yViolations(page);
    });
  }

  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('오프라인에서 날씨는 불러올 수 없다고 알리고, 장소 검색·인증·여정·엽서는 기기 안에서 된다', async ({
  page,
}) => {
  const external = await blockExternal(page);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await enterDemo(page);

  // 날씨(Open-Meteo): 요청이 끊기면 입력칸은 그대로 두고 연결 뒤 다시 하라고 알립니다.
  await page.goto('/record/r1/edit');
  await page.getByRole('button', { name: '그날 날씨 불러오기' }).click();
  await expect(page.getByText('날씨를 불러오지 못했습니다').first()).toBeVisible();
  await expect(page.getByRole('textbox', { name: '날씨' })).toHaveValue('구름 조금');

  // 장소 검색: 데모는 기기 안의 예시 장소에서 찾습니다(Photon 요청 없음).
  await page.goto('/search');
  await page.getByRole('textbox', { name: '유적지, 도시, 전설의 땅 이름' }).fill('쿠스코');
  await expect(page.getByText('페루 쿠스코주').first()).toBeVisible();
  await expectNoA11yViolations(page);

  // 현장 인증(데모) → 여권에 스탬프가 찍힙니다.
  await page.goto('/destination/giza');
  await page.getByRole('button', { name: /데모: 현장에 있는 것으로 인증/ }).click();
  await expect(page.getByText('스탬프를 찍었어요').first()).toBeVisible();
  await page.goto('/passport');
  await expect(page.getByText('현장 인증 1').first()).toBeVisible();
  await expectNoA11yViolations(page);

  // 코스로 여정 만들기 → 저장 → 여정 상세
  await page.goto('/courses');
  await page.getByRole('button', { name: '이 코스로 여정 만들기' }).first().click();
  await expect(page.getByRole('heading', { name: '여행지 4곳' })).toBeVisible();
  await expectNoA11yViolations(page);
  await page.getByRole('textbox', { name: '여정 이름, 필수' }).fill('아더왕의 길 걷기');
  await page.getByRole('button', { name: '저장하기' }).click();
  await expect(page).toHaveURL(/\/trip\/[^/]+$/);
  await expect(page.getByText('아더왕의 길 걷기').first()).toBeVisible();
  await expect(page.getByText('스톤헨지').filter({ visible: true }).first()).toBeVisible();
  await expectNoA11yViolations(page);

  // 엽서 미리보기(사진·글꼴 모두 번들 안)
  await page.goto('/destination/avalon');
  await page.getByRole('button', { name: '엽서' }).click();
  await expect(page.getByRole('button', { name: '엽서 공유' })).toBeVisible();
  await page.getByRole('button', { name: '닫기' }).click();

  // 사용자가 누른 날씨 요청만 나가려다 막혔고, 그 밖의 외부 요청은 없습니다.
  const isWeather = (url: string) => new URL(url).hostname.endsWith('open-meteo.com');
  expect(external.filter(isWeather).length).toBeGreaterThan(0);
  expect(external.filter((url) => !isWeather(url))).toEqual([]);
  expect(errors).toEqual([]);
});

test('ryushin0(마스터)로 둘러보면 여행지·스탬프·뱃지·코스가 모두 채워져 있다', async ({ page }) => {
  const external = await blockExternal(page);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'ryushin0(마스터)로 둘러보기' }).click();
  await expect(page.getByText('25곳 중 25곳 다녀옴').first()).toBeVisible({ timeout: 20_000 });
  await page.getByRole('tab', { name: '환상' }).click();
  await expect(page.getByText('30곳 중 30곳 다녀옴').first()).toBeVisible();

  await page.goto('/passport');
  await expect(page.getByText('현장 인증 55').first()).toBeVisible();
  await expect(page.getByText('기념 뱃지 21/21').first()).toBeVisible();
  await expectNoA11yViolations(page);

  await page.goto('/my');
  await expect(page.getByText('ryushin0').first()).toBeVisible();
  // 프로필 사진은 앱 번들에 들어 있어 오프라인에서도 뜹니다.
  const photo = page.locator('img[src*="ryushin0"]').first();
  await expect(photo).toBeVisible();
  expect(await photo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await expectNoA11yViolations(page);

  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('외부 요청을 모두 막아도 둘러보기로 들어가 모든 탭이 데모 데이터와 함께 열린다', async ({
  page,
}) => {
  const external = await blockExternal(page);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await enterDemo(page);
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
