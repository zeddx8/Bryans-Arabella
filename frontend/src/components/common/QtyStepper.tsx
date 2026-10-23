export default function QtyStepper({ value, max, onChange }: { value: number; max: number; onChange: (n: number) => void }) {
  const btn = 'flex h-10 w-10 items-center justify-center text-lg text-ink transition-colors hover:bg-tone disabled:text-muted disabled:hover:bg-transparent';
  return (
    <div className="inline-flex items-center bg-tone/60">
      <button type="button" aria-label="Decrease quantity" className={btn} disabled={value <= 1} onClick={() => onChange(value - 1)}>−</button>
      <span className="w-9 text-center text-sm tabular-nums" aria-live="polite">{value}</span>
      <button type="button" aria-label="Increase quantity" className={btn} disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}
