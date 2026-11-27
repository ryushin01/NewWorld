import type { ReactNode } from 'react';
import { Marquee } from './marquee';

/** 화면 머리: 흰 글자가 흐르는 띠 + 큰 영문 제목 + 한국어 제목(h1). */
export function PageHead({ en, ko, children }: { en: string; ko: string; children?: ReactNode }) {
  return (
    <header className="page-head">
      <Marquee text={`${en} `} className="page-head__marquee" />
      <div className="page-head__body">
        <p className="page-head__en" aria-hidden="true">
          {en}
        </p>
        <h1 className="page-head__ko" tabIndex={-1} data-page-title>
          {ko}
        </h1>
      </div>
      {children ? <div className="page-head__tools">{children}</div> : null}
    </header>
  );
}
