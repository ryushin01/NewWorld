import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackend } from '@admin/shared/api';
import { sessionKey } from '@admin/entities/session';

export function useSignIn() {
  const backend = useBackend();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (credentials?: { username: string; password: string }) =>
      backend.signIn(credentials),
    onSuccess: (session) => client.setQueryData(sessionKey, session),
  });
}

export function useSignOut() {
  const backend = useBackend();
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => backend.signOut(),
    onSuccess: () => {
      client.clear();
      client.setQueryData(sessionKey, null);
    },
  });
}
