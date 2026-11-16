import { placeSchema } from './schema';

const place = {
  name: '이름 모를 고분군',
  kind: 'real' as const,
  address: '경주',
  latitude: 35.8,
  longitude: 129.2,
  memo: '',
  tags: ['신라'],
  catalogId: null,
  wishlisted: false,
};

it('검색에서 받아 온 긴 주소는 DB 상한(300자)에 맞춰 자릅니다', () => {
  const parsed = placeSchema.parse({ ...place, address: '가'.repeat(400) });
  expect(parsed.address).toHaveLength(300);
});

it('주소를 자를 때 이모지처럼 두 칸을 쓰는 글자를 반으로 쪼개지 않습니다', () => {
  const { address } = placeSchema.parse({ ...place, address: `${'a'.repeat(299)}😀끝` });
  expect(Array.from(address)).toHaveLength(300);
  expect(address.endsWith('😀')).toBe(true);
  expect(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(address)).toBe(false);
});

it('메모·태그의 길이와 개수 상한을 넘으면 거부합니다', () => {
  expect(placeSchema.safeParse({ ...place, memo: 'ㄱ'.repeat(2001) }).success).toBe(false);
  expect(placeSchema.safeParse({ ...place, tags: ['ㄱ'.repeat(31)] }).success).toBe(false);
  const tags = Array.from({ length: 21 }, (_, index) => `태그${index}`);
  expect(placeSchema.safeParse({ ...place, tags }).success).toBe(false);
  expect(placeSchema.safeParse(place).success).toBe(true);
});
