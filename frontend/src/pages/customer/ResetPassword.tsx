import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import { errMsg } from '../../services/apiClient';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function ResetPassword() {
  const token = useSearchParams()[0].get('token') ?? '';
  const logout = useAuthStore((s) => s.logout);
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError('Use a password of at least 8 characters.');
    if (password !== again) return setError('The two passwords do not match.');
    setBusy(true); setError('');
    try { await authService.resetPassword(token, password); logout(); setDone(true); } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  if (!token) return <div className="mx-auto max-w-md px-5 pt-16 md:pt-24"><h1 className="font-display text-4xl">This link is not complete</h1><p className="mt-4 text-muted">Open the link from your email again, or <Link to="/forgot-password" className="underline underline-offset-4 hover:text-accent">ask for a new one</Link>.</p></div>;

  return (
    <div className="mx-auto max-w-md px-5 pt-16 md:pt-24">
      <h1 className="font-display text-4xl">{done ? 'Password changed' : 'Choose a new password'}</h1>
      {done ? (
        <div className="mt-10"><p className="leading-relaxed text-muted">You have been signed out everywhere for safety. Sign in with your new password.</p><Link to="/login" className="mt-8 inline-block bg-ink px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-paper hover:bg-accent hover:text-accent-ink">Sign in</Link></div>
      ) : (
        <form onSubmit={submit} className="mt-10 space-y-5">
          <Input label="New password (8 or more characters)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
          <Input label="Type it again" type="password" value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" required />
          {error && <p role="alert" className="text-sm text-accent">{error} {error.includes('expired') && <Link to="/forgot-password" className="underline underline-offset-4">Ask for a new link.</Link>}</p>}
          <Button type="submit" full busy={busy}>Save new password</Button>
        </form>
      )}
    </div>
  );
}
