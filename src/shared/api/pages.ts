/** Supabase API는 한 번에 최대 1,000행까지만 돌려줍니다(max_rows 기본값). */
export const PAGE_SIZE = 1000;

type Page<T> = PromiseLike<{ data: T[] | null; error: unknown }>;

/**
 * 1,000행씩 끝까지 읽습니다. 한 번만 조회하면 많이 쓰는 회원의 목록이 말없이 잘립니다.
 * fetchPage는 `.order(...)`로 순서를 고정한 뒤 `.range(from, to)`로 한 쪽을 읽어야 합니다.
 * Edge Function에도 같은 도우미가 있습니다(supabase/functions/delete-account/pages.ts).
 */
export const fetchAllPages = async <T>(
  fetchPage: (from: number, to: number) => Page<T>,
  pageSize = PAGE_SIZE,
): Promise<T[]> => {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) throw error;
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
};

/** 한 번에 보내는 경로 수를 나눕니다(저장소 삭제·서명 주소). */
export const chunk = <T>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );
