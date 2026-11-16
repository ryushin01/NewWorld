import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, Modal, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'tamagui';
import type { Photo } from '@/shared/api';
import { AppText, Touchable, X } from '@/shared/ui';

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

/**
 * 크게 보기의 사진 한 장. 두 손가락으로 벌리거나 두 번 눌러 확대하고, 확대한 채로 끌어 다른 부분을 봅니다.
 * 확대하지 않았을 때는 끌기가 바로 물러나 옆 사진으로 넘기는 목록 스크롤이 그대로 동작합니다.
 * 확대한 동안에는 목록이 넘어가지 않으므로, 다른 사진으로 넘어갈 때는 늘 확대가 풀려 있습니다.
 */
const ZoomableImage = ({
  photo,
  width,
  height,
  label,
  onZoomChange,
}: {
  photo: Photo;
  width: number;
  height: number;
  label: string;
  onZoomChange: (zoomed: boolean) => void;
}) => {
  const scale = useSharedValue(1);
  const saved = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  /** 확대한 만큼만 끌 수 있게 해 사진 밖의 빈 곳이 보이지 않게 합니다. */
  const clamp = (value: number, size: number, zoom: number) => {
    'worklet';
    const limit = ((zoom - 1) * size) / 2;
    return Math.min(limit, Math.max(-limit, value));
  };
  const report = (zoom: number) => {
    'worklet';
    runOnJS(onZoomChange)(zoom > 1);
  };

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.max(1, Math.min(saved.value * event.scale, MAX_SCALE));
    })
    .onEnd(() => {
      saved.value = scale.value;
      x.value = withTiming(clamp(x.value, width, scale.value));
      y.value = withTiming(clamp(y.value, height, scale.value));
      report(scale.value);
    });
  const pan = Gesture.Pan()
    .manualActivation(true)
    .onTouchesMove((_event, state) => {
      if (saved.value > 1) state.activate();
      else state.fail();
    })
    .onStart(() => {
      startX.value = x.value;
      startY.value = y.value;
    })
    .onUpdate((event) => {
      x.value = clamp(startX.value + event.translationX, width, scale.value);
      y.value = clamp(startY.value + event.translationY, height, scale.value);
    });
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const next = saved.value > 1 ? 1 : DOUBLE_TAP_SCALE;
      scale.value = withTiming(next);
      saved.value = next;
      x.value = withTiming(0);
      y.value = withTiming(0);
      report(next);
    });
  const animated = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
  }));
  return (
    <GestureDetector gesture={Gesture.Simultaneous(pinch, pan, doubleTap)}>
      <Animated.View style={[{ width, height }, animated]}>
        <Image
          source={{ uri: photo.url, cacheKey: photo.path }}
          style={{ width, height }}
          contentFit="contain"
          accessibilityLabel={label}
        />
      </Animated.View>
    </GestureDetector>
  );
};

/** 오프라인에서 기기에 저장되지 않은 사진은 빈 칸 대신 안내를 보여 줍니다. */
const GalleryImage = ({
  photo,
  width,
  height,
}: {
  photo: Photo;
  width: number;
  height: number;
}) => {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <View
        testID="photo-unavailable"
        width={width}
        height={height}
        backgroundColor="surfaceMuted"
        alignItems="center"
        justifyContent="center"
        padding={24}
      >
        <AppText tone="muted" textAlign="center">
          사진을 불러오지 못했습니다. 연결되면 다시 표시됩니다.
        </AppText>
      </View>
    );
  }
  return (
    <Image
      source={{ uri: photo.url, cacheKey: photo.path }}
      style={{ width, height }}
      contentFit="cover"
      transition={150}
      onError={() => setFailed(true)}
    />
  );
};

/** 가로로 넘겨 보는 사진 목록과 확대 가능한 전체 화면 보기 */
export const PhotoGallery = ({ photos, label }: { photos: Photo[]; label: string }) => {
  const { width, height } = useWindowDimensions();
  const { top } = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [viewerPage, setViewerPage] = useState(0);
  // 확대한 동안에는 끌기가 사진을 옮기도록 옆으로 넘기기를 멈춥니다.
  const [zoomed, setZoomed] = useState(false);
  const pageHeight = Math.round(width * 0.72);
  const openViewer = (index: number) => {
    setViewerPage(index);
    setZoomed(false);
    setViewerIndex(index);
  };
  const closeViewer = () => {
    setViewerIndex(null);
    setZoomed(false);
  };

  return (
    <View>
      <FlatList
        data={photos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(photo) => photo.id}
        onMomentumScrollEnd={(event) =>
          setPage(Math.round(event.nativeEvent.contentOffset.x / width))
        }
        renderItem={({ item, index }) => (
          <Touchable
            testID={`photo-${index}`}
            onPress={() => openViewer(index)}
            accessibilityLabel={`${label} 사진 ${index + 1}, 크게 보기`}
            opacity="1 press:0.9"
          >
            <GalleryImage photo={item} width={width} height={pageHeight} />
          </Touchable>
        )}
      />
      <View
        position="absolute"
        right={12}
        bottom={12}
        backgroundColor="ink"
        paddingHorizontal={10}
        borderRadius={12}
      >
        <AppText tone="inverse" size="caption" accessibilityLiveRegion="polite">
          {page + 1} / {photos.length}
        </AppText>
      </View>
      <Modal
        visible={viewerIndex !== null}
        animationType="fade"
        onRequestClose={closeViewer}
        presentationStyle="fullScreen"
      >
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000000' }}>
          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            scrollEnabled={!zoomed}
            initialScrollIndex={viewerIndex ?? 0}
            getItemLayout={(_data, index) => ({ length: width, offset: width * index, index })}
            keyExtractor={(photo) => photo.id}
            onMomentumScrollEnd={(event) =>
              setViewerPage(Math.round(event.nativeEvent.contentOffset.x / width))
            }
            renderItem={({ item, index }) => (
              <ZoomableImage
                photo={item}
                width={width}
                height={height}
                label={`${label} 사진 ${index + 1}`}
                onZoomChange={setZoomed}
              />
            )}
          />
          {/* 화면 낭독기와 확대 중에도 몇 번째 사진인지 알 수 있도록 목록과 같은 쪽 번호를 둡니다. */}
          <View
            position="absolute"
            top={top + 18}
            left={16}
            backgroundColor="ink"
            paddingHorizontal={10}
            borderRadius={12}
          >
            <AppText
              testID="photo-viewer-page"
              tone="inverse"
              size="caption"
              accessibilityLiveRegion="polite"
            >
              {viewerPage + 1} / {photos.length}
            </AppText>
          </View>
          <Touchable
            testID="photo-viewer-close"
            position="absolute"
            top={top + 8}
            right={8}
            onPress={closeViewer}
            accessibilityLabel="사진 보기 닫기"
            alignItems="center"
            justifyContent="center"
          >
            <X color="#ffffff" size={26} />
          </Touchable>
        </GestureHandlerRootView>
      </Modal>
    </View>
  );
};
