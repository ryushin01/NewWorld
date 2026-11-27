/** 메뉴에 두는 화면. 영문은 레퍼런스처럼 크게, 한국어 이름은 낭독용이자 보조 글자입니다. */
export const NAV_ITEMS = [
  { to: '/dashboard', en: 'Dashboard', ko: '대시보드' },
  { to: '/destinations', en: 'Destinations', ko: '여행지' },
  { to: '/courses', en: 'Courses', ko: '전설의 현장 코스' },
  { to: '/stamps', en: 'Stamps', ko: '현장 인증 스탬프' },
  { to: '/badges', en: 'Badges', ko: '기념 뱃지' },
  { to: '/users', en: 'Users', ko: '사용자' },
  { to: '/reports', en: 'Reports', ko: '신고 처리' },
] as const;
