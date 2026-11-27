/**
 * 데모 회원의 프로필 사진을 직접 그린 SVG로 만듭니다(외부 이미지·스톡 사진 없음).
 * 레퍼런스의 붉은 사각 타일처럼 단색 바탕에 기하 도형과 머리글자를 둡니다.
 */
const PALETTE = [
  ['#e61517', '#ffffff'],
  ['#1d1a1a', '#f3f0ee'],
  ['#f3f0ee', '#1d1a1a'],
  ['#6f6b6a', '#ffffff'],
] as const;

export function demoAvatar(seed: number, initial: string) {
  const [bg, fg] = PALETTE[seed % PALETTE.length] ?? PALETTE[0];
  const shape =
    seed % 3 === 0
      ? `<circle cx="64" cy="64" r="40" fill="none" stroke="${fg}" stroke-width="3"/>`
      : seed % 3 === 1
        ? `<path d="M24 104 L64 24 L104 104 Z" fill="none" stroke="${fg}" stroke-width="3"/>`
        : `<rect x="28" y="28" width="72" height="72" fill="none" stroke="${fg}" stroke-width="3"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" fill="${bg}"/>${shape}<text x="64" y="76" font-family="sans-serif" font-size="34" font-weight="700" text-anchor="middle" fill="${fg}">${initial}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** 신고 처리 예시용으로 일부러 거슬리게 그린 사진(굵은 X). */
export function flaggedAvatar() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" fill="#1d1a1a"/><path d="M20 20 L108 108 M108 20 L20 108" stroke="#e61517" stroke-width="14"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
