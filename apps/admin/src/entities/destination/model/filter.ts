import { LORE_LABELS, type Destination, type Lore, type Realm } from '@admin/shared/api';

export type DestinationFilter = {
  keyword: string;
  realm: Realm | 'all';
  lore: Lore | 'all';
  visibility: 'all' | 'visible' | 'hidden';
};

export const EMPTY_FILTER: DestinationFilter = {
  keyword: '',
  realm: 'all',
  lore: 'all',
  visibility: 'all',
};

/** 이름·원어·지역·묶음·소개·분류에서 찾고, 세계·분류·공개 여부로 거릅니다. */
export function filterDestinations(list: Destination[], filter: DestinationFilter) {
  const term = filter.keyword.trim().toLowerCase();
  return list.filter((item) => {
    if (filter.realm !== 'all' && item.realm !== filter.realm) return false;
    if (filter.lore !== 'all' && item.lore !== filter.lore) return false;
    if (filter.visibility === 'visible' && item.hidden) return false;
    if (filter.visibility === 'hidden' && !item.hidden) return false;
    if (!term) return true;
    return [
      item.id,
      item.name,
      item.originalName,
      item.location,
      item.group,
      item.tagline,
      LORE_LABELS[item.lore],
    ].some((value) => value.toLowerCase().includes(term));
  });
}
