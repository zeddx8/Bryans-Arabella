import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { accountService, orderService } from '../../services/orderService';
import { errMsg } from '../../services/apiClient';
import { selectSubtotal, useCartStore, type CartLine } from '../../store/cartStore';
import { ghs } from '../../utils/format';
import type { Address } from '../../types/user';
import type { PaymentMethod, Provider } from '../../types/order';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Spinner from '../../components/common/Spinner';
import MobileMoneyPrompt from '../../components/customer/MobileMoneyPrompt';

const blank = { recipient_name: '', phone: '', street_address: '', city: '', region_or_state: '' };
interface Placed { lines: CartLine[]; subtotal: number; shipping: number; total: number }

export default function Checkout() {
  const nav = useNavigate();
  const { items, clear } = useCartStore();
  const cartSubtotal = useCartStore(selectSubtotal);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [shipping, setShipping] = useState(0);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [addressId, setAddressId] = useState<string>('new');
  const [addr, setAddr] = useState(blank);
  const [provider, setProvider] = useState<Provider | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [placed, setPlaced] = useState<Placed | null>(null);

  useEffect(() => {
    Promise.all([accountService.profile(), orderService.paymentMethods()])
      .then(([p, m]) => {
        setAddresses(p.addresses); setMethods(m.data); setShipping(m.shipping_fee);
        const def = p.addresses.find((a) => a.is_default) ?? p.addresses[0];
        setAddressId(def ? String(def.id) : 'new');
        setAddr((a) => ({ ...a, recipient_name: p.user.name, phone: p.user.phone_number ?? '' }));
      })
      .catch((e) => setLoadError(errMsg(e)))
      .finally(() => setReady(true));
  }, []);

  const lines = placed?.lines ?? items;
  const subtotal = placed?.subtotal ?? cartSubtotal;
  const ship = placed?.shipping ?? shipping;
  const total = placed?.total ?? Math.round((cartSubtotal + shipping) * 100) / 100;
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement>) => setAddr((a) => ({ ...a, [k]: e.target.value }));

  if (!ready) return <div className="flex justify-center py-40"><Spinner className="h-6 w-6" /></div>;
  if (loadError) return <div role="alert" className="mx-auto max-w-xl px-5 py-32 text-center"><p>{loadError}</p><Button className="mt-6" variant="line" onClick={() => location.reload()}>Try again</Button></div>;
  if (lines.length === 0)
    return <div className="mx-auto max-w-xl px-5 py-32 text-center"><h1 className="font-display text-4xl">Nothing to check out</h1><Link to="/" className="mt-8 inline-block text-xs uppercase tracking-[0.18em] underline underline-offset-4">Browse bags</Link></div>;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!orderId) {
      if (addressId === 'new' && Object.values(addr).some((v) => !v.trim())) return setError('Fill in every delivery detail.');
    }
    if (!provider) return setError('Choose how you paid.');
    if (!file) return setError('Upload your payment screenshot.');
    setBusy(true);
    try {
      let oid = orderId;
      if (!oid) {
        const aid = addressId === 'new' ? (await accountService.saveAddress({ ...addr, is_default: addresses.length === 0 })).id : Number(addressId);
        const res = await orderService.checkout(items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })), aid);
        oid = res.order.id;
        setOrderId(oid);
        setPlaced({ lines: [...items], subtotal: res.order.subtotal, shipping: res.order.shipping_fee, total: res.order.total_amount });
        clear();
      }
      await orderService.submitPayment(oid, { payment_method: provider, transaction_reference: reference.trim() || undefined, screenshot: file });
      nav(`/order/${oid}/placed`, { replace: true });
    } catch (err) {
      setError(orderId || (err && placed) ? `${errMsg(err)} Your order is saved, so just fix this and press the button again.` : errMsg(err));
    } finally { setBusy(false); }
  };

  const locked = orderId !== null;

  return (
    <form onSubmit={submit} className="mx-auto max-w-6xl px-5 pt-10 md:px-8" noValidate>
      <h1 className="font-display text-4xl md:text-5xl">Checkout</h1>
      <div className="mt-10 grid gap-14 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-14">
          <section aria-labelledby="addr-h">
            <h2 id="addr-h" className="font-display text-2xl">Delivery address</h2>
            {addresses.length > 0 && (
              <div className="mt-5 space-y-3">
                {addresses.map((a) => (
                  <label key={a.id} className={`flex cursor-pointer gap-4 px-5 py-4 text-sm ${addressId === String(a.id) ? 'bg-tone' : 'hover:bg-tone/50'} ${locked ? 'pointer-events-none opacity-60' : ''}`}>
                    <input type="radio" name="address" checked={addressId === String(a.id)} onChange={() => setAddressId(String(a.id))} className="mt-1 accent-[var(--accent)]" />
                    <span>{a.recipient_name}, {a.phone}<br /><span className="text-muted">{a.street_address}, {a.city}, {a.region_or_state}</span></span>
                  </label>
                ))}
                <label className={`flex cursor-pointer gap-4 px-5 py-4 text-sm ${addressId === 'new' ? 'bg-tone' : 'hover:bg-tone/50'} ${locked ? 'pointer-events-none opacity-60' : ''}`}>
                  <input type="radio" name="address" checked={addressId === 'new'} onChange={() => setAddressId('new')} className="accent-[var(--accent)]" />Use a new address
                </label>
              </div>
            )}
            {addressId === 'new' && (
              <div className={`mt-5 grid gap-4 sm:grid-cols-2 ${locked ? 'pointer-events-none opacity-60' : ''}`}>
                <Input label="Recipient name" value={addr.recipient_name} onChange={set('recipient_name')} autoComplete="name" />
                <Input label="Phone" value={addr.phone} onChange={set('phone')} autoComplete="tel" inputMode="tel" />
                <div className="sm:col-span-2"><Input label="Street address or landmark" value={addr.street_address} onChange={set('street_address')} autoComplete="street-address" /></div>
                <Input label="Town or city" value={addr.city} onChange={set('city')} autoComplete="address-level2" />
                <Input label="Region" value={addr.region_or_state} onChange={set('region_or_state')} autoComplete="address-level1" />
              </div>
            )}
          </section>

          <section aria-labelledby="pay-h">
            <h2 id="pay-h" className="font-display text-2xl">Payment</h2>
            <div className="mt-5">
              <MobileMoneyPrompt methods={methods} provider={provider} onProvider={setProvider} total={total} file={file} onFile={setFile} reference={reference} onReference={setReference} />
            </div>
          </section>
        </div>

        <aside aria-label="Order summary" className="h-fit bg-tone/60 p-7 lg:sticky lg:top-24">
          <h2 className="font-display text-2xl">Your order</h2>
          <ul className="mt-6 space-y-4">
            {lines.map((i) => (
              <li key={i.product_id} className="flex gap-4 text-sm">
                <span className="h-16 w-12 shrink-0 overflow-hidden bg-tone">{i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}</span>
                <span className="min-w-0 flex-1"><span className="block truncate font-display text-base">{i.name}</span><span className="text-muted">Qty {i.quantity}</span></span>
                <span>{ghs(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{ghs(subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Delivery</dt><dd>{ghs(ship)}</dd></div>
            <div className="flex justify-between pt-2 font-display text-xl"><dt>Total</dt><dd>{ghs(total)}</dd></div>
          </dl>
          {error && <p role="alert" className="mt-6 text-sm text-accent">{error}</p>}
          <Button type="submit" full busy={busy} className="mt-6">I have paid</Button>
          <p className="mt-4 text-xs leading-relaxed text-muted">We check your screenshot against our mobile money records before your order ships.</p>
        </aside>
      </div>
    </form>
  );
}
