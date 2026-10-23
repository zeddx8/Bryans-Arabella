import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { errMsg } from '../../services/apiClient';
import { shortDate } from '../../utils/format';
import type { AdminCustomer } from '../../types/admin';
import type { Address } from '../../types/user';
import type { Meta } from '../../types/product';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';

export default function AdminCustomers() {
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AdminCustomer[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState('');
  const [sel, setSel] = useState<(AdminCustomer & { addresses: Address[] }) | null>(null);

  useEffect(() => { const t = setTimeout(() => { setTerm(q.trim()); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);
  useEffect(() => {
    adminService.customers({ q: term || undefined, page }).then((d) => { setRows(d.data); setMeta(d.meta); setError(''); }).catch((e) => setError(errMsg(e)));
  }, [term, page]);

  const view = (id: number) => adminService.customer(id).then(setSel).catch((e) => setError(errMsg(e)));

  return (
    <div>
      <h1 className="font-display text-4xl">Customers</h1>
      <label className="sr-only" htmlFor="c-q">Search customers</label>
      <input id="c-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" className="mt-8 w-full bg-tone px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent sm:w-72" />
      {error && <p role="alert" className="mt-6 text-sm text-accent">{error}</p>}
      {!rows ? <div className="py-16 text-center"><Spinner className="h-5 w-5" /></div> : rows.length === 0 ? <p className="py-16 text-center text-muted">No customers found.</p> : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.14em] text-muted"><tr><th className="pb-3 font-normal">Name</th><th className="pb-3 font-normal">Phone</th><th className="pb-3 font-normal">Orders</th><th className="pb-3 font-normal">Joined</th><th className="pb-3"><span className="sr-only">Open</span></th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-line/60">
                  <td className="py-3 pr-4">{c.name}<span className="block text-xs text-muted">{c.email}</span></td>
                  <td className="py-3 pr-4 text-muted">{c.phone_number ?? 'None'}</td>
                  <td className="py-3 pr-4">{c.order_count}</td>
                  <td className="py-3 pr-4 text-muted">{shortDate(c.created_at)}</td>
                  <td className="py-3 text-right"><button onClick={() => view(c.id)} className="text-xs uppercase tracking-[0.14em] hover:text-accent">Addresses</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {meta && meta.pages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-8">
          <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-muted">Page {meta.page} of {meta.pages}</span>
          <Button variant="ghost" disabled={page >= meta.pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.name ?? ''}>
        {sel && (
          <div className="text-sm">
            <p className="text-muted">{sel.email}{sel.phone_number && ` · ${sel.phone_number}`}</p>
            {sel.addresses.length === 0 ? <p className="mt-6 text-muted">No saved addresses.</p> : (
              <ul className="mt-6 space-y-4">{sel.addresses.map((a) => (
                <li key={a.id} className="bg-tone/60 px-5 py-4 leading-relaxed">{a.recipient_name}, {a.phone}<br />{a.street_address}, {a.city}, {a.region_or_state}{a.is_default ? <span className="mt-1 block text-xs text-muted">Default address</span> : null}</li>
              ))}</ul>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
