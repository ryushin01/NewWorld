/**
 * 레퍼런스의 흐르는 글자 띠. 장식이므로 낭독하지 않고,
 * 움직임 줄이기 설정이면 멈춥니다(CSS prefers-reduced-motion).
 */
export function Marquee({
  text,
  className,
  vertical = false,
}: {
  text: string;
  className?: string;
  vertical?: boolean;
}) {
  // 글자는 CSS(::before)로 그려 문서에 남기지 않습니다. 흰 장식 글자가 본문으로 읽히거나 대비 검사 대상이 되지 않게 합니다.
  const items = Array.from({ length: 4 }, (_, index) => (
    <span key={index} className="marquee__text" data-text={text} />
  ));
  return (
    <div
      className={['marquee', vertical ? 'marquee--vertical' : '', className]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    >
      <div className="marquee__inner">{items}</div>
    </div>
  );
}
