import { fireEvent, render, screen } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '~/tamagui.config';
import type { LocalPhoto } from '@/shared/api';
import { PhotoPicker } from './photo-picker';

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
}));

const pick = jest.mocked(ImagePicker.launchImageLibraryAsync);

const show = (added: LocalPhoto[], onChangeAdded: (next: LocalPhoto[]) => void) =>
  render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <PhotoPicker kept={[]} added={added} onChangeKept={jest.fn()} onChangeAdded={onChangeAdded} />
    </TamaguiProvider>,
  );

const asset = (uri: string, assetId: string | null) =>
  ({ uri, width: 10, height: 10, assetId }) as ImagePicker.ImagePickerAsset;

it('같은 사진을 다시 고르면 새 파일 주소로 와도 한 번만 붙입니다', async () => {
  const first = { uri: 'file:///cache/ImagePicker/1.heic', width: 10, height: 10, assetId: 'A' };
  pick.mockResolvedValue({
    canceled: false,
    assets: [
      asset('file:///cache/ImagePicker/2.heic', 'A'),
      asset('file:///cache/ImagePicker/3.jpeg', 'B'),
    ],
  });
  const onChangeAdded = jest.fn();
  await show([first], onChangeAdded);
  await fireEvent.press(screen.getByTestId('photo-add-library'));
  expect(onChangeAdded).toHaveBeenCalledWith([
    first,
    { uri: 'file:///cache/ImagePicker/3.jpeg', width: 10, height: 10, assetId: 'B' },
  ]);
});

it('보관함 ID가 없으면 파일 주소로 비교합니다', async () => {
  const first = { uri: 'file:///cache/ImagePicker/1.jpeg', width: 10, height: 10, assetId: null };
  pick.mockResolvedValue({
    canceled: false,
    assets: [
      asset('file:///cache/ImagePicker/1.jpeg', null),
      asset('file:///cache/ImagePicker/2.jpeg', null),
    ],
  });
  const onChangeAdded = jest.fn();
  await show([first], onChangeAdded);
  await fireEvent.press(screen.getByTestId('photo-add-library'));
  expect(onChangeAdded).toHaveBeenCalledWith([
    first,
    { uri: 'file:///cache/ImagePicker/2.jpeg', width: 10, height: 10, assetId: null },
  ]);
});
