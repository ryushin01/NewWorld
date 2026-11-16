import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { backend, QUERY_ROOTS, type RecordSaveInput, type TripRecord } from '@/shared/api';

const recordKeys = {
  all: [QUERY_ROOTS.records] as const,
  list: [QUERY_ROOTS.records, 'list'] as const,
  detail: (id: string) => [QUERY_ROOTS.records, 'detail', id] as const,
};

/**
 * 기록 목록. 장소별 기록도 전체 목록 하나를 함께 쓰고 화면에서 거릅니다.
 * 오프라인 계층이 어차피 전체를 받아 거르므로, 장소마다 따로 받으면 같은 목록을 여러 번 내려받습니다.
 */
export const useRecords = (placeId?: string) => {
  const select = useCallback(
    (records: TripRecord[]) => records.filter((record) => record.placeId === placeId),
    [placeId],
  );
  return useQuery({
    queryKey: recordKeys.list,
    queryFn: () => backend.records.list(),
    select: placeId ? select : undefined,
  });
};

/** 기록 수와 최근 방문일이 장소 목록에도 들어가므로 두 목록을 함께 다시 받습니다. */
const invalidateRecordsAndPlaces = (client: ReturnType<typeof useQueryClient>) =>
  Promise.all([
    client.invalidateQueries({ queryKey: recordKeys.all }),
    client.invalidateQueries({ queryKey: [QUERY_ROOTS.places] }),
  ]);

export const useRecord = (id: string) =>
  useQuery({ queryKey: recordKeys.detail(id), queryFn: () => backend.records.get(id) });

export const useSaveRecord = (id?: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordSaveInput) =>
      id ? backend.records.update(id, input) : backend.records.create(input),
    onSuccess: () => invalidateRecordsAndPlaces(client),
  });
};

export const useDeleteRecord = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => backend.records.remove(id),
    onSuccess: (_data, id) => {
      client.removeQueries({ queryKey: recordKeys.detail(id) });
      return invalidateRecordsAndPlaces(client);
    },
  });
};
