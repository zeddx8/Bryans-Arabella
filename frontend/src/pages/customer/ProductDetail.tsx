import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { productService } from '../../services/productService';
import { errMsg } from '../../services/apiClient';
import { useCartStore } from '../../store/cartStore';
import { ghs } from '../../utils/format';
import type { ProductDetail as Detail } from '../../types/product';
import Button from '../../components/common/Button';
import QtyStepper from '../../components/common/QtyStepper';
import Spinner from '../../components/common/Spinner';
import Stars from '../../components/common/Stars';
import ProductCard from '../../components/customer/ProductCard';
import ReviewSection from '../../components/customer/ReviewSection';
import WishlistButton from '../../components/customer/WishlistButton';

function Accordion({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group bg-tone/50 px-5">
      <summary className="flex cursor-pointer items-center justify-between py-4 text-[11px] font-medium uppercase tracking-[0.18em]">
        {title}<span aria-hidden className="text-lg font-light transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="pb-5 text-sm leading-relaxed">{children}</div>
    </details>
  );
}

export default function ProductDetail() {
  const { slug = '' } = useParams();
  const [p, setP] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const add = useCartStore((s) => s.add);
  const inCart = useCartStore((s) => s.items.find((i) => i.product_id === p?.id)?.quantity ?? 0);
  const rail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let off = false;
    setP(null); setError(''); setActive(0); setQty(1);
    productService.get(slug).then((d) => { if (!off) setP(d); }).catch((e) => { if (!off) setError(errMsg(e)); });
    return () => { off = true; };
  }, [slug]);

  if (error) return <div role="alert" className="mx-auto max-w-xl px-5 py-32 text-center"><p className="font-display text-3xl">We could not find that bag</p><p className="mt-3 text-muted">{error}</p><Link to="/" className="mt-8 inline-block text-xs uppercase tracking-[0.18em] underline underline-offset-4">Back to all bags</Link></div>;
  if (!p) return <div className="flex justify-center py-40"><Spinner className="h-6 w-6" /></div>;

  const room = Math.max(0, p.stock_quantity - inCart);
  const main = p.images[active];
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };
  const addToCart = () => {
    add({ product_id: p.id, slug: p.slug, name: p.name, brand: p.brand, price: p.price, image: p.images[0]?.url ?? null, max: p.stock_quantity }, qty);
    setAdded(true); setQty(1);
    setTimeout(() => setAdded(false), 1800);
  };
  const reload = () => productService.get(slug).then(setP).catch(() => undefined);

  return (
    <div className="mx-auto max-w-7xl px-5 pt-8 md:px-8">
      <nav aria-label="Breadcrumb" className="mb-8 text-xs text-muted">
        <Link to="/" className="hover:text-accent">All bags</Link>
        {p.category && <> <span aria-hidden>/</span> <Link to={`/?category=${p.category_slug}`} className="hover:text-accent">{p.category}</Link></>}
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
        <div className="flex flex-col-reverse gap-4 md:flex-row">
          {p.images.length > 1 && (
            <div ref={rail} className="no-scrollbar flex gap-3 overflow-x-auto md:max-h-[640px] md:flex-col md:overflow-y-auto">
              {p.images.map((im, i) => (
                <button key={im.id} type="button" onClick={() => setActive(i)} aria-label={`Show photo ${i + 1}`} aria-current={i === active} className={`h-24 w-[4.5rem] shrink-0 overflow-hidden bg-tone transition-opacity ${i === active ? 'opacity-100 outline outline-1 outline-ink' : 'opacity-60 hover:opacity-100'}`}>
                  <img src={im.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className="relative aspect-[4/5] flex-1 cursor-zoom-in overflow-hidden bg-tone" onMouseMove={onMove} onMouseLeave={() => setZoom(null)}>
            {main ? (
              <img src={main.url} alt={`${p.name}, photo ${active + 1}`} className="h-full w-full object-cover transition-transform duration-200 ease-out" style={zoom ? { transform: 'scale(2)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined} />
            ) : <span className="flex h-full items-center justify-center font-display text-6xl text-muted/40">{p.brand.charAt(0)}</span>}
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{p.brand}</p>
          <h1 className="mt-2 font-display text-4xl leading-tight md:text-5xl">{p.name}</h1>
          {p.review_count > 0 && <a href="#reviews" className="mt-3 flex items-center gap-3 text-sm"><Stars value={p.rating} /><span className="text-muted">{p.review_count} review{p.review_count === 1 ? '' : 's'}</span></a>}
          <p className="mt-6 text-2xl">{ghs(p.price)}</p>
          <p className="mt-2 text-sm text-muted">
            {p.in_stock ? (p.stock_quantity <= 3 ? `Only ${p.stock_quantity} left` : 'In stock') : 'Sold out'}{p.sku && <> · SKU {p.sku}</>}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {p.in_stock && room > 0 && <QtyStepper value={qty} max={room} onChange={setQty} />}
            <Button className="flex-1" disabled={!p.in_stock || room === 0} onClick={addToCart}>
              {!p.in_stock ? 'Sold out' : added ? 'Added to cart' : room === 0 ? 'All in your cart' : 'Add to cart'}
            </Button>
          </div>
          <div className="mt-4"><WishlistButton productId={p.id} name={p.name} variant="text" /></div>
          {inCart > 0 && <p className="mt-3 text-sm text-muted">{inCart} in your cart. <Link to="/cart" className="text-ink underline underline-offset-4 hover:text-accent">View cart</Link></p>}

          <div className="mt-10 space-y-2">
            <Accordion title="Details" open><div className="whitespace-pre-line">{p.description}</div></Accordion>
            <Accordion title="Delivery and payment">Pay with MTN, Telecel or AirtelTigo mobile money and upload your payment screenshot at checkout. We confirm your payment, then prepare your order. You will get a message in your inbox at each step.</Accordion>
            <Accordion title="Care">Store in the dust bag or a cool, dry place. Wipe clean with a soft, dry cloth and keep away from sharp objects and prolonged sunlight.</Accordion>
          </div>
        </div>
      </div>

      <div id="reviews" className="mt-24 scroll-mt-24"><ReviewSection productId={p.id} onChanged={reload} /></div>

      {p.suggested.length > 0 && (
        <section aria-labelledby="sug-h" className="mt-24">
          <div className="mb-8 flex items-end justify-between">
            <h2 id="sug-h" className="font-display text-3xl">You may also like</h2>
            <div className="hidden gap-2 sm:flex">
              <Button variant="ghost" aria-label="Scroll left" onClick={() => document.getElementById('sug-row')?.scrollBy({ left: -320, behavior: 'smooth' })}>Prev</Button>
              <Button variant="ghost" aria-label="Scroll right" onClick={() => document.getElementById('sug-row')?.scrollBy({ left: 320, behavior: 'smooth' })}>Next</Button>
            </div>
          </div>
          <div id="sug-row" className="no-scrollbar -mx-5 flex snap-x gap-5 overflow-x-auto px-5 md:mx-0 md:px-0">
            {p.suggested.map((s) => <div key={s.id} className="w-[62%] shrink-0 snap-start sm:w-[34%] lg:w-[23.5%]"><ProductCard p={s} /></div>)}
          </div>
        </section>
      )}
    </div>
  );
}
