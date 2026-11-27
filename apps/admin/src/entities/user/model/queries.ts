import { useQuery } from '@tanstack/react-query';
import { useBackend } from '@admin/shared/api';

export const userKeys = { all: ['users'] as const };

export function useUsers() {
  const backend = useBackend();
  return useQuery({ queryKey: userKeys.all, queryFn: () => backend.listUsers() });
}
