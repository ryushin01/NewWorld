/** Supabase API는 한 번에 최대 1,000행까지만 돌려줍니다(max_rows 기본값). */
export const PAGE_SIZE = 1000;

type Page<T> = PromiseLike<{ data: T[] | null; error: unknown }>;

/**
 * 1,000행씩 끝까지 읽습니다. 한 번만 조회하면 많이 쓰는 회원의 목록이 말없이 잘립니다.
 * 몇 번째 행부터(offset)가 아니라 마지막으로 받은 키 다음부터 읽어, 그사이 다른 기기가 행을 지워도
 * 뒤 행이 앞으로 당겨져 빠지지 않습니다. fetchPage는 키 순서로 정렬(`.order(key)`)하고 PAGE_SIZE개만
 * 읽되(`.limit`), after가 있으면 그 다음부터(`.gt(key, after)`) 읽어야 합니다.
 * Edge Function에도 같은 도우미가 있습니다(supabase/functions/delete-account/pages.ts).
 */
export const fetchAllPages = async <T>(
  fetchPage: (after: string | null) => Page<T>,
  keyOf: (row: T) => string,
  pageSize = PAGE_SIZE,
): Promise<T[]> => {
  const rows: T[] = [];
  let after: string | null = null;
  for (;;) {
    const { data, error } = await fetchPage(after);
    if (error) throw error;
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
    after = keyOf(page[page.length - 1]);
  }
};

/** 한 번에 보내는 경로 수를 나눕니다(저장소 삭제·서명 주소). */
export const chunk = <T>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );
