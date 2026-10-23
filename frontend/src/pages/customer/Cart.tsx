import { Link, useNavigate } from 'react-router-dom';
import { selectSubtotal, useCartStore } from '../../store/cartStore';
import { ghs } from '../../utils/format';
import Button from '../../components/common/Button';
import QtyStepper from '../../components/common/QtyStepper';

export default function Cart() {
  const { items, setQty, remove } = useCartStore();
  const subtotal = useCartStore(selectSubtotal);
  const nav = useNavigate();

  if (items.length === 0)
    return (
      <div className="mx-auto max-w-xl px-5 py-32 text-center">
        <h1 className="font-display text-4xl">Your cart is empty</h1>
        <p className="mt-3 text-muted">Find a bag you love and it will wait for you here.</p>
        <Link to="/" className="mt-8 inline-block bg-ink px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-paper hover:bg-accent hover:text-accent-ink">Browse bags</Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl px-5 pt-10 md:px-8">
      <h1 className="font-display text-4xl md:text-5xl">Your cart</h1>
      <div className="mt-10 grid gap-14 lg:grid-cols-[1.6fr_1fr]">
        <ul className="space-y-8">
          {items.map((i) => (
            <li key={i.product_id} className="flex gap-5">
              <Link to={`/bags/${i.slug}`} className="h-36 w-28 shrink-0 overflow-hidden bg-tone">{i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}</Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{i.brand}</p>
                <Link to={`/bags/${i.slug}`} className="font-display text-xl leading-snug hover:text-accent">{i.name}</Link>
                <p className="mt-1 text-sm">{ghs(i.price)}</p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                  <QtyStepper value={i.quantity} max={i.max} onChange={(n) => setQty(i.product_id, n)} />
                  <div className="flex items-center gap-5">
                    <span className="text-sm">{ghs(i.price * i.quantity)}</span>
                    <button type="button" onClick={() => remove(i.product_id)} className="text-xs uppercase tracking-[0.14em] text-muted underline underline-offset-4 hover:text-accent" aria-label={`Remove ${i.name}`}>Remove</button>
                  </div>
                </div>
                {i.quantity >= i.max && <p className="mt-2 text-xs text-muted">That is all we have in stock.</p>}
              </div>
            </li>
          ))}
        </ul>

        <aside aria-label="Order summary" className="h-fit bg-tone/60 p-7">
          <h2 className="font-display text-2xl">Summary</h2>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{ghs(subtotal)}</dd></div>
            <div className="flex justify-between text-muted"><dt>Delivery</dt><dd>Added at checkout</dd></div>
          </dl>
          <Button full className="mt-8" onClick={() => nav('/checkout')}>Go to checkout</Button>
          <p className="mt-4 text-xs leading-relaxed text-muted">You pay by mobile money and upload your payment screenshot on the next page.</p>
        </aside>
      </div>
    </div>
  );
}
