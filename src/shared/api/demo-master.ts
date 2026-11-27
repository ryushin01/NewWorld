import { MASTER_VISITS } from './demo-master-visits';

/**
 * ryushin0(마스터) 데모 계정. 여행지를 모두 다녀와 현장 인증 스탬프·기념 뱃지·코스 완주를 모두 채운 계정으로,
 * 앱 데모(둘러보기), 운영 어드민 시드, Supabase 시드(supabase/seed/admin-demo.sql)가 이 한 곳에서 가져갑니다.
 * 비밀번호 같은 인증 정보는 없고, 데모 입장 버튼으로만 들어갑니다.
 */
export type MasterVisit = {
  catalogId: string;
  /** 카탈로그의 이름·세계·위치·묶음(장소와 기록을 만들 때 씀. 카탈로그와 같은지 테스트가 봅니다) */
  name: string;
  realm: 'real' | 'fantasy';
  location: string;
  group: string;
  /** 방문·현장 인증 시각(UTC) */
  visitedAt: string;
  /** 인증한 위치와 여행지(환상 세계는 현실 연고지)까지 거리 */
  latitude: number;
  longitude: number;
  distanceKm: number;
};

export const MASTER_USERNAME = 'ryushin0';
export const MASTER_NICKNAME = 'ryushin0';
/** Supabase 시드의 회원 UUID(5eed… = 시드 전용) */
export const MASTER_USER_ID = '5eed0001-0000-4000-8000-000000000000';
/** 첫 여행 2주 전에 가입했습니다. */
export const MASTER_JOINED_AT = '2024-11-23T02:00:00.000Z';

export { MASTER_VISITS };
