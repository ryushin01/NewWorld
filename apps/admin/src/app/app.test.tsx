import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { createDemoBackend } from '@admin/shared/api/demo/demo-backend';
import { App, createQueryClient } from './app';

const fixed = () => new Date('2026-11-27T03:00:00.000Z');

function renderApp() {
  const backend = createDemoBackend({ storage: localStorage, now: fixed });
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { retry: false, staleTime: 0 } });
  const user = userEvent.setup();
  render(<App backend={backend} queryClient={queryClient} />);
  return { user, backend };
}

async function enterDemo() {
  const result = renderApp();
  await result.user.click(await screen.findByRole('button', { name: '관리자로 둘러보기' }));
  await screen.findByRole('heading', { level: 1, name: '대시보드' });
  return result;
}

async function expectNoAxeViolations(container: HTMLElement) {
  // jsdom은 색을 계산하지 못해 대비 규칙은 Playwright E2E에서 봅니다.
  const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(result.violations.map((violation) => violation.id)).toEqual([]);
}

beforeAll(() => {
  window.matchMedia = (query: string) => ({
    matches: query.includes('reduce'),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
  window.scrollTo = () => {};
});

describe('어드민', () => {
  it('데모 입장 화면에 안내가 있고, 관리자로 둘러보기를 누르면 대시보드 지표가 보인다', async () => {
    const { user } = renderApp();
    expect(
      await screen.findByRole('heading', { level: 1, name: '신세계 운영 어드민' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '데모 안내' })).toBeInTheDocument();
    expect(document.title).toBe('관리자로 둘러보기 | 신세계 운영 어드민');
    await expectNoAxeViolations(document.body);

    await user.click(screen.getByRole('button', { name: '관리자로 둘러보기' }));
    expect(await screen.findByRole('heading', { level: 1, name: '대시보드' })).toBeInTheDocument();
    expect(await screen.findByText('처리 대기 신고')).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: '데모 안내' })).toHaveTextContent(
      '이 브라우저에만 저장',
    );
    expect(screen.getByRole('list', { name: '스탬프가 많은 여행지 10곳' })).toBeInTheDocument();
    expect(document.title).toBe('대시보드 | 신세계 운영 어드민');
  });

  it('여행지를 이름으로 찾고 분류로 거른다', async () => {
    const { user } = await enterDemo();
    window.location.hash = '#/destinations';
    const search = await screen.findByRole('searchbox', { name: '검색' });
    await user.type(search, '스톤');
    const list = screen.getByRole('list', { name: '여행지 목록' });
    await waitFor(() => expect(within(list).getAllByRole('listitem')).toHaveLength(1));
    expect(within(list).getByRole('link', { name: '스톤헨지' })).toBeInTheDocument();

    await user.clear(search);
    await user.selectOptions(screen.getByRole('combobox', { name: '분류' }), '신화');
    for (const item of within(list).getAllByRole('listitem'))
      expect(item).toHaveTextContent('신화');
    await expectNoAxeViolations(document.body);
  });

  it('여행지 추가 폼은 잘못된 칸에 오류를 잇고 첫 오류 칸으로 초점을 옮긴 뒤, 고치면 저장한다', async () => {
    const { user, backend } = await enterDemo();
    window.location.hash = '#/destinations/new';
    await user.click(await screen.findByRole('button', { name: '여행지 추가' }));

    const id = screen.getByRole('textbox', { name: 'ID (필수)' });
    await waitFor(() => expect(id).toHaveFocus());
    expect(id).toHaveAttribute('aria-invalid', 'true');
    expect(id).toHaveAccessibleDescription(/ID는 영문 소문자/);

    await user.type(id, 'shambhala-gate');
    await user.type(screen.getByRole('textbox', { name: '이름 (필수)' }), '샴발라의 문');
    await user.type(
      screen.getByRole('textbox', { name: '한 줄 소개 (필수)' }),
      '눈 덮인 산 너머의 왕국으로 가는 길',
    );
    await user.selectOptions(screen.getByRole('combobox', { name: '세계 (필수)' }), '환상 세계');
    expect(screen.getByRole('combobox', { name: '분류 (필수)' })).toHaveValue('myth');
    await user.type(screen.getByRole('textbox', { name: '묶음 (필수)' }), '히말라야');
    const latitude = screen.getByRole('spinbutton', { name: '위도 (필수)' });
    await user.clear(latitude);
    await user.type(latitude, '29.65');
    await user.click(screen.getByRole('button', { name: '여행지 추가' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: '샴발라의 문' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('샴발라의 문을(를) 저장했습니다.')).toBeInTheDocument();
    expect((await backend.listDestinations())[0]).toMatchObject({
      id: 'shambhala-gate',
      realm: 'fantasy',
      lore: 'myth',
    });
  });

  it('신고 처리 모달은 처리 메모를 요구하고, 처리하면 대기 목록에서 빠지며 닫힌 뒤 초점이 돌아온다', async () => {
    const { user } = await enterDemo();
    window.location.hash = '#/reports';
    const list = await screen.findByRole('list', { name: '신고 목록' });
    await waitFor(() => expect(within(list).getAllByRole('listitem')).toHaveLength(5));
    const trigger = within(list).getByRole('button', {
      name: '그림자여행자의 프로필 사진 신고 처리하기',
    });
    await user.click(trigger);

    const dialog = screen.getByRole('dialog', { name: '신고 처리' });
    await user.click(within(dialog).getByRole('button', { name: '처리 완료' }));
    const note = within(dialog).getByRole('textbox', { name: '처리 메모 (필수)' });
    await waitFor(() => expect(note).toHaveFocus());
    expect(note).toHaveAttribute('aria-invalid', 'true');

    await user.type(note, '불쾌감을 주는 사진');
    await user.click(within(dialog).getByRole('button', { name: '처리 완료' }));
    await waitFor(() => expect(within(list).getAllByRole('listitem')).toHaveLength(4));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('메뉴 모달은 Escape로 닫히고 메뉴 버튼으로 초점이 돌아온다', async () => {
    const { user } = await enterDemo();
    const menu = screen.getByRole('button', { name: /전체 메뉴 열기/ });
    await user.click(menu);
    const dialog = screen.getByRole('dialog', { name: '전체 메뉴' });
    expect(within(dialog).getByRole('link', { name: '신고 처리' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(menu).toHaveFocus();
  });
});
