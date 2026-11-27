import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackend, type DestinationInput } from '@admin/shared/api';
import { destinationKeys } from '@admin/entities/destination';

export function useSaveDestination(mode: 'create' | 'update') {
  const backend = useBackend();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: DestinationInput) => backend.saveDestination(input, mode),
    onSuccess: () => client.invalidateQueries({ queryKey: destinationKeys.all }),
  });
}
