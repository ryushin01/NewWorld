import { MASTER_JOINED_AT, MASTER_VISITS } from './demo-master';
import type { CheckIn, Place, SearchResult, TripRecord } from './types';

// 저장한 장소와 기록은 모두 가상 데이터입니다.
const place = (
  id: string,
  name: string,
  kind: Place['kind'],
  address: string,
  latitude: number,
  longitude: number,
  memo: string,
  tags: string[],
  catalogId: string | null,
  wishlisted: boolean,
): Place => ({
  id,
  name,
  kind,
  address,
  latitude,
  longitude,
  memo,
  tags,
  catalogId,
  wishlisted,
  recordCount: 0,
  lastVisitedAt: null,
  createdAt: '2026-09-01T00:00:00.000Z',
});

export const DEMO_PLACES: Place[] = [
  place(
    'p1',
    '마추픽추',
    'real',
    '페루 쿠스코주',
    -13.1633,
    -72.5456,
    '',
    ['아메리카'],
    'machu-picchu',
    false,
  ),
  place(
    'p2',
    '앙코르 와트',
    'real',
    '캄보디아 시엠립',
    13.4125,
    103.8667,
    '',
    ['아시아'],
    'angkor-wat',
    true,
  ),
  place(
    'p3',
    '아발론',
    'fantasy',
    '서쪽 바다 너머',
    51.1442,
    -2.6986,
    '',
    ['켈트·아더왕'],
    'avalon',
    false,
  ),
  place(
    'p4',
    '무릉도원',
    'fantasy',
    '중국 무릉의 어느 시내 위쪽',
    28.9,
    111.48,
    '',
    ['동양'],
    'peach-blossom',
    true,
  ),
  place(
    'p5',
    '이름 모를 언덕의 고분',
    'real',
    '경상북도 어딘가',
    36.02,
    128.94,
    '직접 추가한 장소의 예시입니다. 안내판이 없어 찾기 어려움.',
    ['고분'],
    null,
    false,
  ),
];

const base = {
  title: '',
  memo: '',
  partySize: null,
  members: [],
  rating: null,
  weather: '',
  temperature: null,
  transport: '',
  lodging: '',
  cost: null,
  currency: 'KRW',
  highlights: '',
  gateway: '',
  encounters: '',
  souvenir: '',
  photos: [],
};

export const DEMO_RECORDS: TripRecord[] = [
  {
    ...base,
    id: 'r1',
    placeId: 'p1',
    placeName: '마추픽추',
    placeKind: 'real',
    visitedAt: '2026-05-18T12:30:00.000Z',
    title: '구름이 걷히던 아침',
    memo: '쿠스코에서 하루 쉬고 올라간 덕분에 고산병이 없었음.',
    partySize: 2,
    members: ['민수'],
    rating: 5,
    weather: '구름 조금',
    temperature: 17,
    transport: '쿠스코에서 기차와 셔틀버스',
    lodging: '아구아스칼리엔테스 게스트하우스',
    cost: 410000,
    highlights: '문지기의 집에서 내려다본 전경',
  },
  {
    ...base,
    id: 'r2',
    placeId: 'p3',
    placeName: '아발론',
    placeKind: 'fantasy',
    visitedAt: '2026-09-27T14:00:00.000Z',
    title: '사과나무 아래에서',
    partySize: 1,
    rating: 4,
    gateway: '비 오는 일요일에 읽은 《아더왕의 죽음》',
    encounters: '배를 젓던 아홉 자매',
    souvenir: '끝나지 않는 이야기는 쉬러 간 것뿐이라는 말',
  },
];

export const DEMO_SEARCH: SearchResult[] = [
  { id: 's1', name: '쿠스코', address: '페루 쿠스코주', latitude: -13.532, longitude: -71.967 },
  { id: 's2', name: '룩소르', address: '이집트 룩소르', latitude: 25.687, longitude: 32.639 },
  { id: 's3', name: '글래스턴베리', address: '영국 서머싯', latitude: 51.148, longitude: -2.714 },
  { id: 's4', name: '시엠립', address: '캄보디아 시엠립', latitude: 13.361, longitude: 103.86 },
];

/** ryushin0(마스터) 계정의 장소·기록·인증. 여행지 55곳을 모두 다녀와 기록하고 현장 인증했습니다. */
export const MASTER_PLACES: Place[] = MASTER_VISITS.map((visit) => ({
  ...place(
    `master-${visit.catalogId}`,
    visit.name,
    visit.realm,
    visit.location,
    visit.latitude,
    visit.longitude,
    '',
    [visit.group],
    visit.catalogId,
    false,
  ),
  createdAt: MASTER_JOINED_AT,
}));

export const MASTER_RECORDS: TripRecord[] = MASTER_VISITS.map((visit) => ({
  ...base,
  id: `master-record-${visit.catalogId}`,
  placeId: `master-${visit.catalogId}`,
  placeName: visit.name,
  placeKind: visit.realm,
  visitedAt: visit.visitedAt,
  title: `${visit.name}에서`,
  partySize: 1,
  rating: 5,
  ...(visit.realm === 'real'
    ? { highlights: '현장 인증 스탬프를 찍은 자리' }
    : { gateway: `${visit.location}에서 전설을 따라 걸음` }),
}));

export const MASTER_CHECKINS: CheckIn[] = MASTER_VISITS.map((visit) => ({
  id: `master-checkin-${visit.catalogId}`,
  catalogId: visit.catalogId,
  checkedAt: visit.visitedAt,
  latitude: visit.latitude,
  longitude: visit.longitude,
  distanceKm: visit.distanceKm,
  method: 'gps',
}));
