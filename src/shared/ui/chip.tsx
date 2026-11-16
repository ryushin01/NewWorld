import { useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { Field } from './field';
import { Touchable } from './pressable';
import { AppText } from './typography';
import { AppIcon } from './icon';
import { X } from './icons';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  testID?: string;
};

export const Chip = ({ label, selected, onPress, testID }: ChipProps) => (
  <Touchable
    testID={testID}
    onPress={onPress}
    accessibilityLabel={label}
    accessibilityRole="radio"
    accessibilityState={{ selected: !!selected, checked: !!selected }}
    paddingHorizontal={14}
    borderRadius={22}
    borderWidth={1}
    borderColor={selected ? 'ink' : 'line'}
    backgroundColor={selected ? 'ink' : 'surface'}
    alignItems="center"
    justifyContent="center"
  >
    <AppText size="caption" bold={selected} tone={selected ? 'inverse' : 'default'}>
      {label}
    </AppText>
  </Touchable>
);

export const Tag = ({ label, onRemove }: { label: string; onRemove?: () => void }) => (
  <XStack
    backgroundColor="brandSoft"
    borderRadius={6}
    paddingLeft={10}
    paddingRight={onRemove ? 0 : 10}
    minHeight={onRemove ? 44 : 28}
    alignItems="center"
  >
    <AppText size="caption" tone="ink">
      {label}
    </AppText>
    {onRemove ? (
      <Touchable
        onPress={onRemove}
        accessibilityLabel={`${label} 삭제`}
        alignItems="center"
        justifyContent="center"
      >
        <AppIcon icon={X} size={14} color="ink" />
      </Touchable>
    ) : null}
  </XStack>
);

type TagInputProps = {
  label: string;
  placeholder: string;
  value: string[];
  onChange: (next: string[]) => void;
  testID?: string;
  /** 눌러서 바로 추가할 수 있는 최근 값 */
  suggestions?: string[];
  /** 넣을 수 있는 개수. 다 차면 입력 칸을 막고 안내합니다. */
  maxItems?: number;
  /** 값 하나의 글자 수 */
  maxLength?: number;
};

/** 완료 키로 값을 하나씩 추가하는 입력 */
export const TagInput = ({
  label,
  placeholder,
  value,
  onChange,
  testID,
  suggestions = [],
  maxItems,
  maxLength,
}: TagInputProps) => {
  const [draft, setDraft] = useState('');
  const full = maxItems !== undefined && value.length >= maxItems;
  const remaining = full ? [] : suggestions.filter((item) => !value.includes(item)).slice(0, 6);
  const commit = () => {
    const next = draft.trim();
    if (next && !full && !value.includes(next)) onChange([...value, next]);
    setDraft('');
  };
  return (
    <YStack gap={8}>
      <Field
        testID={testID}
        label={label}
        placeholder={placeholder}
        hint={
          full
            ? `${label}은(는) ${maxItems}개까지 넣을 수 있습니다.`
            : '입력 후 완료 키를 누르면 추가됩니다.'
        }
        disabled={full}
        maxLength={maxLength}
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={commit}
        onBlur={commit}
        submitBehavior="submit"
        returnKeyType="done"
      />
      {value.length > 0 ? (
        <XStack flexWrap="wrap" gap={8}>
          {value.map((item) => (
            <Tag
              key={item}
              label={item}
              onRemove={() => onChange(value.filter((other) => other !== item))}
            />
          ))}
        </XStack>
      ) : null}
      {remaining.length > 0 ? (
        <XStack flexWrap="wrap" gap={8}>
          {remaining.map((item) => (
            <Touchable
              key={item}
              testID={`suggestion-${item}`}
              onPress={() => onChange([...value, item])}
              accessibilityLabel={`${label}에 ${item} 추가`}
              paddingHorizontal={12}
              borderRadius={22}
              borderWidth={1}
              borderColor="line"
              alignItems="center"
              justifyContent="center"
            >
              <AppText size="caption" tone="muted">
                + {item}
              </AppText>
            </Touchable>
          ))}
        </XStack>
      ) : null}
    </YStack>
  );
};
