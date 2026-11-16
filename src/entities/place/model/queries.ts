import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { backend, QUERY_ROOTS, type PlaceInput } from '@/shared/api';

export const placeKeys = {
  all: [QUERY_ROOTS.places] as const,
  detail: (id: string) => [QUERY_ROOTS.places, id] as const,
};

/** 장소 이름·분류는 기록에도 들어가고, 장소를 지우면 기록도 지워지므로 두 목록을 함께 다시 받습니다. */
const invalidatePlacesAndRecords = (client: ReturnType<typeof useQueryClient>) =>
  Promise.all([
    client.invalidateQueries({ queryKey: placeKeys.all }),
    client.invalidateQueries({ queryKey: [QUERY_ROOTS.records] }),
  ]);

export const usePlaces = () =>
  useQuery({ queryKey: placeKeys.all, queryFn: () => backend.places.list() });

export const usePlace = (id: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: placeKeys.detail(id),
    queryFn: () => backend.places.get(id),
    enabled: options?.enabled,
  });

export const useSavePlace = (id?: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: PlaceInput) =>
      id ? backend.places.update(id, input) : backend.places.create(input),
    onSuccess: () => invalidatePlacesAndRecords(client),
  });
};

export const useDeletePlace = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => backend.places.remove(id),
    onSuccess: (_data, id) => {
      client.removeQueries({ queryKey: placeKeys.detail(id) });
      return invalidatePlacesAndRecords(client);
    },
  });
};
