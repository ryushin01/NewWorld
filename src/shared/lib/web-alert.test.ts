import { Alert, Platform } from 'react-native';
import { installWebAlert } from './web-alert';

const original = { os: Platform.OS, alert: Alert.alert };

beforeEach(() => {
  Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
  installWebAlert();
});

afterEach(() => {
  Object.defineProperty(Platform, 'OS', { value: original.os, configurable: true });
  Alert.alert = original.alert;
  jest.restoreAllMocks();
});

it('취소와 동작이 있는 확인 창은 브라우저 confirm으로 묻고, 확인하면 동작을 부릅니다', () => {
  const confirm = jest.fn(() => true);
  Object.assign(globalThis, { window: { ...globalThis.window, confirm } });
  const onDelete = jest.fn();
  const onCancel = jest.fn();
  Alert.alert('기록 삭제', '이 기록과 첨부 사진이 삭제됩니다.', [
    { text: '취소', style: 'cancel', onPress: onCancel },
    { text: '삭제', style: 'destructive', onPress: onDelete },
  ]);
  expect(confirm).toHaveBeenCalledWith('기록 삭제\n\n이 기록과 첨부 사진이 삭제됩니다.');
  expect(onDelete).toHaveBeenCalled();
  expect(onCancel).not.toHaveBeenCalled();
});

it('취소하면 취소 버튼과 닫힘 콜백을 부릅니다', () => {
  Object.assign(globalThis, { window: { ...globalThis.window, confirm: () => false } });
  const onCancel = jest.fn();
  const onDismiss = jest.fn();
  const onGo = jest.fn();
  Alert.alert(
    '알림',
    undefined,
    [
      { text: '취소', style: 'cancel', onPress: onCancel },
      { text: '계속', onPress: onGo },
    ],
    { onDismiss },
  );
  expect(onGo).not.toHaveBeenCalled();
  expect(onCancel).toHaveBeenCalled();
  expect(onDismiss).toHaveBeenCalled();
});

it('동작 버튼이 없으면 브라우저 alert로 알립니다', () => {
  const alert = jest.fn();
  Object.assign(globalThis, { window: { ...globalThis.window, alert } });
  Alert.alert('카메라 권한 필요', '설정에서 카메라 권한을 허용해 주세요.');
  expect(alert).toHaveBeenCalledWith('카메라 권한 필요\n\n설정에서 카메라 권한을 허용해 주세요.');
});
