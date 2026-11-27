import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useAutoPosition, usePosition } from './use-position';

const mockRequest = jest.fn<Promise<{ granted: boolean }>, []>();
const mockCheck = jest.fn<Promise<{ granted: boolean }>, []>();
const mockCurrent = jest.fn<Promise<{ coords: { latitude: number; longitude: number } }>, []>();
jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: () => mockRequest(),
  getForegroundPermissionsAsync: () => mockCheck(),
  getCurrentPositionAsync: () => mockCurrent(),
}));

const giza = { latitude: 29.97, longitude: 31.13 };

beforeEach(() => {
  mockRequest.mockReset().mockResolvedValue({ granted: true });
  mockCheck.mockReset().mockResolvedValue({ granted: true });
  mockCurrent.mockReset().mockResolvedValue({ coords: giza });
});

it('허락하면 현재 위치를 읽고, 거절하거나 묻기가 실패하면 위치 없이 끝납니다', async () => {
  const { result } = await renderHook(() => usePosition());
  let ok = false;
  await act(async () => {
    ok = await result.current.request();
  });
  expect(ok).toBe(true);
  expect(result.current.position).toEqual(giza);

  mockRequest.mockResolvedValue({ granted: false });
  await act(async () => {
    ok = await result.current.request();
  });
  expect(ok).toBe(false);

  mockRequest.mockRejectedValue(new Error('권한 창 오류'));
  await act(async () => {
    ok = await result.current.request();
  });
  expect(ok).toBe(false);
});

it('위치를 읽지 못하면 위치 없음으로 알립니다', async () => {
  mockCurrent.mockRejectedValue(new Error('GPS 없음'));
  const { result } = await renderHook(() => usePosition());
  let ok = true;
  await act(async () => {
    ok = await result.current.request();
  });
  expect(ok).toBe(false);
  expect(result.current.position).toBeNull();
});

it('이미 허락한 경우에만 화면을 열 때 위치를 읽습니다', async () => {
  const { result } = await renderHook(() => useAutoPosition());
  await waitFor(() => expect(result.current).toEqual(giza));

  mockCheck.mockResolvedValue({ granted: false });
  mockCurrent.mockClear();
  const second = await renderHook(() => useAutoPosition());
  await waitFor(() => expect(mockCheck).toHaveBeenCalledTimes(2));
  expect(second.result.current).toBeNull();
  expect(mockCurrent).not.toHaveBeenCalled();
});
