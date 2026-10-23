import type { InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string };

export default function Input({ label, error, className = '', ...rest }: Props) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted">{label}</span>
      <input {...rest} className={`w-full bg-tone px-4 py-3 text-sm text-ink outline-none placeholder:text-muted/70 focus-visible:ring-2 focus-visible:ring-accent ${className}`} />
      {error && <span className="mt-1 block text-xs text-accent">{error}</span>}
    </label>
  );
}
