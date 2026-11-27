import { useQuery } from '@tanstack/react-query';
import { useBackend } from '@admin/shared/api';

export const reportKeys = { all: ['reports'] as const };

export function useReports() {
  const backend = useBackend();
  return useQuery({ queryKey: reportKeys.all, queryFn: () => backend.listReports() });
}
