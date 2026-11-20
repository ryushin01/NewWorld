import { Alert, Platform } from 'react-native';

/**
 * react-native-web의 Alert.alert는 아무것도 하지 않아, 웹 데모에서 확인 창이 뜨지 않고
 * 삭제·로그아웃·나가기 같은 동작이 멈췄습니다. 웹에서만 브라우저 기본 창(alert·confirm)으로 바꿉니다.
 * 이 앱의 확인 창은 버튼이 없거나 닫기 하나, 또는 취소와 동작 하나뿐입니다.
 */
export const installWebAlert = () => {
  if (Platform.OS !== 'web') return;
  Alert.alert = (title, message, buttons = [], options) => {
    const text = [title, message].filter(Boolean).join('\n\n');
    const cancel = buttons.find((button) => button.style === 'cancel');
    const action = buttons.find((button) => button !== cancel);
    if (!action) {
      window.alert(text);
      cancel?.onPress?.();
      return;
    }
    if (window.confirm(text)) {
      action.onPress?.();
      return;
    }
    cancel?.onPress?.();
    options?.onDismiss?.();
  };
};
