/**
 * 레퍼런스가 사진이 없는 글에 쓰는 붉은 로고 타일을 본떠, 여행지·코스 썸네일을 직접 그립니다.
 * 실존 유적은 붉은색, 환상 세계는 먹색입니다. 글자는 이미 옆에 있어 장식으로 둡니다.
 */
export function Tile({
  label,
  tone,
  size = 'md',
}: {
  label: string;
  tone: 'real' | 'fantasy' | 'muted';
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <div className={`tile tile--${tone} tile--${size}`} aria-hidden="true">
      <span className="tile__label">{label}</span>
    </div>
  );
}
