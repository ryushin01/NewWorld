import { ImageManipulator } from 'expo-image-manipulator';
import { compressPhoto, photoStore } from './photo.web';

jest.mock('expo-crypto', () => ({ randomUUID: () => 'uuid' }));
const mockRenderAsync = jest.fn();
jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  ImageManipulator: {
    manipulate: jest.fn(() => ({ renderAsync: mockRenderAsync, release: jest.fn() })),
  },
}));

// Node에는 브라우저의 FileReader가 없어 data URL로 읽는 부분만 같은 결과로 채웁니다.
class NodeFileReader {
  result: string | null = null;
  onload: (() => void) | null = null;
  readAsDataURL(blob: Blob) {
    void blob.arrayBuffer().then((buffer) => {
      this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString('base64')}`;
      this.onload?.();
    });
  }
}
Object.defineProperty(globalThis, 'FileReader', { value: NodeFileReader, configurable: true });

const fetchMock = jest.spyOn(globalThis, 'fetch');
afterEach(() => fetchMock.mockReset());

it('줄인 사진의 주소를 읽어 바이트로 돌려줍니다', async () => {
  mockRenderAsync.mockResolvedValue({
    saveAsync: async () => ({ uri: 'blob:photo', width: 1920, height: 1275 }),
    release: jest.fn(),
  });
  fetchMock.mockResolvedValue(new Response(new Uint8Array([1, 2, 3])));
  const result = await compressPhoto({ uri: 'blob:original', width: 4288, height: 2848 });
  expect(ImageManipulator.manipulate).toHaveBeenCalledWith('blob:original', {
    maxWidth: 1920,
    maxHeight: 1920,
  });
  expect(String(fetchMock.mock.calls[0]?.[0])).toBe('blob:photo');
  expect([...new Uint8Array(result.bytes)]).toEqual([1, 2, 3]);
  expect(result).toMatchObject({ width: 1920, height: 1275 });
});

it('고른 사진을 읽어 data URL로 보관합니다', async () => {
  fetchMock.mockResolvedValue(new Response(new Blob(['jpg'], { type: 'image/jpeg' })));
  const name = await photoStore.save('blob:picked');
  expect(name).toBe('uuid.jpg');
  expect(photoStore.uriOf(name)).toBe(`data:image/jpeg;base64,${btoa('jpg')}`);
});
