/** 레퍼런스의 붉은 화살표. 장식이라 낭독하지 않습니다. */
export function Arrow({ external = false }: { external?: boolean }) {
  return external ? (
    <svg className="arrow arrow--external" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M2 10 L10 2 M4 2 H10 V8" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ) : (
    <svg className="arrow" viewBox="0 0 16 12" aria-hidden="true" focusable="false">
      <path d="M0 6 H14 M9 1 L14 6 L9 11" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
