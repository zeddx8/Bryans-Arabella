import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productService } from '../../services/productService';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { selectCount, useCartStore } from '../../store/cartStore';
import { useUiStore } from '../../store/uiStore';
import { useInboxStore } from '../../store/inboxStore';
import { useClickOutside } from '../../hooks/useClickOutside';
import { ghs } from '../../utils/format';
import type { ProductCard } from '../../types/product';
import { BagIcon, MoonIcon, SearchIcon, SunIcon, UserIcon } from '../common/Icons';

const menuLink = 'block px-5 py-2.5 text-sm text-ink hover:bg-tone';

export default function Navbar() {
  const nav = useNavigate();
  const count = useCartStore(selectCount);
  const { user, logout } = useAuthStore();
  const { theme, toggle } = useUiStore();
  const unread = useInboxStore((s) => s.unread);
  const [term, setTerm] = useState('');
  const [hits, setHits] = useState<ProductCard[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(searchRef, () => setSearchOpen(false));
  useClickOutside(menuRef, () => setMenuOpen(false));

  // Live search: query the API as the shopper types
  useEffect(() => {
    const q = term.trim();
    if (q.length < 2) { setHits([]); return; }
    let off = false;
    const t = setTimeout(() => {
      productService.list({ q, limit: 5 }).then((d) => { if (!off) { setHits(d.data); setSearchOpen(true); } }).catch(() => undefined);
    }, 250);
    return () => { off = true; clearTimeout(t); };
  }, [term]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    nav(term.trim() ? `/?q=${encodeURIComponent(term.trim())}` : '/');
  };
  const signOut = async () => {
    setMenuOpen(false);
    await authService.logout();
    logout();
    nav('/');
  };

  return (
    <header className="sticky top-0 z-30 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 md:flex-nowrap md:px-8">
        <Link to="/" className="font-display text-lg uppercase tracking-[0.2em] md:text-xl">Bryans Arabella</Link>

        <div ref={searchRef} className="relative order-last w-full md:order-none md:mx-auto md:max-w-md md:flex-1">
          <form onSubmit={submit} role="search">
            <label htmlFor="site-search" className="sr-only">Search bags</label>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="site-search" value={term} onChange={(e) => setTerm(e.target.value)} onFocus={() => hits.length && setSearchOpen(true)}
              placeholder="Search by name, brand or description" autoComplete="off"
              className="w-full bg-tone py-2.5 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent"
            />
          </form>
          {searchOpen && term.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-full z-40 mt-1 bg-surface shadow-xl">
              {hits.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted">No bags match “{term.trim()}”.</p>
              ) : (
                <ul>
                  {hits.map((h) => (
                    <li key={h.id}>
                      <Link to={`/bags/${h.slug}`} onClick={() => { setSearchOpen(false); setTerm(''); }} className="flex items-center gap-4 px-4 py-3 hover:bg-tone">
                        <span className="h-14 w-11 shrink-0 overflow-hidden bg-tone">{h.image && <img src={h.image} alt="" className="h-full w-full object-cover" />}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-display text-base">{h.name}</span>
                          <span className="block text-xs text-muted">{h.brand}</span>
                        </span>
                        <span className="text-sm">{ghs(h.price)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <nav aria-label="Utility" className="ml-auto flex items-center gap-1 md:gap-2">
          <Link to="/help" className="hidden px-3 py-2 text-[11px] uppercase tracking-[0.18em] hover:text-accent sm:block">Help</Link>

          <div ref={menuRef} className="relative">
            <button type="button" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 p-2 hover:text-accent">
              <span className="relative"><UserIcon />{unread > 0 && <span aria-hidden className="absolute -right-0.5 -top-0.5 h-2 w-2 bg-accent" />}</span><span className="hidden text-[11px] uppercase tracking-[0.18em] md:inline">{user ? user.name.split(' ')[0] : 'Account'}</span>
            </button>
            {menuOpen && (
              <div role="menu" className="absolute right-0 top-full z-40 mt-1 w-52 bg-surface py-2 shadow-xl" onClick={() => setMenuOpen(false)}>
                {user ? (
                  <>
                    <Link role="menuitem" to="/account" className={menuLink}>My account</Link>
                    <Link role="menuitem" to="/account/orders" className={menuLink}>Orders</Link>
                    <Link role="menuitem" to="/account/inbox" className={menuLink}>Inbox{unread > 0 && <span className="ml-2 text-accent">({unread})</span>}</Link>
                    <Link role="menuitem" to="/account/wishlist" className={menuLink}>Wishlist</Link>
                    {user.role === 'admin' && <Link role="menuitem" to="/admin" className={menuLink}>Admin console</Link>}
                    <button role="menuitem" onClick={signOut} className={`${menuLink} w-full text-left text-muted`}>Log out</button>
                  </>
                ) : (
                  <>
                    <Link role="menuitem" to="/login" className={menuLink}>Sign in</Link>
                    <Link role="menuitem" to="/register" className={menuLink}>Create account</Link>
                  </>
                )}
              </div>
            )}
          </div>

          <button type="button" onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} className="p-2 hover:text-accent">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          <Link to="/cart" aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`} className="relative p-2 hover:text-accent">
            <BagIcon />
            {count > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center bg-accent px-1 text-[10px] font-medium text-accent-ink">{count}</span>}
          </Link>
        </nav>
      </div>
    </header>
  );
}
