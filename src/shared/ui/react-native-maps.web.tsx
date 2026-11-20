import { forwardRef, useImperativeHandle, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'tamagui';
import { AppText } from './typography';

/**
 * react-native-maps는 웹을 지원하지 않아, 웹 번들에서만 metro.config.js가 이 파일로 바꿉니다.
 * 지도 자리에 안내를 보여 주고 마커·경로는 그리지 않습니다. 지도를 움직이는 명령은 아무 일도 하지 않습니다.
 */
type MapViewProps = { style?: StyleProp<ViewStyle>; children?: ReactNode; testID?: string };

const noop = () => {};

const MapView = forwardRef<unknown, MapViewProps>(function MapView({ style, testID }, ref) {
  useImperativeHandle(ref, () => ({
    animateToRegion: noop,
    animateCamera: noop,
    fitToCoordinates: noop,
    fitToElements: noop,
  }));
  return (
    <View
      style={style as never}
      backgroundColor="brandSoft"
      alignItems="center"
      justifyContent="center"
      // 지도 오른쪽에 뜨는 버튼(48px)에 글자가 가리지 않게 좌우를 넉넉히 비웁니다.
      paddingVertical={24}
      paddingHorizontal={72}
      testID={testID}
    >
      <AppText tone="muted" textAlign="center" wordBreak="keep-all" testID="map-unavailable">
        웹 데모에서는 지도를 표시하지 않습니다. 지도와 핀은 iOS·Android 앱에서 볼 수 있습니다.
      </AppText>
    </View>
  );
});

const Nothing = () => null;

export const Marker = Nothing;
export const Polyline = Nothing;
export const Polygon = Nothing;
export const Circle = Nothing;
export const Callout = Nothing;
export const PROVIDER_DEFAULT = undefined;
export const PROVIDER_GOOGLE = 'google';
export default MapView;
