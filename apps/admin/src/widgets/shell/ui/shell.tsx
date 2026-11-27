import { useCallback, useRef, useState, type ReactNode } from 'react';
import type { AdminSession } from '@admin/shared/api';
import { APP_DEMO_URL } from '@admin/shared/config/env';
import { Link, usePath } from '@admin/shared/lib';
import { Arrow, Button, Dialog, Marquee } from '@admin/shared/ui';
import { useReports } from '@admin/entities/report';
import { DemoReset } from '@admin/features/demo-reset';
import { useSignOut } from '@admin/features/sign-in';
import { NAV_ITEMS } from '../model/nav';
import { LogoMark } from './logo-mark';

const RAIL_TEXT =
  'NewWorld is an atlas of myths, legends and history.  -  "신세계" 운영 어드민  -  ';

function focusMain() {
  document.getElementById('main')?.focus();
}

/** 레퍼런스의 틀: 붉은 테두리, 왼쪽 세로 띠(로고·흐르는 글자), 칸으로 나뉜 머리, 전체 화면 메뉴. */
export function Shell({ session, children }: { session: AdminSession; children: ReactNode }) {
  const path = usePath();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigating = useRef(false);
  const signOut = useSignOut();
  const reports = useReports();
  const open = reports.data?.filter((report) => report.status === 'open').length ?? 0;
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const restore = useCallback(() => {
    const restoreFocus = !navigating.current;
    navigating.current = false;
    return restoreFocus;
  }, []);

  return (
    <div className="frame">
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          focusMain();
        }}
      >
        본문 바로가기
      </a>
      <aside className="rail">
        <Link to="/dashboard" className="rail__logo" aria-label="신세계 로고, 대시보드로">
          <LogoMark />
        </Link>
        <Marquee vertical text={RAIL_TEXT} className="rail__marquee" />
      </aside>
      <header className="topbar">
        <Link
          to="/dashboard"
          className="topbar__cell topbar__wordmark"
          aria-label="NEWWORLD 신세계 운영 어드민 대시보드"
        >
          <span aria-hidden="true">NEWWORLD</span>
        </Link>
        <button
          type="button"
          className="topbar__cell topbar__menu"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <span className="topbar__lines" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="topbar__menu-text">Menu</span>
          <span className="visually-hidden">전체 메뉴 열기</span>
        </button>
        <nav className="topbar__quick" aria-label="바로가기">
          <Link to="/reports" aria-current={path.startsWith('/reports') ? 'page' : undefined}>
            Reports
            <span className="visually-hidden"> 신고 처리, 대기 {open}건</span>
            <span className="topbar__count" aria-hidden="true">
              {open}
            </span>
          </Link>
          <Link
            to="/destinations"
            aria-current={path.startsWith('/destinations') ? 'page' : undefined}
          >
            Destinations<span className="visually-hidden"> 여행지</span>
            <Arrow external />
          </Link>
          <a href={APP_DEMO_URL} target="_blank" rel="noreferrer">
            App demo<span className="visually-hidden"> 앱 웹 데모, 새 창</span>
            <Arrow external />
          </a>
        </nav>
        <button
          type="button"
          className="topbar__cell topbar__signout"
          onClick={() => signOut.mutate()}
        >
          {session.demo ? 'Exit demo' : 'Sign out'}
          <span className="visually-hidden">{session.demo ? ' 데모 나가기' : ' 로그아웃'}</span>
          <Arrow external />
        </button>
      </header>
      {session.demo ? (
        <aside className="strip" aria-label="데모 안내">
          <p className="strip__text">
            <span className="strip__dot" aria-hidden="true" />
            데모 모드: 시드 데이터로 동작하며 바꾼 내용은 이 브라우저에만 저장됩니다.
          </p>
          <DemoReset />
        </aside>
      ) : null}
      <main id="main" tabIndex={-1} className="main">
        {children}
      </main>
      <footer className="footer">
        <p className="footer__brand" aria-hidden="true">
          NEWWORLD
        </p>
        <p className="footer__copy">
          Copyright
          <br />
          NewWorld Project.
          <br />
          All Rights Reserved.
        </p>
      </footer>
      <Dialog
        open={menuOpen}
        title="전체 메뉴"
        onClose={closeMenu}
        className="menu-dialog"
        shouldRestoreFocus={restore}
      >
        <nav aria-label="전체 메뉴">
          <ul className="menu">
            {NAV_ITEMS.map((item, index) => (
              <li
                key={item.to}
                className="menu__item"
                style={{ transitionDelay: `${index * 60}ms` }}
              >
                <Link
                  to={item.to}
                  className="menu__link"
                  aria-current={path.startsWith(item.to) ? 'page' : undefined}
                  onClick={() => {
                    navigating.current = true;
                    setMenuOpen(false);
                  }}
                >
                  <span className="menu__en" aria-hidden="true">
                    {item.en}
                  </span>
                  <span className="menu__ko">{item.ko}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="menu__footer">
          <Button
            onClick={() => {
              navigating.current = true;
              setMenuOpen(false);
              signOut.mutate();
            }}
          >
            {session.demo ? '데모 나가기' : '로그아웃'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
