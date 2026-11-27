import { useBackend } from '@admin/shared/api';
import { useDocumentTitle } from '@admin/shared/lib';
import { Marquee } from '@admin/shared/ui';
import { DemoEntry, SignInForm } from '@admin/features/sign-in';
import { LogoMark } from '@admin/widgets/shell';

/** 입장 화면. 데모 모드면 '관리자로 둘러보기', 아니면 관리자 로그인 폼을 둡니다. */
export function LoginPage() {
  const backend = useBackend();
  const demo = backend.mode === 'demo';
  useDocumentTitle(demo ? '관리자로 둘러보기' : '관리자 로그인');
  return (
    <div className="frame frame--public">
      <aside className="rail">
        <span className="rail__logo">
          <LogoMark />
        </span>
        <Marquee
          vertical
          text='NewWorld is an atlas of myths, legends and history.  -  "신세계" 운영 어드민  -  '
          className="rail__marquee"
        />
      </aside>
      <header className="topbar">
        <span className="topbar__cell topbar__wordmark" aria-hidden="true">
          NEWWORLD
        </span>
        <p className="topbar__tagline">
          「신화와 전설, 역사를 걷는」 여행 앱 신세계의 운영 어드민.
        </p>
      </header>
      <main id="main" tabIndex={-1} className="main login">
        <p className="hero__display login__display" aria-hidden="true">
          New,
          <br />
          World
        </p>
        <section className="login__panel" aria-labelledby="login-title">
          <p className="kicker" aria-hidden="true">
            ADMIN
          </p>
          <h1 className="login__title" id="login-title" tabIndex={-1} data-page-title>
            신세계 운영 어드민
          </h1>
          <p className="login__lead">여행지·코스·스탬프·뱃지·회원·신고를 한곳에서 관리합니다.</p>
          {demo ? (
            <>
              <DemoEntry />
              <section className="notice" aria-labelledby="demo-notice">
                <h2 className="notice__title" id="demo-notice">
                  데모 안내
                </h2>
                <ul className="notice__list">
                  <li>공개 데모라 로그인 없이 관리자 권한으로 들어갑니다.</li>
                  <li>
                    여행지 55곳, 코스 9개, 회원 26명과 스탬프·신고 시드 데이터로 모든 화면이
                    동작합니다.
                  </li>
                  <li>
                    추가·수정·신고 처리 결과는 이 브라우저에만 저장되며, 실제 서버에는 반영되지
                    않습니다.
                  </li>
                  <li>
                    들어간 뒤 위쪽 안내 띠의 ‘데모 데이터 초기화’로 언제든 처음 상태로 되돌립니다.
                  </li>
                  <li>서버·외부 글꼴 없이 동작해 인터넷이 끊겨도 내용이 보입니다.</li>
                </ul>
              </section>
            </>
          ) : (
            <SignInForm />
          )}
        </section>
      </main>
    </div>
  );
}
