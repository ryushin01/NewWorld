import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

/** 외부 주소를 브라우저나 해당 앱으로 엽니다. 열었으면 true입니다. 실패 안내는 화면이 띄웁니다. */
export const openLink = (url: string) =>
  Linking.openURL(url).then(
    () => true,
    () => false,
  );

type MapTarget = { latitude: number; longitude: number; name: string };

/** 좌표를 기기의 지도 앱으로 엽니다. iOS는 Apple 지도, Android는 geo 주소를 받는 앱입니다. */
export const openInMaps = ({ latitude, longitude, name }: MapTarget) => {
  const label = encodeURIComponent(name);
  return openLink(
    Platform.OS === 'ios'
      ? `https://maps.apple.com/?ll=${latitude},${longitude}&q=${label}`
      : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
  );
};
