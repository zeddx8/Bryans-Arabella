import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-28 bg-tone">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[2fr_1fr_1fr] md:px-8">
        <div>
          <p className="font-display text-xl uppercase tracking-[0.2em]">Bryans Arabella</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">Quality ladies’ bags at fair prices. Pay with mobile money, we confirm every payment before your bag ships.</p>
        </div>
        <nav aria-label="Shop" className="flex flex-col gap-2 text-sm">
          <Link to="/" className="hover:text-accent">All bags</Link>
          <Link to="/cart" className="hover:text-accent">Cart</Link>
          <Link to="/help" className="hover:text-accent">Help and payment guide</Link>
        </nav>
        <nav aria-label="Account" className="flex flex-col gap-2 text-sm">
          <Link to="/account" className="hover:text-accent">My account</Link>
          <Link to="/account/orders" className="hover:text-accent">Track an order</Link>
        </nav>
      </div>
      <p className="px-5 pb-8 text-center text-xs text-muted">© {new Date().getFullYear()} Bryans Arabella Collection</p>
    </footer>
  );
}
