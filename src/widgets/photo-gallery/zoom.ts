type Size = { width: number; height: number };

/**
 * 화면에 contain으로 맞춘 사진이 실제로 차지하는 크기. 사진 크기를 모르면 화면 크기로 봅니다.
 * 세로 화면에 정사각형 사진을 맞추면 위아래가 비므로, 끌 수 있는 범위는 화면이 아니라 이 크기로 셉니다.
 */
export const fittedSize = (photo: Size, viewport: Size): Size => {
  'worklet';
  if (!(photo.width > 0 && photo.height > 0)) return viewport;
  const fit = Math.min(viewport.width / photo.width, viewport.height / photo.height);
  return { width: photo.width * fit, height: photo.height * fit };
};

/** 확대한 사진이 화면 밖으로 나간 만큼만 끌 수 있게 해, 사진 밖의 빈 곳이 보이지 않게 합니다. */
export const clampOffset = (offset: number, fitted: number, viewport: number, zoom: number) => {
  'worklet';
  const limit = Math.max(0, (fitted * zoom - viewport) / 2);
  return Math.min(limit, Math.max(-limit, offset));
};
