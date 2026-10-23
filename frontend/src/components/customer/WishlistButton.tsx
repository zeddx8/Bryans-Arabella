import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { HeartIcon } from '../common/Icons';

interface Props { productId: number; name: string; variant: 'icon' | 'text' }

export default function WishlistButton({ productId, name, variant }: Props) {
  const token = useAuthStore((s) => s.token);
  const saved = useWishlistStore((s) => s.ids.includes(productId));
  const toggle = useWishlistStore((s) => s.toggle);
  const nav = useNavigate();
  const loc = useLocation();

  const click = () => {
    if (!token) { nav('/login', { state: { from: loc.pathname + loc.search } }); return; }
    void toggle(productId);
  };
  const label = saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`;

  if (variant === 'icon')
    return (
      <button type="button" onClick={click} aria-pressed={saved} aria-label={label}
        className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center bg-paper/90 transition-colors hover:text-accent ${saved ? 'text-accent' : 'text-ink'}`}>
        <HeartIcon filled={saved} className="h-[18px] w-[18px]" />
      </button>
    );
  return (
    <button type="button" onClick={click} aria-pressed={saved} className={`inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] transition-colors hover:text-accent ${saved ? 'text-accent' : 'text-ink'}`}>
      <HeartIcon filled={saved} className="h-[18px] w-[18px]" />{saved ? 'Saved to wishlist' : 'Save to wishlist'}
    </button>
  );
}
