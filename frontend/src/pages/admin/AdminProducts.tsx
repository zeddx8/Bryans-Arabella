import { useCallback, useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { errMsg } from '../../services/apiClient';
import { ghs } from '../../utils/format';
import type { AdminProduct, Category } from '../../types/admin';
import type { Meta } from '../../types/product';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import ProductFormModal from '../../components/admin/ProductFormModal';

const field = 'bg-tone px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent';

function StockBadge({ n, active }: { n: number; active: boolean }) {
  if (!active) return <span className="text-xs text-muted">Hidden</span>;
  if (n === 0) return <span className="bg-tone px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-accent">Sold out</span>;
  if (n <= 3) return <span className="bg-tone px-2 py-1 text-[10px] uppercase tracking-[0.14em]">{n} left</span>;
  return <span className="text-xs text-muted">{n} in stock</span>;
}

export default function AdminProducts() {
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AdminProduct[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<number | null | undefined>(undefined); // undefined = closed, null = new

  const load = useCallback(() => {
    adminService.products({ q: term || undefined, category: category || undefined, page })
      .then((d) => { setRows(d.data); setMeta(d.meta); setError(''); }).catch((e) => setError(errMsg(e)));
  }, [term, category, page]);
  useEffect(load, [load]);
  useEffect(() => { adminService.categories().then(setCats).catch(() => undefined); }, [editing]);
  useEffect(() => { const t = setTimeout(() => { setTerm(q.trim()); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);

  const archive = async (p: AdminProduct) => {
    if (!window.confirm(`Archive “${p.name}”? It disappears from the shop, and past orders keep their record.`)) return;
    try { await adminService.archiveProduct(p.id); load(); } catch (e) { setError(errMsg(e)); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl">Products</h1>
        <Button onClick={() => setEditing(null)}>Add a bag</Button>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <label className="sr-only" htmlFor="p-q">Search products</label>
        <input id="p-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, brand or SKU" className={`${field} w-full sm:w-72`} />
        <label className="sr-only" htmlFor="p-cat">Category</label>
        <select id="p-cat" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className={field}>
          <option value="">All categories</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {error && <p role="alert" className="mt-6 text-sm text-accent">{error}</p>}
      {!rows ? <div className="py-16 text-center"><Spinner className="h-5 w-5" /></div> : rows.length === 0 ? (
        <p className="py-16 text-center text-muted">{term || category ? 'No bags match those filters.' : 'No bags yet. Add your first one.'}</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.14em] text-muted">
              <tr><th className="pb-3 font-normal">Bag</th><th className="pb-3 font-normal">Category</th><th className="pb-3 font-normal">Price</th><th className="pb-3 font-normal">Stock</th><th className="pb-3"><span className="sr-only">Actions</span></th></tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-line/60">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-4">
                      <span className="h-16 w-12 shrink-0 overflow-hidden bg-tone">{p.image && <img src={p.image} alt="" className="h-full w-full object-cover" />}</span>
                      <span><span className="block font-display text-base">{p.name}</span><span className="text-xs text-muted">{p.brand}{p.sku && ` · ${p.sku}`}</span></span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-muted">{p.category ?? 'None'}</td>
                  <td className="py-3 pr-4">{ghs(p.price)}</td>
                  <td className="py-3 pr-4"><StockBadge n={p.stock_quantity} active={Boolean(p.is_active)} /></td>
                  <td className="py-3 text-right whitespace-nowrap">
                    <button onClick={() => setEditing(p.id)} className="mr-4 text-xs uppercase tracking-[0.14em] hover:text-accent">Edit</button>
                    <button onClick={() => archive(p)} className="text-xs uppercase tracking-[0.14em] text-muted hover:text-accent">Archive</button>
                  </td>
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

      <ProductFormModal open={editing !== undefined} productId={editing ?? null} categories={cats} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); load(); }} />
    </div>
  );
}
