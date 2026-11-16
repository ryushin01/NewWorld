import { MAX_PHOTOS_PER_RECORD } from '@/shared/config';
import { PhotoPicker } from './photo-picker';

export default { title: 'features/PhotoPicker', component: PhotoPicker };

const noop = () => undefined;

export const Empty = {
  args: { kept: [], added: [], onChangeKept: noop, onChangeAdded: noop },
};

/** 가득 차면 추가 칸을 숨깁니다. */
export const Full = {
  args: {
    kept: [],
    added: Array.from({ length: MAX_PHOTOS_PER_RECORD }, (_, index) => ({
      uri: `file:///photo-${index}.jpg`,
      width: 1,
      height: 1,
    })),
    onChangeKept: noop,
    onChangeAdded: noop,
  },
};
