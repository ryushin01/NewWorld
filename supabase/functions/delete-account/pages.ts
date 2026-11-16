/** Supabase API는 한 번에 최대 1,000행까지만 돌려줍니다(max_rows 기본값). */
export const PAGE_SIZE = 1000;

type Page<T> = PromiseLike<{ data: T[] | null; error: unknown }>;

/**
 * 1,000행씩 끝까지 읽습니다. 한 번만 조회하면 사진이 1,000장을 넘는 회원의 나머지 파일이 남습니다.
 * fetchPage는 `.order(...)`로 순서를 고정한 뒤 `.range(from, to)`로 한 쪽을 읽어야 합니다.
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

/** 저장소 삭제는 한 번에 보내는 경로 수를 나눠 보냅니다. */
export const chunk = <T>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );
