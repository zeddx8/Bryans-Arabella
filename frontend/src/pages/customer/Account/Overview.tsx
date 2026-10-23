import { useEffect, useState } from 'react';
import { accountService } from '../../../services/orderService';
import { errMsg } from '../../../services/apiClient';
import type { Address, User } from '../../../types/user';
import Spinner from '../../../components/common/Spinner';

export default function Overview() {
  const [data, setData] = useState<{ user: User; addresses: Address[] } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { accountService.profile().then(setData).catch((e) => setError(errMsg(e))); }, []);

  if (error) return <p role="alert" className="text-accent">{error}</p>;
  if (!data) return <Spinner className="h-5 w-5" />;
  const def = data.addresses.find((a) => a.is_default) ?? data.addresses[0];

  return (
    <div className="space-y-12">
      <section aria-labelledby="det-h">
        <h2 id="det-h" className="font-display text-2xl">Your details</h2>
        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex gap-6"><dt className="w-20 text-muted">Name</dt><dd>{data.user.name}</dd></div>
          <div className="flex gap-6"><dt className="w-20 text-muted">Email</dt><dd>{data.user.email}</dd></div>
          <div className="flex gap-6"><dt className="w-20 text-muted">Phone</dt><dd>{data.user.phone_number ?? 'Not added'}</dd></div>
        </dl>
      </section>
      <section aria-labelledby="addr-h">
        <h2 id="addr-h" className="font-display text-2xl">Default delivery address</h2>
        {def ? (
          <address className="mt-5 bg-tone/60 px-6 py-5 text-sm not-italic leading-relaxed">{def.recipient_name}, {def.phone}<br />{def.street_address}<br />{def.city}, {def.region_or_state}</address>
        ) : <p className="mt-5 text-sm text-muted">No address yet. You can add one at checkout.</p>}
      </section>
    </div>
  );
}
