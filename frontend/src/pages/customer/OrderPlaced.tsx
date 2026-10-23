import { Link, useParams } from 'react-router-dom';

export default function OrderPlaced() {
  const { id } = useParams();
  return (
    <div className="mx-auto max-w-xl px-5 py-28 text-center">
      <h1 className="font-display text-4xl md:text-5xl">Thank you. Order #{id} is in</h1>
      <p className="mt-5 leading-relaxed text-muted">We are checking your payment now. You will see the result in your inbox, and your order page shows each step until your bag is on its way.</p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link to="/account/orders" className="bg-ink px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-paper hover:bg-accent hover:text-accent-ink">Track my order</Link>
        <Link to="/" className="px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] hover:text-accent">Keep shopping</Link>
      </div>
    </div>
  );
}
