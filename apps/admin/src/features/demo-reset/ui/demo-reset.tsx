import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useBackend } from '@admin/shared/api';
import { sessionKey } from '@admin/entities/session';
import { Button, Dialog, useAnnounce } from '@admin/shared/ui';

/** 데모 데이터를 처음 상태로 되돌립니다(데모 모드에서만 보임). */
export function DemoReset() {
  const backend = useBackend();
  const client = useQueryClient();
  const announce = useAnnounce();
  const [open, setOpen] = useState(false);
  if (!backend.resetDemo) return null;
  const reset = backend.resetDemo;
  return (
    <>
      <Button variant="line" onClick={() => setOpen(true)}>
        데모 데이터 초기화
      </Button>
      <Dialog open={open} title="데모 데이터 초기화" onClose={() => setOpen(false)}>
        <p className="dialog__text">
          이 브라우저에 저장된 데모 데이터(추가·수정한 여행지, 처리한 신고 등)를 지우고 처음 시드로
          되돌립니다.
        </p>
        <div className="form__actions">
          <Button variant="line" onClick={() => setOpen(false)}>
            그대로 두기
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              await reset();
              await client.invalidateQueries({
                predicate: (query) => query.queryKey[0] !== sessionKey[0],
              });
              announce('데모 데이터를 처음 상태로 되돌렸습니다.');
              setOpen(false);
            }}
          >
            초기화
          </Button>
        </div>
      </Dialog>
    </>
  );
}
