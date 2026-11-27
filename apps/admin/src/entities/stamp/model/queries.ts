import { useQuery } from '@tanstack/react-query';
import { useBackend } from '@admin/shared/api';

export const stampKeys = { all: ['stamps'] as const };

export function useStamps() {
  const backend = useBackend();
  return useQuery({ queryKey: stampKeys.all, queryFn: () => backend.listStamps() });
}
