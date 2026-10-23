export default function Spinner({ className = '' }: { className?: string }) {
  return <span role="status" aria-label="Loading" className={`inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} />;
}
