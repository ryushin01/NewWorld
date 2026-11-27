import { act, renderHook } from '@testing-library/react-native';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { useCaptureShare } from './use-capture-share';
import { downloadOnWeb } from './web-download';

jest.mock('expo-sharing', () => ({ shareAsync: jest.fn() }));
jest.mock('react-native-view-shot', () => ({ captureRef: jest.fn() }));
jest.mock('./web-download', () => ({ downloadOnWeb: jest.fn() }));
afterEach(() => jest.clearAllMocks());

it('빠르게 두 번 눌러도 한 번만 찍어 공유합니다', async () => {
  let finish: (uri: string) => void = () => undefined;
  jest.mocked(captureRef).mockReturnValue(new Promise((resolve) => (finish = resolve)));
  const { result } = await renderHook(() => useCaptureShare());
  const target = { current: {} };
  let first: Promise<boolean> = Promise.resolve(false);
  await act(async () => {
    first = result.current.share(target, { dialogTitle: '공유' });
    await result.current.share(target, { dialogTitle: '공유' });
  });
  await act(async () => {
    finish('file:///card.jpg');
    expect(await first).toBe(true);
  });
  expect(captureRef).toHaveBeenCalledTimes(1);
  expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///card.jpg', {
    mimeType: 'image/jpeg',
    dialogTitle: '공유',
  });
});

it('이미지를 만들지 못하면 false를 돌려줍니다', async () => {
  jest.mocked(captureRef).mockRejectedValue(new Error('fail'));
  const { result } = await renderHook(() => useCaptureShare());
  let ok = true;
  await act(async () => {
    ok = await result.current.share({ current: {} }, { dialogTitle: '공유' });
  });
  expect(ok).toBe(false);
});

describe('웹 데모', () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch');
  afterEach(() => fetchMock.mockReset());

  it('찍은 이미지를 파일로 읽어 내려받기로 건넵니다', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    jest.mocked(captureRef).mockResolvedValue('data:image/png;base64,AAAA');
    fetchMock.mockResolvedValue(new Response(new Blob(['png'], { type: 'image/png' })));
    const { result } = await renderHook(() => useCaptureShare());
    let ok = false;
    await act(async () => {
      ok = await result.current.share({ current: {} }, { dialogTitle: '공유', format: 'png' });
    });
    expect(ok).toBe(true);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('data:image/png;base64,AAAA');
    expect(downloadOnWeb).toHaveBeenCalledWith(expect.any(File), 'newworld.png');
    const [file] = jest.mocked(downloadOnWeb).mock.calls[0] ?? [];
    expect(file?.type).toBe('image/png');
    await expect(file?.text()).resolves.toBe('png');
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });
});
