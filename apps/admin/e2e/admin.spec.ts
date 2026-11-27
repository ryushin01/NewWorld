import { AxeBuilder } from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

/**
 * 포트폴리오라 인터넷이 끊겨도 어드민이 내용과 함께 떠야 합니다.
 * localhost 밖 요청을 모두 막고, 그런 요청이 아예 없었는지 봅니다(글꼴도 번들에 들어 있음).
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

async function expectNoA11yViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
}

async function enterDemo(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page).toHaveTitle('관리자로 둘러보기 | 신세계 운영 어드민');
  await expectNoA11yViolations(page);
  await page.getByRole('button', { name: '관리자로 둘러보기' }).click();
  await expect(page.getByRole('heading', { level: 1, name: '대시보드' })).toBeAttached();
}

async function openMenu(page: Page, name: string) {
  await page.getByRole('button', { name: /전체 메뉴 열기/ }).click();
  const dialog = page.getByRole('dialog', { name: '전체 메뉴' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('link', { name }).click();
}

test('외부 요청을 모두 막아도 데모로 들어가 모든 화면이 시드 데이터와 함께 열리고 axe 위반이 없다', async ({
  page,
}) => {
  const external = await blockExternal(page);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await enterDemo(page);
  await expect(page.getByText('처리 대기 신고')).toBeVisible();
  await expectNoA11yViolations(page);

  const screens: [string, string][] = [
    ['여행지', '기자 피라미드'],
    ['전설의 현장 코스', '아더왕의 길'],
    ['현장 인증 스탬프', '위치 인증'],
    ['기념 뱃지', '첫 발자국'],
    ['사용자', '아틀란티스찾는중'],
    ['신고 처리', '광고문의카톡ABC'],
  ];
  for (const [title, content] of screens) {
    await openMenu(page, title);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeFocused();
    await expect(page).toHaveTitle(`${title} | 신세계 운영 어드민`);
    await expect(page.getByText(content).first()).toBeVisible();
    await expectNoA11yViolations(page);
  }

  // 불러온 뒤 네트워크를 끊어도 화면 이동이 됩니다(데모 데이터는 브라우저 저장소).
  await page.context().setOffline(true);
  await openMenu(page, '여행지');
  await page.getByRole('link', { name: '스톤헨지', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: '스톤헨지' })).toBeVisible();
  await page.context().setOffline(false);

  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('외부 요청을 모두 막아도 상세·수정·추가·없는 화면까지 주소로 바로 열리고 axe 위반이 없다', async ({
  page,
}) => {
  const external = await blockExternal(page);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await enterDemo(page);

  const screens: [path: string, heading: string, title: string][] = [
    ['/#/destinations/new', '여행지 추가', '여행지 추가'],
    ['/#/destinations/giza', '기자 피라미드', '기자 피라미드 여행지'],
    ['/#/destinations/giza/edit', '기자 피라미드 수정', '기자 피라미드 수정'],
    ['/#/courses/new', '코스 추가', '코스 추가'],
    ['/#/courses/arthur/edit', '아더왕의 길 수정', '아더왕의 길 코스 수정'],
    ['/#/users/demo-user-01', '아틀란티스찾는중', '아틀란티스찾는중 사용자'],
    ['/#/nowhere', '없는 화면입니다', '없는 화면'],
  ];
  for (const [path, heading, title] of screens) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await expect(page).toHaveTitle(`${title} | 신세계 운영 어드민`);
    await expectNoA11yViolations(page);
  }

  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('데모 입장 → 여행지 추가·수정 → 신고 처리', async ({ page }) => {
  await blockExternal(page);
  await enterDemo(page);

  // 추가: 빈 채로 저장하면 첫 오류 칸(ID)으로 초점이 가고 오류가 이어집니다.
  await page.goto('/#/destinations/new');
  await page.getByRole('button', { name: '여행지 추가' }).click();
  const id = page.getByRole('textbox', { name: 'ID (필수)' });
  await expect(id).toBeFocused();
  await expect(id).toHaveAttribute('aria-invalid', 'true');
  await expectNoA11yViolations(page);

  await id.fill('shambhala-gate');
  await page.getByRole('textbox', { name: '이름 (필수)' }).fill('샴발라의 문');
  await page
    .getByRole('textbox', { name: '한 줄 소개 (필수)' })
    .fill('눈 덮인 산 너머의 왕국으로 가는 길');
  await page.getByRole('combobox', { name: '세계 (필수)' }).selectOption({ label: '환상 세계' });
  await page.getByRole('textbox', { name: '묶음 (필수)' }).fill('히말라야');
  await page.getByRole('spinbutton', { name: '위도 (필수)' }).fill('29.65');
  await page.getByRole('spinbutton', { name: '경도 (필수)' }).fill('91.1');
  await page.getByRole('button', { name: '여행지 추가' }).click();
  await expect(page.getByRole('heading', { level: 1, name: '샴발라의 문' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: '저장했습니다' })).toBeVisible();

  // 수정
  await page.getByRole('link', { name: '수정하기' }).click();
  await page.getByRole('textbox', { name: '이름 (필수)' }).fill('샴발라 관문');
  await page.getByRole('button', { name: '수정 저장' }).click();
  await expect(page.getByRole('heading', { level: 1, name: '샴발라 관문' })).toBeVisible();

  // 목록에서 찾아 숨기기
  await page.goto('/#/destinations');
  await page.getByRole('searchbox', { name: '검색' }).fill('샴발라 관문');
  await page.getByRole('button', { name: '샴발라 관문 숨기기' }).click();
  await expect(page.getByRole('button', { name: '샴발라 관문 다시 보이기' })).toBeVisible();

  // 신고 처리: 모달은 초점을 가두고, 처리하면 닫히며 대기 목록에서 빠집니다.
  await page.goto('/#/reports');
  const list = page.getByRole('list', { name: '신고 목록' });
  await expect(list.getByRole('listitem')).toHaveCount(5);
  await page.getByRole('button', { name: '그림자여행자의 프로필 사진 신고 처리하기' }).click();
  const dialog = page.getByRole('dialog', { name: '신고 처리' });
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 8; i += 1) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  }
  await expectNoA11yViolations(page);
  await dialog.getByRole('textbox', { name: '처리 메모 (필수)' }).fill('불쾌감을 주는 사진');
  await dialog.getByRole('button', { name: '처리 완료' }).click();
  await expect(dialog).toBeHidden();
  await expect(list.getByRole('listitem')).toHaveCount(4);

  // 새로고침해도 브라우저 저장소에 남아 있습니다.
  await page.reload();
  await expect(page.getByRole('list', { name: '신고 목록' }).getByRole('listitem')).toHaveCount(4);
});

test('메뉴 모달은 Escape로 닫히고 메뉴 버튼으로 초점이 돌아오며, 본문 바로가기가 있다', async ({
  page,
}) => {
  await enterDemo(page);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: '대시보드' })).toBeAttached();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: '본문 바로가기' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();

  const menu = page.getByRole('button', { name: /전체 메뉴 열기/ });
  await menu.click();
  await expect(page.getByRole('dialog', { name: '전체 메뉴' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: '전체 메뉴' })).toBeHidden();
  await expect(menu).toBeFocused();
});

test('데모 데이터 초기화로 처음 상태로 돌아간다', async ({ page }) => {
  await enterDemo(page);
  await page.goto('/#/reports');
  await page
    .getByRole('button', { name: '광고문의카톡ABC의 닉네임 신고 처리하기' })
    .first()
    .click();
  const dialog = page.getByRole('dialog', { name: '신고 처리' });
  await dialog.getByRole('textbox', { name: '처리 메모 (필수)' }).fill('광고');
  await dialog.getByRole('button', { name: '처리 완료' }).click();
  await expect(page.getByRole('list', { name: '신고 목록' }).getByRole('listitem')).toHaveCount(3);

  await page.getByRole('button', { name: '데모 데이터 초기화' }).click();
  await page
    .getByRole('dialog', { name: '데모 데이터 초기화' })
    .getByRole('button', { name: '초기화', exact: true })
    .click();
  await expect(page.getByRole('list', { name: '신고 목록' }).getByRole('listitem')).toHaveCount(5);
});
