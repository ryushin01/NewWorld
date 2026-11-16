import { initialOf, matchesSearch } from './hangul';

it('음절의 초성을 돌려주고, 음절이 아니면 그대로 둡니다', () => {
  expect(initialOf('피')).toBe('ㅍ');
  expect(initialOf('까')).toBe('ㄲ');
  expect(initialOf('A')).toBe('A');
});

it('초성만으로 찾습니다', () => {
  expect(matchesSearch('기자의 피라미드', 'ㅍㄹㅁㄷ')).toBe(true);
  expect(matchesSearch('아발론', 'ㅇㅂㄹ')).toBe(true);
  expect(matchesSearch('아발론', 'ㅇㅂㄹㄴ')).toBe(false);
  expect(matchesSearch('마추픽추', 'ㅁㅊ')).toBe(true);
});

it('초성과 완성된 글자를 섞어 쳐도 찾습니다', () => {
  expect(matchesSearch('기자의 피라미드', '피라ㅁ')).toBe(true);
  expect(matchesSearch('기자의 피라미드', 'ㅍ라미')).toBe(true);
});

it('마지막 글자를 치는 중(받침 전)이어도 찾습니다', () => {
  expect(matchesSearch('아발론', '아발로')).toBe(true);
  expect(matchesSearch('샹그릴라', '샹그리')).toBe(true);
  // 받침까지 친 글자는 그 글자와만 맞습니다.
  expect(matchesSearch('아발론', '아발롱')).toBe(false);
  expect(matchesSearch('아발론', '아바로')).toBe(false);
});

it('띄어쓰기와 대소문자를 따지지 않고, 빈 검색어는 모두 맞습니다', () => {
  expect(matchesSearch('Machu Picchu', 'machupicchu')).toBe(true);
  expect(matchesSearch('기자의 피라미드', '기자의피라미드')).toBe(true);
  expect(matchesSearch('아발론', '  ')).toBe(true);
  expect(matchesSearch('아발론', '에덴')).toBe(false);
});
