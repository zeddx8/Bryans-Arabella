import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { errMsg } from '../../services/apiClient';
import { shortDate } from '../../utils/format';
import type { Inquiry } from '../../types/admin';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';

function Row({ m }: { m: Inquiry }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const send = async () => {
    setBusy(true); setError('');
    try { await adminService.reply(m.user_id, m.subject.startsWith('Re:') ? m.subject : `Re: ${m.subject}`, body.trim()); setSent(true); setOpen(false); }
    catch (e) { setError(errMsg(e)); }
    finally { setBusy(false); }
  };

  return (
    <li className="py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl">{m.subject}</h2>
        <time className="text-xs text-muted">{shortDate(m.created_at)}</time>
      </div>
      <p className="mt-1 text-xs text-muted">{m.customer_name} ({m.customer_email})</p>
      <p className="mt-3 max-w-prose whitespace-pre-line leading-relaxed">{m.body}</p>
      {sent ? <p className="mt-4 text-sm text-muted">Reply sent to their inbox.</p> : open ? (
        <div className="mt-4 max-w-prose space-y-3">
          <label className="sr-only" htmlFor={`r-${m.id}`}>Your reply</label>
          <textarea id={`r-${m.id}`} value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="w-full bg-tone px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent" />
          {error && <p role="alert" className="text-sm text-accent">{error}</p>}
          <div className="flex gap-3"><Button busy={busy} disabled={!body.trim()} onClick={send}>Send reply</Button><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></div>
        </div>
      ) : <button onClick={() => setOpen(true)} className="mt-4 text-xs uppercase tracking-[0.14em] underline underline-offset-4 hover:text-accent">Reply</button>}
    </li>
  );
}

export default function AdminInquiries() {
  const [rows, setRows] = useState<Inquiry[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { adminService.inquiries().then(setRows).catch((e) => setError(errMsg(e))); }, []);

  return (
    <div>
      <h1 className="font-display text-4xl">Inquiries</h1>
      {error && <p role="alert" className="mt-6 text-sm text-accent">{error}</p>}
      {!rows ? <div className="py-16 text-center"><Spinner className="h-5 w-5" /></div> : rows.length === 0 ? <p className="py-16 text-center text-muted">No messages from customers yet.</p> : <ul className="mt-6 divide-y divide-line/60">{rows.map((m) => <Row key={m.id} m={m} />)}</ul>}
    </div>
  );
}
