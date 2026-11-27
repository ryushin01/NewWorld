import { useQuery } from '@tanstack/react-query';
import { useBackend } from '@admin/shared/api';

export const courseKeys = { all: ['courses'] as const };

export function useCourses() {
  const backend = useBackend();
  return useQuery({ queryKey: courseKeys.all, queryFn: () => backend.listCourses() });
}
