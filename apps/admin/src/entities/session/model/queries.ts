import { useQuery } from '@tanstack/react-query';
import { useBackend } from '@admin/shared/api';

export const sessionKey = ['session'] as const;

export function useSession() {
  const backend = useBackend();
  return useQuery({
    queryKey: sessionKey,
    queryFn: () => backend.getSession(),
    staleTime: Infinity,
  });
}
