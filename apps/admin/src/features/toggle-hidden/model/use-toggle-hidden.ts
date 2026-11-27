import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackend } from '@admin/shared/api';
import { badgeKeys } from '@admin/entities/badge';
import { courseKeys } from '@admin/entities/course';
import { destinationKeys } from '@admin/entities/destination';

export type HideableKind = 'destination' | 'course' | 'badge';

/** 숨기면 앱에서 보이지 않고 어드민에서만 보입니다. 지우지 않아 언제든 되돌립니다. */
export function useToggleHidden(kind: HideableKind) {
  const backend = useBackend();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hidden }: { id: string; hidden: boolean }) =>
      kind === 'destination'
        ? backend.setDestinationHidden(id, hidden)
        : kind === 'course'
          ? backend.setCourseHidden(id, hidden)
          : backend.setBadgeHidden(id, hidden),
    onSuccess: () =>
      client.invalidateQueries({
        queryKey:
          kind === 'destination'
            ? destinationKeys.all
            : kind === 'course'
              ? courseKeys.all
              : badgeKeys.all,
      }),
  });
}
