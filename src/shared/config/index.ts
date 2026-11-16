export { env, isSupabaseConfigured } from './env';
/** 공개 저장소의 문서. 앱 안에서는 브라우저로 엽니다. */
export const LINKS = {
  privacyPolicy: 'https://github.com/ryushin01/NewWorld/blob/main/docs/privacy-policy.md',
  /** README의 출처 표(사진·글꼴·지도 데이터의 저작자와 라이선스) */
  sources: 'https://github.com/ryushin01/NewWorld#출처',
} as const;

/** 입력 길이 상한. DB 제약(supabase/migrations/20261116000000_input_limits.sql)과 같은 값입니다. */
export const LIMITS = {
  /** 장소·기록·여정 이름 */
  title: 100,
  /** 날씨·교통·숙소 */
  shortText: 200,
  /** 주소. 검색·지도에서 받아 오는 값이라 넘치면 자릅니다. */
  address: 300,
  /** 메모와 긴 글(인상 깊은 곳, 들어간 길, 만난 존재, 가져온 것) */
  longText: 2000,
  /** 태그·동행 한 개의 글자 수 */
  tagLength: 30,
  tags: 20,
  members: 50,
  /** 여정의 여행지 수(도감은 55곳) */
  stops: 60,
} as const;

export const MAX_PHOTOS_PER_RECORD = 10;
export const PHOTO_BUCKET = 'record-photos';
export const DEFAULT_REGION = {
  latitude: 22,
  longitude: 30,
  latitudeDelta: 110,
  longitudeDelta: 110,
};
