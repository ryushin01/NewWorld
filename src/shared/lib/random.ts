import * as Crypto from 'expo-crypto';

/**
 * 보안용 난수 바이트(암호 키, 복구 코드).
 * expo-crypto의 getRandomBytes는 개발 빌드에서 네이티브 동기 호출 훅이 없으면(새 아키텍처 등) Math.random으로
 * 대신하므로, 늘 네이티브 보안 난수를 쓰는 getRandomValues를 씁니다.
 */
export const secureRandomBytes = (count: number) => Crypto.getRandomValues(new Uint8Array(count));
