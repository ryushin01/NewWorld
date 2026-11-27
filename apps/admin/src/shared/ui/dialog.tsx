import { useEffect, useId, useRef, type ReactNode } from 'react';

const FOCUSABLE =
  'a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])';

/**
 * 네이티브 <dialog>를 모달로 엽니다. showModal()이 바깥을 비활성(inert)으로 만들어 초점을 가두고,
 * Escape로 닫히며, 닫히면 연 버튼(트리거)으로 초점을 돌려줍니다.
 */
export function Dialog({
  open,
  title,
  onClose,
  children,
  className,
  shouldRestoreFocus,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  /** 링크로 다른 화면에 갈 때처럼 초점을 돌려주지 않아야 하면 false를 돌려줍니다. */
  shouldRestoreFocus?: () => boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const trigger = useRef<Element | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      trigger.current = document.activeElement;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleClose = () => {
      onClose();
      const target = trigger.current;
      if (shouldRestoreFocus && !shouldRestoreFocus()) return;
      if (target instanceof HTMLElement && target.isConnected) target.focus();
    };
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose, shouldRestoreFocus]);

  // 네이티브 모달도 Tab이 주소창으로 빠져나갈 수 있어, 처음과 끝에서 안쪽으로 되돌립니다.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const items = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (item) => !item.hasAttribute('disabled') && item.getClientRects().length > 0,
      );
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener('keydown', handleKey);
    return () => dialog.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <dialog
      ref={ref}
      className={['dialog', className].filter(Boolean).join(' ')}
      aria-labelledby={titleId}
    >
      <div className="dialog__head">
        <h2 className="dialog__title" id={titleId}>
          {title}
        </h2>
        <button type="button" className="dialog__close" onClick={() => ref.current?.close()}>
          <span>CLOSE</span>
          <span className="visually-hidden">{title} 닫기</span>
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M2 2 L14 14 M14 2 L2 14" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>
      </div>
      {open ? children : null}
    </dialog>
  );
}
