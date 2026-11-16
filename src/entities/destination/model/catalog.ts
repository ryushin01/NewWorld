import { LORE_LABELS } from './myth';
import type { PlaceKind } from '@/shared/api';
import { matchesSearch } from '@/shared/lib';
import { FANTASY_DESTINATIONS } from './catalog-fantasy';
import { REAL_DESTINATIONS } from './catalog-real';
import { DESTINATION_IMAGES } from './images';
import type { Destination } from './types';

export const DESTINATIONS: Destination[] = [...REAL_DESTINATIONS, ...FANTASY_DESTINATIONS].map(
  (item) => ({ ...item, ...DESTINATION_IMAGES[item.id] }),
);

const byId = new Map(DESTINATIONS.map((item) => [item.id, item]));

export const findDestination = (id: string) => byId.get(id);

const groupsOf = (realm: PlaceKind) => [
  ...new Set(DESTINATIONS.filter((item) => item.realm === realm).map((item) => item.group)),
];

export const REAL_GROUPS = groupsOf('real');
export const FANTASY_GROUPS = groupsOf('fantasy');

/**
 * 이름, 원어, 지역, 한 줄 소개, 분류에서 찾습니다.
 * 이름과 지역은 초성(ㅍㄹㅁㄷ → 피라미드)과 치는 중인 마지막 글자(아발로 → 아발론)로도 찾습니다.
 * 긴 소개 문장에는 초성을 맞추지 않습니다(띄어쓰기를 넘어 엉뚱한 글자들이 맞기 쉬움).
 */
export const searchDestinations = (keyword: string, realm?: PlaceKind) => {
  const term = keyword.trim().toLowerCase();
  return DESTINATIONS.filter(
    (item) =>
      (!realm || item.realm === realm) &&
      (!term ||
        [item.name, item.location].some((value) => matchesSearch(value, term)) ||
        [item.originalName, item.tagline, LORE_LABELS[item.lore]].some((value) =>
          value.toLowerCase().includes(term),
        )),
  );
};
