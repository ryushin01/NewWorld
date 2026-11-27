import { useQuery } from '@tanstack/react-query';
import { useBackend } from '@admin/shared/api';

export const badgeKeys = { all: ['badges'] as const };

export function useBadges() {
  const backend = useBackend();
  return useQuery({ queryKey: badgeKeys.all, queryFn: () => backend.listBadges() });
}
