import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { backend } from '@/shared/api';

const DEBOUNCE_MS = 300;

export const usePlaceSearch = (query: string) => {
  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);
  const result = useQuery({
    queryKey: ['place-search', debounced],
    queryFn: () => backend.search.places(debounced),
    enabled: debounced.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    meta: { persist: false },
  });
  // 입력을 멈추기 전(디바운스)의 결과는 지난 검색어 것이므로, 화면이 비교할 수 있게 검색한 말을 함께 돌려줍니다.
  return { ...result, term: debounced };
};
