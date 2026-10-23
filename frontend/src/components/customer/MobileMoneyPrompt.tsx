import { useEffect, useState } from 'react';
import { ghs } from '../../utils/format';
import type { PaymentMethod, Provider } from '../../types/order';

interface Props {
  methods: PaymentMethod[];
  provider: Provider | '';
  onProvider: (p: Provider) => void;
  total: number;
  file: File | null;
  onFile: (f: File | null) => void;
  reference: string;
  onReference: (s: string) => void;
}

export default function MobileMoneyPrompt({ methods, provider, onProvider, total, file, onFile, reference, onReference }: Props) {
  const chosen = methods.find((m) => m.id === provider);
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const copy = async () => {
    if (!chosen) return;
    try { await navigator.clipboard.writeText(chosen.number); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ }
  };

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="mb-3 text-[11px] uppercase tracking-[0.16em] text-muted">Pay with</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {methods.map((m) => (
            <label key={m.id} className={`cursor-pointer px-4 py-4 text-sm transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${provider === m.id ? 'bg-ink text-paper' : 'bg-tone hover:bg-tone/70'}`}>
              <input type="radio" name="provider" value={m.id} checked={provider === m.id} onChange={() => onProvider(m.id)} className="sr-only" />
              {m.label}
            </label>
          ))}
        </div>
      </fieldset>

      {chosen && (
        <div className="bg-tone px-6 py-6" aria-live="polite">
          <p className="text-sm leading-relaxed">Send <strong className="font-medium">{ghs(total)}</strong> by {chosen.label} to:</p>
          <p className="mt-3 font-display text-3xl tracking-wide">{chosen.number}</p>
          <p className="mt-1 text-sm text-muted">Account name: {chosen.account_name}</p>
          <button type="button" onClick={copy} className="mt-4 text-xs uppercase tracking-[0.16em] text-accent underline underline-offset-4">{copied ? 'Number copied' : 'Copy number'}</button>
          <p className="mt-5 text-sm text-muted">Then take a screenshot of the confirmation message and upload it below.</p>
        </div>
      )}

      {chosen && (
        <div className="space-y-5">
          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted">Transaction ID (optional)</span>
            <input value={reference} onChange={(e) => onReference(e.target.value)} maxLength={100} className="w-full bg-tone px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent" />
          </label>
          <div>
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted">Payment screenshot</span>
            <label className="flex cursor-pointer items-center gap-5 bg-tone px-4 py-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent">
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
              {preview ? <img src={preview} alt="Your payment screenshot" className="h-20 w-14 object-cover object-top" /> : <span className="flex h-20 w-14 items-center justify-center bg-line text-xs text-muted">None</span>}
              <span className="text-sm">{file ? file.name : 'Choose a JPG, PNG or WEBP image (up to 6 MB)'}</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
