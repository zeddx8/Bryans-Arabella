import type { ButtonHTMLAttributes } from 'react';
import Spinner from './Spinner';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'solid' | 'line' | 'ghost'; busy?: boolean; full?: boolean };

const base = 'inline-flex items-center justify-center gap-2 px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors disabled:cursor-not-allowed disabled:opacity-50';
const variants = {
  solid: 'bg-ink text-paper hover:bg-accent hover:text-accent-ink',
  line: 'border border-ink text-ink hover:bg-ink hover:text-paper',
  ghost: 'text-ink hover:text-accent',
};

export default function Button({ variant = 'solid', busy, full, className = '', children, disabled, ...rest }: Props) {
  return (
    <button type="button" {...rest} disabled={disabled || busy} className={`${base} ${variants[variant]} ${full ? 'w-full' : ''} ${className}`}>
      {busy && <Spinner />}
      {children}
    </button>
  );
}
