import { clampOffset, fittedSize } from './zoom';

const viewport = { width: 400, height: 800 };

it('contain으로 맞춘 사진의 크기를 셉니다', () => {
  expect(fittedSize({ width: 1000, height: 1000 }, viewport)).toEqual({ width: 400, height: 400 });
  const landscape = fittedSize({ width: 3000, height: 2000 }, viewport);
  expect(landscape.width).toBeCloseTo(400);
  expect(landscape.height).toBeCloseTo(266.67, 1);
  // 크기를 모르는 사진은 화면 크기로 봅니다.
  expect(fittedSize({ width: 0, height: 0 }, viewport)).toEqual(viewport);
});

it('세로 화면의 정사각형 사진은 확대해도 위아래로 빈 곳이 보이지 않을 만큼만 끕니다', () => {
  const fitted = fittedSize({ width: 1000, height: 1000 }, viewport);
  // 2.5배면 사진 높이 1000 → 화면(800)보다 100씩 넘침
  expect(clampOffset(600, fitted.height, viewport.height, 2.5)).toBe(100);
  expect(clampOffset(-600, fitted.height, viewport.height, 2.5)).toBe(-100);
  // 가로는 1000 - 400 = 600 넘쳐 300까지
  expect(clampOffset(500, fitted.width, viewport.width, 2.5)).toBe(300);
});

it('줄여서 화면보다 작아지면 가운데로 돌아옵니다', () => {
  const fitted = fittedSize({ width: 1000, height: 1000 }, viewport);
  expect(clampOffset(300, fitted.width, viewport.width, 1)).toBeCloseTo(0);
  expect(clampOffset(-80, fitted.height, viewport.height, 1.5)).toBeCloseTo(0);
});
