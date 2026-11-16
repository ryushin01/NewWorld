import * as Crypto from 'expo-crypto';
import { secureRandomBytes } from './random';

jest.mock('expo-crypto', () => ({
  getRandomValues: jest.fn((array: Uint8Array) => array.fill(7)),
  getRandomBytes: jest.fn(),
}));

it('개발 빌드에서 Math.random으로 대신할 수 있는 getRandomBytes 대신 getRandomValues를 씁니다', () => {
  expect(secureRandomBytes(4)).toEqual(new Uint8Array([7, 7, 7, 7]));
  expect(Crypto.getRandomValues).toHaveBeenCalledTimes(1);
  expect(Crypto.getRandomBytes).not.toHaveBeenCalled();
});
