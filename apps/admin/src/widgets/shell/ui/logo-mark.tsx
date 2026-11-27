/** 직접 그린 로고: 붉은 칸의 흰 N과 비스듬한 획(레퍼런스 로고의 구성을 따르되 글자는 새로 그림). */
export function LogoMark() {
  return (
    <svg className="logo-mark" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path d="M12 40 V14 h5 l13 17 V14 h5 v26 h-5 L17 23 v17 z" fill="currentColor" />
      <path d="M27 9 L33 3" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
    </svg>
  );
}
