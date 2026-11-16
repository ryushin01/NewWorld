import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { backend, QUERY_ROOTS, type CheckIn } from '@/shared/api';

const checkinKeys = { all: [QUERY_ROOTS.checkins] as const };

export const useCheckins = () =>
  useQuery({ queryKey: checkinKeys.all, queryFn: () => backend.checkins.list() });

export const useCreateCheckin = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (checkIn: CheckIn) => backend.checkins.create(checkIn),
    onSuccess: () => client.invalidateQueries({ queryKey: checkinKeys.all }),
  });
};
