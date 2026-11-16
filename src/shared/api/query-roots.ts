/**
 * 서버 데이터 쿼리 키의 첫 칸. 저장 뒤 서로 영향을 주는 목록만 골라 다시 받을 때 씁니다.
 * 예: 기록을 저장하면 장소 목록의 기록 수와 최근 방문일도 바뀝니다. 프로필과 장소 검색은 넣지 않습니다.
 */
export const QUERY_ROOTS = {
  places: 'places',
  records: 'records',
  checklist: 'checklist',
  trips: 'trips',
  checkins: 'checkins',
} as const;
