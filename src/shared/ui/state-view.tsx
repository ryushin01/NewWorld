import { ActivityIndicator } from 'react-native';
import { YStack } from 'tamagui';
import { Button } from './button';
import { useColors } from './colors';
import { AppText } from './typography';

export const LoadingView = ({ label = '불러오는 중입니다.' }: { label?: string }) => {
  const colors = useColors();
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding={24} gap={12}>
      {/* 웹에서 role="progressbar"가 되므로 이름을 돌림표 자체에 붙입니다(axe aria-progressbar-name). */}
      <ActivityIndicator
        color={colors.ink}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={label}
      />
    </YStack>
  );
};

type MessageViewProps = { message: string; actionLabel?: string; onAction?: () => void };

export const MessageView = ({ message, actionLabel, onAction }: MessageViewProps) => (
  <YStack flex={1} alignItems="center" justifyContent="center" padding={32} gap={16}>
    <AppText tone="muted" textAlign="center">
      {message}
    </AppText>
    {actionLabel && onAction ? (
      <Button variant="outline" label={actionLabel} onPress={onAction} />
    ) : null}
  </YStack>
);
