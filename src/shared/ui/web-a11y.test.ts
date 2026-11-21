import { toAriaProps, toAriaRole } from './web-a11y';

it('React Native 역할 이름을 ARIA 역할로 바꿉니다', () => {
  expect(toAriaRole('header')).toBe('heading');
  expect(toAriaRole('image')).toBe('img');
  expect(toAriaRole('button')).toBe('button');
  expect(toAriaRole('text')).toBeUndefined();
  expect(toAriaRole(undefined)).toBeUndefined();
});

it('이름과 상태를 aria-*로 옮기고 accessibility* 속성은 남기지 않습니다', () => {
  const props = toAriaProps({
    accessible: true,
    accessibilityRole: 'radio',
    accessibilityLabel: '역사',
    accessibilityHint: '분류를 고릅니다',
    accessibilityState: { selected: true, disabled: true },
    testID: 'chip',
  });
  expect(props).toEqual({
    role: 'radio',
    'aria-label': '역사',
    'aria-checked': true,
    'aria-disabled': true,
    testID: 'chip',
  });
});

it('알림 영역과 숨김을 aria-live·aria-hidden으로 옮깁니다', () => {
  expect(toAriaProps({ accessibilityRole: 'alert', accessibilityLiveRegion: 'polite' })).toEqual({
    role: 'alert',
    'aria-live': 'polite',
  });
  expect(toAriaProps({ importantForAccessibility: 'no-hide-descendants' })).toEqual({
    'aria-hidden': true,
  });
});

it('선택 상태는 탭에서만 aria-selected로, 버튼에는 붙이지 않습니다', () => {
  expect(
    toAriaProps({ accessibilityRole: 'tab', accessibilityState: { selected: false } }),
  ).toEqual({ role: 'tab', 'aria-selected': false });
  expect(
    toAriaProps({ accessibilityRole: 'button', accessibilityState: { selected: true } }),
  ).toEqual({ role: 'button' });
});

it('제목에는 aria-level을 붙입니다(없으면 axe가 aria-required-attr로 막음)', () => {
  expect(toAriaProps({ accessibilityRole: 'header' })).toEqual({
    role: 'heading',
    'aria-level': 2,
  });
  expect(toAriaProps({ accessibilityRole: 'header', 'aria-level': 1 })).toEqual({
    role: 'heading',
    'aria-level': 1,
  });
});
