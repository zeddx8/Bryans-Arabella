import { useEffect, useState, type FormEvent } from 'react';
import { orderService } from '../../services/orderService';
import { errMsg } from '../../services/apiClient';
import { ghs } from '../../utils/format';
import type { Order, PaymentMethod, Provider } from '../../types/order';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Spinner from '../common/Spinner';
import MobileMoneyPrompt from './MobileMoneyPrompt';

interface Props { order: Order | null; onClose: () => void; onDone: () => void }

export default function PayAgainModal({ order, onClose, onDone }: Props) {
  const [methods, setMethods] = useState<PaymentMethod[] | null>(null);
  const [provider, setProvider] = useState<Provider | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!order) return;
    setProvider(order.payment_method ?? ''); setFile(null); setReference(''); setError('');
    if (!methods) orderService.paymentMethods().then((m) => setMethods(m.data)).catch((e) => setError(errMsg(e)));
  }, [order?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (!provider) return setError('Choose how you paid.');
    if (!file) return setError('Upload your payment screenshot.');
    setBusy(true); setError('');
    try {
      await orderService.submitPayment(order.id, { payment_method: provider, transaction_reference: reference.trim() || undefined, screenshot: file });
      onDone();
    } catch (err) { setError(errMsg(err)); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={!!order} onClose={onClose} title={order ? `Pay for order #${order.id}` : ''} wide>
      {order && (!methods ? (error ? <p role="alert" className="text-accent">{error}</p> : <div className="py-12 text-center"><Spinner className="h-5 w-5" /></div>) : (
        <form onSubmit={submit} className="space-y-8" noValidate>
          {order.payment_status === 'rejected' && order.rejection_reason && <p className="bg-tone/60 px-5 py-4 text-sm">Your last proof was not accepted: <strong className="font-medium">{order.rejection_reason}</strong>. Please send the exact total of {ghs(order.total_amount)} and a clear screenshot.</p>}
          <MobileMoneyPrompt methods={methods} provider={provider} onProvider={setProvider} total={order.total_amount} file={file} onFile={setFile} reference={reference} onReference={setReference} />
          {error && <p role="alert" className="text-sm text-accent">{error}</p>}
          <div className="flex justify-end gap-3"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" busy={busy}>I have paid</Button></div>
        </form>
      ))}
    </Modal>
  );
}
