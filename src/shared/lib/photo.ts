import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { LocalPhoto } from '../api/types';

const MAX_EDGE = 1920;

/** expo-image-manipulator가 사진을 읽거나 JPEG 데이터로 만들지 못했을 때의 오류입니다. */
const UNREADABLE = /could not load the image|cannot create image data/i;
const isUnreadablePhoto = (error: unknown) =>
  error instanceof Error && UNREADABLE.test(error.message);

/** 임시 파일을 지웁니다. 지우지 못해도 OS가 캐시를 비울 때 지워지므로 저장은 그대로 진행합니다. */
const discard = (file: File) => {
  try {
    if (file.exists) file.delete();
  } catch {
    // 위와 같은 이유로 무시합니다.
  }
};

/** 긴 변을 줄이고 JPEG로 압축합니다. 위치 정보(EXIF)도 이 과정에서 제거됩니다. */
export const compressPhoto = async (photo: LocalPhoto, maxEdge = MAX_EDGE) => {
  if (!(maxEdge > 0)) throw new RangeError(`maxEdge must be positive: ${maxEdge}`);
  // 불러올 때부터 작게 읽어 원본 크기의 비트맵을 메모리에 올리지 않습니다. 사진이 더 작으면 원래 크기로 읽습니다.
  // (`photos.map(compressPhoto)`처럼 넘기면 배열 순서 번호가 maxEdge로 들어가므로 위에서 막습니다.)
  const context = ImageManipulator.manipulate(photo.uri, { maxWidth: maxEdge, maxHeight: maxEdge });
  let rendered: Awaited<ReturnType<typeof context.renderAsync>> | undefined;
  const saved = await context
    .renderAsync()
    .then((image) => {
      rendered = image;
      return image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
    })
    .catch((error: unknown) => {
      // 읽거나 JPEG로 만들 수 없는 사진은 위치 정보가 남은 원본을 그대로 올리지 않고 다른 사진을 고르게 합니다.
      // 파일 쓰기 실패 같은 다른 오류는 사진을 바꿔도 해결되지 않으므로 그대로 던집니다.
      if (isUnreadablePhoto(error)) throw new Error('Unsupported photo format', { cause: error });
      throw error;
    })
    .finally(() => {
      // 네이티브 이미지는 GC를 기다리지 않고 바로 놓아, 사진 여러 장을 연달아 줄일 때 메모리가 쌓이지 않게 합니다.
      rendered?.release();
      context.release();
    });
  // 줄인 사진은 데이터로 읽어 쓰고 캐시 폴더에 남기지 않습니다. 남기면 저장한 사진만큼 앱 용량이 계속 늘어납니다.
  const output = new File(saved.uri);
  try {
    const bytes = await output.arrayBuffer();
    return { bytes, width: saved.width, height: saved.height };
  } finally {
    discard(output);
  }
};

const outboxDir = () => new Directory(Paths.document, 'outbox-photos');

const newStoredFile = () => {
  const directory = outboxDir();
  directory.create({ intermediates: true, idempotent: true });
  const name = `${Crypto.randomUUID()}.jpg`;
  return { name, file: new File(directory, name) };
};

/**
 * 업로드 대기 중인 사진 보관소입니다.
 * 임시 폴더의 원본은 OS가 지울 수 있어 문서 폴더로 복사합니다.
 * iOS는 앱 업데이트 때 컨테이너 경로가 바뀌므로 경로가 아닌 파일 이름을 저장합니다.
 */
export const photoStore = {
  /** 고른 사진 파일을 복사해 둡니다. */
  async save(uri: string) {
    const { name, file } = newStoredFile();
    await new File(uri).copy(file);
    return name;
  },
  /** 줄인 사진 데이터를 파일로 씁니다(데모 모드의 기록 사진과 프로필 사진). */
  async write(bytes: ArrayBuffer) {
    const { name, file } = newStoredFile();
    await file.write(bytes);
    return name;
  },
  uriOf: (name: string) => new File(outboxDir(), name).uri,
  remove(name: string) {
    const file = new File(outboxDir(), name);
    if (file.exists) file.delete();
  },
};
