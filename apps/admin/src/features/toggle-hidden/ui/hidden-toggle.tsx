import { Button, useAnnounce } from '@admin/shared/ui';
import { useToggleHidden, type HideableKind } from '../model/use-toggle-hidden';

/** 숨기기·다시 보이기 버튼. 이름을 함께 읽어 목록에서도 어떤 항목인지 알 수 있습니다. */
export function HiddenToggle({
  kind,
  id,
  name,
  hidden,
}: {
  kind: HideableKind;
  id: string;
  name: string;
  hidden: boolean;
}) {
  const toggle = useToggleHidden(kind);
  const announce = useAnnounce();
  return (
    <Button
      variant="line"
      className="row__action"
      aria-label={`${name} ${hidden ? '다시 보이기' : '숨기기'}`}
      disabled={toggle.isPending}
      onClick={() =>
        toggle.mutate(
          { id, hidden: !hidden },
          {
            onSuccess: () =>
              announce(`${name}을(를) ${hidden ? '다시 보이게 했습니다' : '숨겼습니다'}.`),
            onError: (error) => announce(error.message),
          },
        )
      }
    >
      {hidden ? '다시 보이기' : '숨기기'}
    </Button>
  );
}
