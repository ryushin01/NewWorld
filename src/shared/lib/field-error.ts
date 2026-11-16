/**
 * 폼 칸의 오류 문구를 꺼냅니다. 배열 칸(태그·동행)은 칸 전체의 오류(개수) 대신 원소마다 오류(글자 수)가
 * 배열로 들어오므로, 처음 나오는 문구를 돌려줍니다.
 */
export const fieldErrorMessage = (error: unknown): string | undefined => {
  if (!error || typeof error !== 'object') return undefined;
  const { message, root } = error as { message?: unknown; root?: unknown };
  if (typeof message === 'string' && message) return message;
  if (Array.isArray(error)) {
    for (const item of error) {
      const found = fieldErrorMessage(item);
      if (found) return found;
    }
  }
  return fieldErrorMessage(root);
};
