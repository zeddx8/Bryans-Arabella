import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { ghs } from '../../utils/format';
import type { ProductCard as Card } from '../../types/product';
import Stars from '../common/Stars';
import WishlistButton from './WishlistButton';

export default function ProductCard({ p }: { p: Card }) {
  const add = useCartStore((s) => s.add);
  const inCart = useCartStore((s) => s.items.find((i) => i.product_id === p.id)?.quantity ?? 0);
  const [done, setDone] = useState(false);
  const atMax = inCart >= p.stock_quantity;

  const quickAdd = () => {
    add({ product_id: p.id, slug: p.slug, name: p.name, brand: p.brand, price: p.price, image: p.image, max: p.stock_quantity });
    setDone(true);
    setTimeout(() => setDone(false), 1600);
  };

  return (
    <article className="group relative">
      <Link to={`/bags/${p.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-tone">
        {p.image ? (
          <>
            <img src={p.image} alt={`${p.name} by ${p.brand}`} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            {p.image2 && <img src={p.image2} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />}
          </>
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-display text-4xl text-muted/40">{p.brand.charAt(0)}</span>
        )}
        {!p.in_stock && <span className="absolute left-3 top-3 bg-paper px-2.5 py-1 text-[10px] uppercase tracking-[0.16em]">Sold out</span>}
      </Link>
      <WishlistButton productId={p.id} name={p.name} variant="icon" />
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{p.brand}</p>
          <h3 className="mt-1 font-display text-lg leading-snug"><Link to={`/bags/${p.slug}`} className="hover:text-accent">{p.name}</Link></h3>
          {p.review_count > 0 && <div className="mt-1"><Stars value={p.rating} size="text-xs" /></div>}
        </div>
        <p className="shrink-0 text-sm">{ghs(p.price)}</p>
      </div>
      <button
        type="button" onClick={quickAdd} disabled={!p.in_stock || atMax}
        className="mt-3 w-full bg-tone py-3 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-tone disabled:hover:text-muted"
      >
        {!p.in_stock ? 'Sold out' : done ? 'Added to cart' : atMax ? 'All in your cart' : 'Add to cart'}
      </button>
    </article>
  );
}
