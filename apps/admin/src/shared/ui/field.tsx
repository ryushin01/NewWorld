import { useId, type ReactElement, type ReactNode } from 'react';

type ControlProps = {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby'?: string;
};

/**
 * 레이블·도움말·오류를 입력칸에 잇습니다. 오류는 aria-invalid와 aria-describedby로 연결하고,
 * 초점 이동은 폼(React Hook Form의 shouldFocusError)이 맡습니다.
 */
export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: (props: ControlProps) => ReactElement;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label}
        {required ? (
          <>
            {' '}
            <span className="field__required">(필수)</span>
          </>
        ) : null}
      </label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {hint ? (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="field__error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
