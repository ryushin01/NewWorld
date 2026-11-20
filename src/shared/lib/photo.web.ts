import * as Crypto from 'expo-crypto';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { LocalPhoto } from '../api/types';

/**
 * 웹 데모용 사진 처리입니다(expo-file-system은 웹에 파일 폴더가 없음). photo.ts와 같은 모양을 내보냅니다.
 * 줄인 사진은 data URL로 바꿔 브라우저 저장소에 두고, 저장소가 가득 차면 이번 방문 동안만 메모리에 둡니다.
 */
const MAX_EDGE = 1920;
const KEY_PREFIX = 'newworld.photo.';

const toBytes = async (uri: string) => (await fetch(uri)).arrayBuffer();

/** 긴 변을 줄이고 JPEG로 압축합니다. 브라우저 캔버스로 다시 그리므로 위치 정보(EXIF)도 빠집니다. */
export const compressPhoto = async (photo: LocalPhoto, maxEdge = MAX_EDGE) => {
  if (!(maxEdge > 0)) throw new RangeError(`maxEdge must be positive: ${maxEdge}`);
  const context = ImageManipulator.manipulate(photo.uri, { maxWidth: maxEdge, maxHeight: maxEdge });
  let rendered: Awaited<ReturnType<typeof context.renderAsync>> | undefined;
  try {
    rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
    return { bytes: await toBytes(saved.uri), width: saved.width, height: saved.height };
  } catch (error) {
    // 브라우저가 그리지 못하는 형식(예: HEIC)은 다른 사진을 고르게 합니다(photo.ts와 같은 오류).
    throw new Error('Unsupported photo format', { cause: error });
  } finally {
    rendered?.release();
    context.release();
  }
};

const memory = new Map<string, string>();

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

const keep = async (blob: Blob) => {
  const name = `${Crypto.randomUUID()}.jpg`;
  const url = await toDataUrl(blob);
  memory.set(name, url);
  try {
    localStorage.setItem(KEY_PREFIX + name, url);
  } catch {
    // 저장소 한도(보통 5MB)를 넘으면 새로고침 전까지만 보입니다.
  }
  return name;
};

export const photoStore = {
  async save(uri: string) {
    return keep(await (await fetch(uri)).blob());
  },
  async write(bytes: ArrayBuffer) {
    return keep(new Blob([bytes], { type: 'image/jpeg' }));
  },
  uriOf: (name: string) => memory.get(name) ?? localStorage.getItem(KEY_PREFIX + name) ?? '',
  remove(name: string) {
    memory.delete(name);
    localStorage.removeItem(KEY_PREFIX + name);
  },
};
