export { env, isSupabaseConfigured } from './env';
/** 공개 저장소의 문서. 앱 안에서는 브라우저로 엽니다. */
export const LINKS = {
  privacyPolicy: 'https://github.com/ryushin01/NewWorld/blob/main/docs/privacy-policy.md',
  /** README의 출처 표(사진·글꼴·지도 데이터의 저작자와 라이선스) */
  sources: 'https://github.com/ryushin01/NewWorld#출처',
} as const;

export const MAX_PHOTOS_PER_RECORD = 10;
export const PHOTO_BUCKET = 'record-photos';
export const DEFAULT_REGION = {
  latitude: 22,
  longitude: 30,
  latitudeDelta: 110,
  longitudeDelta: 110,
};
