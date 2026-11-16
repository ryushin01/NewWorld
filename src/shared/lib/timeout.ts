/**
 * 정한 시간 안에 끝나지 않으면 fallback을 돌려줍니다. 원래 작업은 멈추지 않습니다.
 * 먼저 끝나면 타이머를 지워, 호출할 때마다 타이머가 남아 쌓이지 않게 합니다.
 */
export const withTimeout = async <T, F>(
  work: Promise<T>,
  ms: number,
  fallback: F,
): Promise<T | F> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<F>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
};
