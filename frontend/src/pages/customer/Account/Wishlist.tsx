import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { accountService } from '../../../services/orderService';
import { errMsg } from '../../../services/apiClient';
import { useCartStore } from '../../../store/cartStore';
import { useWishlistStore } from '../../../store/wishlistStore';
import { ghs } from '../../../utils/format';
import type { WishItem } from '../../../types/account';
import Spinner from '../../../components/common/Spinner';

export default function Wishlist() {
  const [items, setItems] = useState<WishItem[] | null>(null);
  const [error, setError] = useState('');
  const [added, setAdded] = useState<number | null>(null);
  const add = useCartStore((s) => s.add);
  const toggle = useWishlistStore((s) => s.toggle);

  useEffect(() => { accountService.wishlist().then(setItems).catch((e) => setError(errMsg(e))); }, []);

  const remove = (id: number) => { setItems((x) => x?.filter((i) => i.id !== id) ?? null); void toggle(id); };
  const toCart = (w: WishItem) => {
    add({ product_id: w.id, slug: w.slug, name: w.name, brand: w.brand, price: w.price, image: w.image, max: w.stock_quantity });
    setAdded(w.id); setTimeout(() => setAdded(null), 1600);
  };

  if (error) return <p role="alert" className="text-accent">{error}</p>;
  if (!items) return <Spinner className="h-5 w-5" />;
  if (items.length === 0)
    return <div><h2 className="font-display text-2xl">Your wishlist is empty</h2><p className="mt-3 text-muted">Tap the heart on any bag to save it here.</p><Link to="/" className="mt-6 inline-block text-xs uppercase tracking-[0.18em] underline underline-offset-4">Browse bags</Link></div>;

  return (
    <div>
      <h2 className="font-display text-2xl">Wishlist</h2>
      <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3">
        {items.map((w) => (
          <li key={w.id}>
            <Link to={`/bags/${w.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-tone">
              {w.image ? <img src={w.image} alt={`${w.name} by ${w.brand}`} loading="lazy" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center font-display text-4xl text-muted/40">{w.brand.charAt(0)}</span>}
              {!w.in_stock && <span className="absolute left-3 top-3 bg-paper px-2.5 py-1 text-[10px] uppercase tracking-[0.16em]">Sold out</span>}
            </Link>
            <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-muted">{w.brand}</p>
            <h3 className="mt-1 font-display text-lg leading-snug"><Link to={`/bags/${w.slug}`} className="hover:text-accent">{w.name}</Link></h3>
            <p className="mt-1 text-sm">{ghs(w.price)}</p>
            <div className="mt-3 flex items-center gap-4">
              <button type="button" disabled={!w.in_stock} onClick={() => toCart(w)} className="flex-1 bg-tone py-3 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-tone disabled:hover:text-muted">
                {!w.in_stock ? 'Sold out' : added === w.id ? 'Added to cart' : 'Add to cart'}
              </button>
              <button type="button" onClick={() => remove(w.id)} aria-label={`Remove ${w.name} from wishlist`} className="text-xs uppercase tracking-[0.14em] text-muted underline underline-offset-4 hover:text-accent">Remove</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
