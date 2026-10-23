import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '../../services/productService';
import { errMsg } from '../../services/apiClient';
import type { CatalogResponse, ProductCard as Card } from '../../types/product';
import ProductCard from '../../components/customer/ProductCard';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';

const select = 'bg-tone px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent';

export default function Home() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const brand = params.get('brand') ?? '';
  const sort = params.get('sort') ?? 'newest';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const filtering = Boolean(q || category || brand);

  const [data, setData] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hero, setHero] = useState<Card | null>(null);

  useEffect(() => {
    productService.list({ limit: 6 }).then((d) => setHero(d.data.find((p) => p.image) ?? null)).catch(() => undefined);
  }, []);

  useEffect(() => {
    let off = false;
    setLoading(true); setError('');
    productService.list({ q, category, brand, sort, page, limit: 12 })
      .then((d) => { if (!off) setData(d); })
      .catch((e) => { if (!off) setError(errMsg(e)); })
      .finally(() => { if (!off) setLoading(false); });
    return () => { off = true; };
  }, [q, category, brand, sort, page]);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };
  const clear = () => setParams(new URLSearchParams());

  return (
    <>
      {!filtering && (
        <section aria-label="Welcome" className="relative isolate flex min-h-[70vh] items-end overflow-hidden bg-tone">
          {hero?.image && <img src={hero.image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />}
          {hero?.image && <div className="absolute inset-0 -z-10 bg-black/35" />}
          <div className={`mx-auto w-full max-w-7xl px-5 pb-14 md:px-8 md:pb-20 ${hero?.image ? 'text-white' : 'text-ink'}`}>
            <h1 className="max-w-2xl font-display text-5xl leading-[1.05] md:text-7xl">Carry something beautiful</h1>
            <p className="mt-5 max-w-md text-base leading-relaxed opacity-90">Quality ladies’ bags at fair prices. Pay with MTN, Telecel or AirtelTigo.</p>
            <a href="#catalog" className={`mt-8 inline-block px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors ${hero?.image ? 'bg-white text-black hover:bg-black hover:text-white' : 'bg-ink text-paper hover:bg-accent hover:text-accent-ink'}`}>Shop new arrivals</a>
          </div>
        </section>
      )}

      <section id="catalog" aria-labelledby="catalog-h" className="mx-auto max-w-7xl scroll-mt-20 px-5 pt-14 md:px-8 md:pt-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 id="catalog-h" className="font-display text-3xl md:text-4xl">{q ? `Results for “${q}”` : 'New arrivals'}</h2>
            {data && <p className="mt-2 text-sm text-muted">{data.meta.total} bag{data.meta.total === 1 ? '' : 's'}</p>}
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="sr-only" htmlFor="f-cat">Category</label>
            <select id="f-cat" className={select} value={category} onChange={(e) => update('category', e.target.value)}>
              <option value="">All categories</option>
              {data?.filters.categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
            <label className="sr-only" htmlFor="f-brand">Brand</label>
            <select id="f-brand" className={select} value={brand} onChange={(e) => update('brand', e.target.value)}>
              <option value="">All brands</option>
              {data?.filters.brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <label className="sr-only" htmlFor="f-sort">Sort by</label>
            <select id="f-sort" className={select} value={sort} onChange={(e) => update('sort', e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </div>
        </div>

        <div className="mt-10 min-h-[40vh]" aria-busy={loading}>
          {error ? (
            <div role="alert" className="py-16 text-center"><p>{error}</p><Button className="mt-6" variant="line" onClick={() => setParams(new URLSearchParams(params))}>Try again</Button></div>
          ) : loading && !data ? (
            <div className="flex justify-center py-24"><Spinner className="h-6 w-6" /></div>
          ) : data && data.data.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-display text-2xl">{filtering ? 'No bags match your search' : 'Our first bags arrive soon'}</p>
              {filtering && <Button className="mt-6" variant="line" onClick={clear}>Clear search and filters</Button>}
            </div>
          ) : (
            <div className={`grid grid-cols-2 gap-x-4 gap-y-10 transition-opacity md:grid-cols-3 md:gap-x-6 lg:grid-cols-4 ${loading ? 'opacity-50' : ''}`}>
              {data?.data.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </div>

        {data && data.meta.pages > 1 && (
          <nav aria-label="Pages" className="mt-14 flex items-center justify-center gap-8">
            <Button variant="ghost" disabled={page <= 1} onClick={() => update('page', String(page - 1))}>Previous</Button>
            <span className="text-sm text-muted">Page {data.meta.page} of {data.meta.pages}</span>
            <Button variant="ghost" disabled={page >= data.meta.pages} onClick={() => update('page', String(page + 1))}>Next</Button>
          </nav>
        )}
      </section>
    </>
  );
}
