import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from '../lib/router';
import { Arrow } from './arrow';

type Variant = 'bracket' | 'solid' | 'line' | 'danger';

const className = (variant: Variant, extra?: string) =>
  ['button', `button--${variant}`, extra].filter(Boolean).join(' ');

/** 레퍼런스의 '[ VIEW ALL NEWS → ]' 모양. 대괄호와 화살표는 장식입니다. */
function Inner({ variant, children }: { variant: Variant; children: ReactNode }) {
  if (variant !== 'bracket') return <span className="button__label">{children}</span>;
  return (
    <>
      <span className="button__bracket" aria-hidden="true">
        [
      </span>
      <span className="button__label">{children}</span>
      <Arrow />
      <span className="button__bracket" aria-hidden="true">
        ]
      </span>
    </>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

export function Button({ variant = 'bracket', className: extra, children, ...rest }: ButtonProps) {
  return (
    <button type="button" className={className(variant, extra)} {...rest}>
      <Inner variant={variant}>{children}</Inner>
    </button>
  );
}

export function ButtonLink({
  to,
  variant = 'bracket',
  children,
}: {
  to: string;
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <Link to={to} className={className(variant)}>
      <Inner variant={variant}>{children}</Inner>
    </Link>
  );
}
