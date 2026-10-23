import { useEffect, useState, type FormEvent } from 'react';
import { accountService } from '../../../services/orderService';
import { errMsg } from '../../../services/apiClient';
import { useInboxStore } from '../../../store/inboxStore';
import { shortDate } from '../../../utils/format';
import type { Message } from '../../../types/account';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Spinner from '../../../components/common/Spinner';

export default function Inbox() {
  const [msgs, setMsgs] = useState<Message[] | null>(null);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);
  const [composing, setComposing] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const { unread, setUnread } = useInboxStore();

  const load = () => accountService.inbox().then((d) => { setMsgs(d.data); setUnread(d.unread); }).catch((e) => setError(errMsg(e)));
  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const open = (m: Message) => {
    setOpenId(openId === m.id ? null : m.id);
    if (!m.is_read && m.sender !== 'customer') {
      setMsgs((x) => x?.map((i) => (i.id === m.id ? { ...i, is_read: 1 } : i)) ?? null);
      setUnread(unread - 1);
      accountService.markRead(m.id).catch(() => undefined);
    }
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return setError('Add a subject and a message.');
    setBusy(true); setError('');
    try {
      await accountService.sendMessage(subject.trim(), body.trim());
      setSubject(''); setBody(''); setComposing(false); setNote('Sent. We reply here in your inbox.');
      await load();
    } catch (err) { setError(errMsg(err)); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-2xl">Inbox</h2>
        {!composing && <Button variant="line" onClick={() => { setComposing(true); setNote(''); }}>Message us</Button>}
      </div>

      {composing && (
        <form onSubmit={send} className="mt-6 space-y-4 bg-tone/50 p-6" noValidate>
          <Input label="Subject" value={subject} maxLength={200} onChange={(e) => setSubject(e.target.value)} />
          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted">Message</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} className="w-full bg-tone px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent" />
          </label>
          <div className="flex gap-3"><Button type="submit" busy={busy}>Send message</Button><Button variant="ghost" onClick={() => setComposing(false)}>Cancel</Button></div>
        </form>
      )}
      {note && <p role="status" className="mt-6 text-sm">{note}</p>}
      {error && <p role="alert" className="mt-6 text-sm text-accent">{error}</p>}

      {!msgs ? <div className="mt-8"><Spinner className="h-5 w-5" /></div> : msgs.length === 0 ? (
        <p className="mt-8 text-muted">No messages yet. Updates on your payments and orders will appear here.</p>
      ) : (
        <ul className="mt-8 divide-y divide-line/60">
          {msgs.map((m) => {
            const fresh = !m.is_read && m.sender !== 'customer';
            const isOpen = openId === m.id;
            return (
              <li key={m.id}>
                <button type="button" onClick={() => open(m)} aria-expanded={isOpen} className="flex w-full items-start gap-4 py-5 text-left">
                  <span aria-hidden className={`mt-2 h-2 w-2 shrink-0 ${fresh ? 'bg-accent' : 'bg-transparent'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-4">
                      <span className={`font-display text-lg ${fresh ? '' : 'text-muted'}`}>{m.subject}{fresh && <span className="sr-only"> (unread)</span>}</span>
                      <time className="text-xs text-muted">{shortDate(m.created_at)}</time>
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">{m.sender === 'customer' ? 'You wrote' : 'Bryans Arabella'}</span>
                    {isOpen && <span className="mt-3 block max-w-prose whitespace-pre-line text-sm leading-relaxed text-ink">{m.body}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
