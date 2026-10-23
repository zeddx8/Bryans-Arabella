import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { errMsg } from '../../services/apiClient';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { setDone((await authService.forgotPassword(email.trim())).message); } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-md px-5 pt-16 md:pt-24">
      <h1 className="font-display text-4xl">Forgot your password?</h1>
      {done ? (
        <div className="mt-10" role="status">
          <p className="leading-relaxed">{done}</p>
          <p className="mt-3 text-sm text-muted">The link works for one hour. Check your spam folder if it does not arrive.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-10 space-y-5">
          <p className="text-sm leading-relaxed text-muted">Enter your email and we will send you a link to choose a new password.</p>
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          {error && <p role="alert" className="text-sm text-accent">{error}</p>}
          <Button type="submit" full busy={busy}>Send reset link</Button>
        </form>
      )}
      <p className="mt-8 text-sm"><Link to="/login" className="text-muted underline underline-offset-4 hover:text-accent">Back to sign in</Link></p>
    </div>
  );
}
