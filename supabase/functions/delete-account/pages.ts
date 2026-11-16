/** Supabase API는 한 번에 최대 1,000행까지만 돌려줍니다(max_rows 기본값). */
export const PAGE_SIZE = 1000;

type Page<T> = PromiseLike<{ data: T[] | null; error: unknown }>;

/**
 * 1,000행씩 끝까지 읽습니다. 한 번만 조회하면 사진이 1,000장을 넘는 회원의 나머지 파일이 남습니다.
 * 위치(offset)가 아니라 마지막으로 받은 키 다음부터 읽어, 그사이 행이 지워져도 뒤 행이 빠지지 않습니다.
 * fetchPage는 키 순서로 정렬(`.order(key)`)하고 PAGE_SIZE개만 읽되(`.limit`), after가 있으면
 * 그 다음부터(`.gt(key, after)`) 읽어야 합니다. 앱에도 같은 도우미가 있습니다(src/shared/api/pages.ts).
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

/** 저장소 삭제는 한 번에 보내는 경로 수를 나눠 보냅니다. */
export const chunk = <T>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );
