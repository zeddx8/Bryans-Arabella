export default function Stars({ value, size = 'text-sm' }: { value: number | null; size?: string }) {
  const v = Math.round(value ?? 0);
  return (
    <span className={`${size} tracking-[0.15em] text-accent`} role="img" aria-label={value ? `${value} out of 5 stars` : 'No ratings yet'}>
      {'★'.repeat(v)}<span className="text-line">{'★'.repeat(5 - v)}</span>
    </span>
  );
}
