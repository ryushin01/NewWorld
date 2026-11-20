import { forwardRef, useId, type ComponentProps } from 'react';
import type { TextInput } from 'react-native';
import { Input, TextArea, YStack } from 'tamagui';
import { AppText } from './typography';
import { webOnly } from './web-a11y';

type FieldProps = {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  multiline?: boolean;
} & Omit<ComponentProps<typeof Input>, 'multiline'>;

/** 레이블과 오류 안내를 함께 제공하는 입력 필드 */
export const Field = forwardRef<TextInput, FieldProps>(function Field(
  { label, error, hint, required, multiline, ...input },
  ref,
) {
  const Control = multiline ? TextArea : Input;
  const accessibilityLabel = `${label}${required ? ', 필수' : ''}`;
  // 웹: 이름·도움말·오류 상태를 aria-*로 이어 줍니다(Tamagui 3는 웹에서 accessibility*를 바꾸지 않음).
  const descriptionId = useId();
  const description = error ?? hint;
  return (
    <YStack gap={8}>
      <AppText size="caption" tone="muted" bold>
        {label}
        {required ? ' (필수)' : ''}
      </AppText>
      <Control
        ref={ref as never}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={error ?? hint}
        minHeight={multiline ? 112 : 50}
        paddingHorizontal={14}
        paddingVertical={multiline ? 12 : 0}
        textAlignVertical={multiline ? 'top' : 'center'}
        borderWidth={1}
        borderRadius={6}
        borderColor={error ? 'danger' : 'line focus:ink'}
        backgroundColor="surface"
        color="text"
        fontSize={16}
        placeholderTextColor="muted"
        {...webOnly({
          'aria-label': accessibilityLabel,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': description ? descriptionId : undefined,
        })}
        {...input}
      />
      {error ? (
        <AppText
          size="caption"
          tone="danger"
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          {...webOnly({ id: descriptionId })}
        >
          {error}
        </AppText>
      ) : hint ? (
        <AppText size="caption" tone="muted" {...webOnly({ id: descriptionId })}>
          {hint}
        </AppText>
      ) : null}
    </YStack>
  );
});
