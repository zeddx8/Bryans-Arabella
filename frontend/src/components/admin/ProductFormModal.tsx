import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { adminService } from '../../services/adminService';
import { errMsg } from '../../services/apiClient';
import type { Category } from '../../types/admin';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import Spinner from '../common/Spinner';

interface Props { open: boolean; productId: number | null; categories: Category[]; onClose: () => void; onSaved: () => void }
type Img = { id: number; url: string; is_primary: boolean };
const empty = { name: '', brand: '', category: '', newCategory: '', sku: '', cost: '', price: '', stock: '0', description: '', active: true };

export default function ProductFormModal({ open, productId, categories, onClose, onSaved }: Props) {
  const [f, setF] = useState(empty);
  const [images, setImages] = useState<Img[]>([]);
  const [removeIds, setRemoveIds] = useState<number[]>([]);
  const [primaryId, setPrimaryId] = useState<number | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const previews = useMemo(() => files.map((x) => URL.createObjectURL(x)), [files]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  useEffect(() => {
    if (!open) return;
    setError(''); setFiles([]); setRemoveIds([]); setImages([]); setPrimaryId(null); setF(empty);
    if (!productId) return;
    setLoading(true);
    adminService.product(productId).then((p) => {
      setF({ name: p.name, brand: p.brand, category: p.category_id ? String(p.category_id) : '', newCategory: '', sku: p.sku ?? '', cost: p.cost_price != null ? String(p.cost_price) : '', price: String(p.price), stock: String(p.stock_quantity), description: p.description, active: Boolean(p.is_active) });
      setImages(p.images); setPrimaryId(p.images.find((i) => i.is_primary)?.id ?? null);
    }).catch((e) => setError(errMsg(e))).finally(() => setLoading(false));
  }, [open, productId]);

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  const toggleRemove = (id: number) => setRemoveIds((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!f.name.trim() || !f.brand.trim() || !f.description.trim()) return setError('Name, brand and description are required.');
    if (!(Number(f.price) >= 0) || f.price === '') return setError('Enter a valid selling price.');
    if (f.category === 'new' && !f.newCategory.trim()) return setError('Type a name for the new category.');
    if (!productId && files.length === 0) return setError('Add at least one photo.');
    const fd = new FormData();
    fd.append('name', f.name.trim()); fd.append('brand', f.brand.trim()); fd.append('description', f.description.trim());
    fd.append('price', f.price); fd.append('stock_quantity', f.stock || '0'); fd.append('sku', f.sku.trim());
    if (f.cost) fd.append('cost_price', f.cost);
    if (f.category === 'new') fd.append('category_name', f.newCategory.trim());
    else if (f.category) fd.append('category_id', f.category);
    if (productId) {
      fd.append('is_active', f.active ? 'true' : 'false');
      fd.append('delete_image_ids', JSON.stringify(removeIds));
      if (primaryId && !removeIds.includes(primaryId)) fd.append('primary_image_id', String(primaryId));
    }
    files.forEach((x) => fd.append('images', x));
    setBusy(true);
    try { await adminService.saveProduct(productId, fd); onSaved(); }
    catch (err) { setError(errMsg(err)); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={productId ? 'Edit bag' : 'Add a bag'} wide>
      {loading ? <div className="py-16 text-center"><Spinner className="h-5 w-5" /></div> : (
        <form onSubmit={submit} className="space-y-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Name" value={f.name} onChange={set('name')} />
            <Input label="Brand" value={f.brand} onChange={set('brand')} />
            <label className="block">
              <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted">Category</span>
              <select value={f.category} onChange={set('category')} className="w-full bg-tone px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent">
                <option value="">No category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                <option value="new">Add a new category…</option>
              </select>
            </label>
            {f.category === 'new' ? <Input label="New category name" value={f.newCategory} onChange={set('newCategory')} /> : <Input label="SKU" value={f.sku} onChange={set('sku')} />}
            <Input label="Cost price (GH₵)" type="number" min="0" step="0.01" value={f.cost} onChange={set('cost')} />
            <Input label="Selling price (GH₵)" type="number" min="0" step="0.01" value={f.price} onChange={set('price')} />
            <Input label="Stock count" type="number" min="0" step="1" value={f.stock} onChange={set('stock')} />
            {f.category === 'new' && <Input label="SKU" value={f.sku} onChange={set('sku')} />}
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted">Description</span>
            <textarea value={f.description} onChange={set('description')} rows={6} className="w-full bg-tone px-4 py-3 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-accent" />
            <span className="mt-1 block text-xs text-muted">Line breaks are kept on the product page.</span>
          </label>

          <fieldset>
            <legend className="mb-2 text-[11px] uppercase tracking-[0.16em] text-muted">Photos</legend>
            <div className="flex flex-wrap gap-4">
              {images.map((im) => (
                <div key={im.id} className={`w-24 ${removeIds.includes(im.id) ? 'opacity-40' : ''}`}>
                  <img src={im.url} alt="" className="h-32 w-24 object-cover" />
                  <label className="mt-1.5 flex items-center gap-1.5 text-xs"><input type="radio" name="primary" checked={primaryId === im.id} disabled={removeIds.includes(im.id)} onChange={() => setPrimaryId(im.id)} className="accent-[var(--accent)]" />Main</label>
                  <button type="button" onClick={() => toggleRemove(im.id)} className="mt-1 text-xs text-muted underline underline-offset-4 hover:text-accent">{removeIds.includes(im.id) ? 'Keep' : 'Remove'}</button>
                </div>
              ))}
              {previews.map((u, i) => (
                <div key={u} className="w-24">
                  <img src={u} alt="" className="h-32 w-24 object-cover" />
                  <button type="button" onClick={() => setFiles((x) => x.filter((_, j) => j !== i))} className="mt-1.5 text-xs text-muted underline underline-offset-4 hover:text-accent">Remove</button>
                </div>
              ))}
              <label className="flex h-32 w-24 cursor-pointer items-center justify-center bg-tone px-2 text-center text-xs text-muted hover:bg-tone/70 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent">
                Add photos
                <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const picked = Array.from(e.target.files ?? []); setFiles((x) => [...x, ...picked].slice(0, 8)); e.target.value = ''; }} />
              </label>
            </div>
            {!productId && <p className="mt-2 text-xs text-muted">The first photo is the main one.</p>}
          </fieldset>

          {productId && <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => setF((s) => ({ ...s, active: e.target.checked }))} className="accent-[var(--accent)]" />Visible in the shop</label>}
          {error && <p role="alert" className="text-sm text-accent">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" busy={busy}>{productId ? 'Save changes' : 'Add bag'}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
