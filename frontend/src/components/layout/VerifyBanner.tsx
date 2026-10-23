import { useState } from 'react';
import { authService } from '../../services/authService';
import { errMsg } from '../../services/apiClient';
import { useAuthStore } from '../../store/authStore';

export default function VerifyBanner() {
  const user = useAuthStore((s) => s.user);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  if (!user || user.role !== 'customer' || user.email_verified !== false) return null;

  const resend = async () => {
    setBusy(true);
    try { setNote((await authService.resendVerification()).message); } catch (e) { setNote(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div role="status" className="bg-tone px-5 py-2.5 text-center text-sm">
      Please confirm your email. We sent a link to <strong className="font-medium">{user.email}</strong>.{' '}
      {note ? <span className="text-muted">{note}</span> : (
        <button type="button" onClick={resend} disabled={busy} className="underline underline-offset-4 hover:text-accent disabled:opacity-50">Send it again</button>
      )}
    </div>
  );
}
