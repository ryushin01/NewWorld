import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackend, type Stamp } from '@admin/shared/api';
import { stampKeys } from '@admin/entities/stamp';
import { Button, Dialog, ErrorState, useAnnounce } from '@admin/shared/ui';

/** 부정 인증으로 보이는 스탬프를 취소합니다. 되돌릴 수 없어 한 번 더 확인합니다. */
export function RevokeStampDialog({
  stamp,
  label,
  onClose,
}: {
  stamp: Stamp | null;
  label: string;
  onClose: () => void;
}) {
  const backend = useBackend();
  const client = useQueryClient();
  const announce = useAnnounce();
  const revoke = useMutation({
    mutationFn: (id: string) => backend.revokeStamp(id),
    onSuccess: () => client.invalidateQueries({ queryKey: stampKeys.all }),
  });
  return (
    <Dialog open={Boolean(stamp)} title="스탬프 취소" onClose={onClose}>
      <p className="dialog__text">
        {label} 스탬프를 취소할까요? 회원의 기념 뱃지 진행도에서도 빠지고 되돌릴 수 없습니다.
      </p>
      {revoke.error ? <ErrorState error={revoke.error} /> : null}
      <div className="form__actions">
        <Button variant="line" onClick={onClose}>
          그대로 두기
        </Button>
        <Button
          variant="danger"
          disabled={revoke.isPending}
          onClick={() =>
            stamp &&
            revoke.mutate(stamp.id, {
              onSuccess: () => {
                announce(`${label} 스탬프를 취소했습니다.`);
                onClose();
              },
            })
          }
        >
          스탬프 취소
        </Button>
      </div>
    </Dialog>
  );
}
