import { fieldErrorMessage } from './field-error';

it('칸 전체의 오류 문구를 돌려줍니다', () => {
  expect(fieldErrorMessage({ type: 'too_big', message: '태그는 20개까지 넣을 수 있습니다.' })).toBe(
    '태그는 20개까지 넣을 수 있습니다.',
  );
});

it('배열 칸은 원소 가운데 처음 나오는 오류 문구를 돌려줍니다', () => {
  const error = [undefined, { type: 'too_big', message: '태그는 30자 이내로 입력해 주세요.' }];
  expect(fieldErrorMessage(error)).toBe('태그는 30자 이내로 입력해 주세요.');
  expect(fieldErrorMessage({ root: { message: '동행은 50명까지 넣을 수 있습니다.' } })).toBe(
    '동행은 50명까지 넣을 수 있습니다.',
  );
  expect(fieldErrorMessage(undefined)).toBeUndefined();
});
