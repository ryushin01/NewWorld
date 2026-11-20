import { forwardRef, type ComponentRef, type KeyboardEvent } from 'react';
import { Platform } from 'react-native';
import { styled, View, type GetProps } from 'tamagui';
import { toAriaProps, toAriaRole } from './web-a11y';

/** 터치 영역 44pt 이상을 보장하는 눌림 요소 */
const NativeTouchable = styled(View, {
  name: 'Touchable',
  minHeight: 44,
  minWidth: 44,
  accessible: true,
  accessibilityRole: 'button',
  opacity: '1 press:0.6',
});

const WebTouchableFrame = styled(View, {
  name: 'Touchable',
  minHeight: 44,
  minWidth: 44,
  opacity: '1 press:0.6',
  // 키보드 초점 표시. 바탕과 2px 띄워 버튼 색과 상관없이 보입니다.
  outlineStyle: 'solid',
  outlineColor: 'ink',
  outlineOffset: 2,
  outlineWidth: '0 focus-visible:2',
});

type TouchableProps = GetProps<typeof NativeTouchable>;

/**
 * 웹: 버튼 역할과 이름·상태를 ARIA로 알리고(web-a11y.ts), Tab으로 초점을 받아 Enter·Space로 누릅니다.
 * react-native-web의 Pressable처럼 div에 role을 붙여, 브라우저 기본 버튼 모양 없이 지금 스타일을 그대로 씁니다.
 */
const WebTouchable = forwardRef<ComponentRef<typeof WebTouchableFrame>, TouchableProps>(
  function Touchable({ accessibilityRole = 'button', onPress, ...props }, ref) {
    const role = toAriaRole(accessibilityRole);
    const onKeyDown = (event: KeyboardEvent) => {
      if (!onPress || props.disabled) return;
      if (event.key !== 'Enter' && (event.key !== ' ' || role === 'link')) return;
      // Space가 화면을 스크롤하지 않게 하고, 안에 든 버튼을 누르면 바깥 줄까지 눌리지 않게 합니다.
      event.preventDefault();
      event.stopPropagation();
      onPress(event as never);
    };
    return (
      <WebTouchableFrame
        ref={ref}
        {...toAriaProps({ accessibilityRole, ...props })}
        onPress={onPress}
        tabIndex={0}
        cursor={onPress ? 'pointer' : undefined}
        onKeyDown={onKeyDown}
      />
    );
  },
);

export const Touchable = (
  Platform.OS === 'web' ? WebTouchable : NativeTouchable
) as typeof NativeTouchable;
