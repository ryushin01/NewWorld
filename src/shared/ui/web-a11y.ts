import { Platform } from 'react-native';

/**
 * Tamagui 3는 웹에서 React Native의 accessibility* 속성을 바꾸지 않고 그대로 DOM에 넘겨,
 * 버튼이 버튼으로 읽히지 않고 키보드로 갈 수도 없었습니다. 웹 데모에서만 표준 role·aria-*로 바꿉니다.
 * iOS·Android는 지금처럼 accessibility* 속성을 그대로 씁니다.
 */
type A11yState = {
  disabled?: boolean;
  selected?: boolean;
  checked?: boolean | 'mixed';
  busy?: boolean;
  expanded?: boolean;
};

export type NativeA11yProps = {
  accessible?: boolean;
  accessibilityRole?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: A11yState;
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
  accessibilityElementsHidden?: boolean;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
  /** 웹 제목의 단계. 없으면 2(화면 제목 아래 구역 제목)로 둡니다. */
  'aria-level'?: number;
};

/** React Native 역할 이름 중 ARIA와 다른 것 */
const ROLES: Record<string, string | undefined> = {
  header: 'heading',
  image: 'img',
  imagebutton: 'button',
  togglebutton: 'button',
  adjustable: 'slider',
  text: undefined,
  none: undefined,
};
const CHECKABLE = new Set(['checkbox', 'radio', 'switch', 'menuitemcheckbox', 'menuitemradio']);
const SELECTABLE = new Set(['tab', 'option', 'gridcell', 'row']);

export const toAriaRole = (role: string | undefined) =>
  role === undefined ? undefined : role in ROLES ? ROLES[role] : role;

export const toAriaProps = <P extends NativeA11yProps>({
  accessible: _accessible,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint: _hint,
  accessibilityState,
  accessibilityLiveRegion,
  accessibilityElementsHidden,
  importantForAccessibility,
  'aria-level': level,
  ...rest
}: P) => {
  const role = toAriaRole(accessibilityRole);
  const state = accessibilityState ?? {};
  const aria: Record<string, unknown> = {
    role,
    // role="heading"은 aria-level이 있어야 합니다(없으면 화면 낭독기가 단계를 알 수 없음).
    'aria-level': role === 'heading' ? (level ?? 2) : level,
    'aria-label': accessibilityLabel,
    'aria-disabled': state.disabled || undefined,
    'aria-busy': state.busy || undefined,
    'aria-expanded': state.expanded,
    'aria-checked':
      role && CHECKABLE.has(role) ? (state.checked ?? Boolean(state.selected)) : undefined,
    'aria-selected': role && SELECTABLE.has(role) ? state.selected : undefined,
    'aria-live': accessibilityLiveRegion === 'none' ? 'off' : accessibilityLiveRegion,
    'aria-hidden':
      accessibilityElementsHidden ||
      importantForAccessibility === 'no-hide-descendants' ||
      undefined,
  };
  for (const key of Object.keys(aria)) if (aria[key] === undefined) delete aria[key];
  return { ...rest, ...aria } as Omit<P, keyof NativeA11yProps>;
};

/**
 * 장식 요소를 웹에서도 화면 낭독기와 Tab 순서에서 뺍니다. accessibilityElementsHidden·importantForAccessibility와
 * 함께 쓰며, iOS·Android에는 아무것도 더하지 않습니다.
 */
export const webHidden =
  Platform.OS === 'web' ? ({ 'aria-hidden': true, inert: true } as const) : {};

/** 웹에서만 더할 속성(aria-*·id). iOS·Android에는 아무것도 더하지 않아 기존 동작이 그대로입니다. */
export const webOnly = <T extends object>(props: T): Partial<T> =>
  Platform.OS === 'web' ? props : {};
