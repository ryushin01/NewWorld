import { useQuery } from '@tanstack/react-query';
import { useBackend } from '@admin/shared/api';

export const destinationKeys = { all: ['destinations'] as const };

export function useDestinations() {
  const backend = useBackend();
  return useQuery({ queryKey: destinationKeys.all, queryFn: () => backend.listDestinations() });
}
