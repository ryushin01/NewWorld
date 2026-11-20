import * as Sharing from 'expo-sharing';
import { useRef, useState, type RefObject } from 'react';
import { Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { downloadOnWeb } from './web-download';

type CaptureOptions = { dialogTitle: string; format?: 'jpg' | 'png' };

/**
 * 웹 데모: 브라우저 공유 창이 이미지 파일을 받으면 그 창을 열고, 아니면 이미지를 내려받습니다.
 * expo-sharing은 웹에서 주소만 넘겨 찍은 이미지(data URL)를 공유하지 못합니다.
 */
const shareImageOnWeb = async (uri: string, format: 'jpg' | 'png', title: string) => {
  const blob = await (await fetch(uri)).blob();
  const file = new File([blob], `newworld.${format}`, {
    type: format === 'jpg' ? 'image/jpeg' : 'image/png',
  });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return;
    } catch (error) {
      // 사용자가 공유 창을 닫았으면 그대로 끝냅니다. 찍는 사이 누름의 유효 시간이 지나 창을 열지 못했으면 내려받습니다.
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
  }
  downloadOnWeb(file, file.name);
};

/**
 * 화면에 보이는 뷰를 이미지로 찍어 공유 창을 엽니다. iOS는 화면 밖 뷰를 찍지 못하므로 보이는 상태에서 부릅니다.
 * 찍는 동안 다시 누르면 공유 창이 겹치므로 ref로 막습니다. 실패하면 false를 돌려줍니다.
 */
export const useCaptureShare = () => {
  const busy = useRef(false);
  const [sharing, setSharing] = useState(false);

  const share = async (
    target: RefObject<unknown>,
    { dialogTitle, format = 'jpg' }: CaptureOptions,
  ) => {
    if (busy.current) return true;
    busy.current = true;
    setSharing(true);
    try {
      const uri = await captureRef(target as Parameters<typeof captureRef>[0], {
        format,
        quality: format === 'jpg' ? 0.9 : 1,
      });
      if (Platform.OS === 'web') {
        await shareImageOnWeb(uri, format, dialogTitle);
        return true;
      }
      await Sharing.shareAsync(uri, {
        mimeType: format === 'jpg' ? 'image/jpeg' : 'image/png',
        dialogTitle,
      });
      return true;
    } catch {
      return false;
    } finally {
      busy.current = false;
      setSharing(false);
    }
  };

  return { share, sharing };
};
