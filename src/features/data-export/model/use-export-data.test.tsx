import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { createQueryWrapper } from '@/shared/lib/query-test-utils';
import { useExportData } from './use-export-data';

const mockShare = jest.fn<Promise<void>, [string, { mimeType: string }]>();
const mockDownload = jest.fn<void, [Blob, string]>();
const mockHasSnapshot = jest.fn<boolean, [string[]]>();
const mockFiles: { name: string; content: string; deleted: boolean }[] = [];

jest.mock('expo-sharing', () => ({
  shareAsync: (uri: string, options: { mimeType: string }) => mockShare(uri, options),
}));
jest.mock('expo-file-system', () => ({
  Paths: { cache: 'cache' },
  File: class {
    entry: { name: string; content: string; deleted: boolean };
    constructor(_dir: string, name: string) {
      this.entry = { name, content: '', deleted: false };
      mockFiles.push(this.entry);
    }
    get uri() {
      return `file:///cache/${this.entry.name}`;
    }
    get exists() {
      return !this.entry.deleted;
    }
    create() {}
    write(content: string) {
      this.entry.content = content;
    }
    delete() {
      this.entry.deleted = true;
    }
  },
}));
jest.mock('@/shared/lib', () => ({
  downloadOnWeb: (blob: Blob, name: string) => mockDownload(blob, name),
}));
jest.mock('@/shared/api', () => {
  const { DEMO_PLACES, DEMO_RECORDS } = jest.requireActual('@/shared/api/demo-data');
  return {
    backend: {
      places: { list: async () => DEMO_PLACES },
      records: { list: async () => DEMO_RECORDS },
      checklist: { list: async () => [] },
      trips: { list: async () => [] },
      checkins: { list: async () => [] },
    },
    sync: { hasSnapshot: (keys: string[]) => mockHasSnapshot(keys) },
  };
});

const run = async (format: 'json' | 'csv') => {
  const { wrapper } = createQueryWrapper();
  const { result } = await renderHook(() => useExportData(), { wrapper });
  await act(async () => {
    result.current.mutate(format);
  });
  await waitFor(() => expect(result.current.isIdle).toBe(false));
  await waitFor(() => expect(result.current.isPending).toBe(false));
  return result;
};

beforeEach(() => {
  mockShare.mockReset().mockResolvedValue();
  mockDownload.mockReset();
  mockHasSnapshot.mockReset().mockReturnValue(true);
  mockFiles.length = 0;
  Platform.OS = 'ios';
});

it('JSON 백업을 공유 창으로 보내고, 끝나면 기기에 남긴 사본을 지웁니다', async () => {
  const result = await run('json');
  expect(result.current.isSuccess).toBe(true);
  expect(mockHasSnapshot).toHaveBeenCalledWith([
    'places',
    'records',
    'checklist',
    'trips',
    'checkins',
  ]);
  expect(mockShare).toHaveBeenCalledWith(
    expect.stringMatching(/newworld-\d{8}-\d{6}\.json$/),
    expect.objectContaining({ mimeType: 'application/json' }),
  );
  expect(mockFiles[0]?.content).toContain('구름이 걷히던 아침');
  expect(mockFiles[0]?.deleted).toBe(true);
});

it('공유가 실패해도 사본은 지웁니다', async () => {
  mockShare.mockRejectedValue(new Error('취소'));
  const result = await run('csv');
  expect(result.current.isError).toBe(true);
  expect(mockHasSnapshot).toHaveBeenCalledWith(['records']);
  expect(mockFiles[0]?.deleted).toBe(true);
});

it('한 번도 받지 못한 목록이 있으면 불완전한 파일을 만들지 않습니다', async () => {
  mockHasSnapshot.mockReturnValue(false);
  const result = await run('json');
  expect(result.current.error?.message).toBe('Incomplete export');
  expect(mockFiles).toHaveLength(0);
});

it('웹에서는 CSV를 바로 내려받습니다', async () => {
  Platform.OS = 'web';
  const result = await run('csv');
  expect(result.current.isSuccess).toBe(true);
  expect(mockDownload).toHaveBeenCalledWith(expect.any(Blob), expect.stringMatching(/\.csv$/));
  expect(mockShare).not.toHaveBeenCalled();
});
