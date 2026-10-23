import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { errMsg } from '../../services/apiClient';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function Register() {
  const nav = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  const setAuth = useAuthStore((s) => s.setAuth);
  const [f, setF] = useState({ name: '', email: '', phone_number: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (f.password.length < 8) return setError('Use a password of at least 8 characters.');
    setBusy(true); setError('');
    try {
      const { token, user } = await authService.register({ ...f, email: f.email.trim(), name: f.name.trim() });
      setAuth(token, user);
      nav(from ?? '/', { replace: true });
    } catch (err) { setError(errMsg(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-md px-5 pt-16 md:pt-24">
      <h1 className="font-display text-4xl">Create your account</h1>
      <form onSubmit={submit} className="mt-10 space-y-5">
        <Input label="Full name" value={f.name} onChange={set('name')} autoComplete="name" required />
        <Input label="Email" type="email" value={f.email} onChange={set('email')} autoComplete="email" required />
        <Input label="Phone" type="tel" value={f.phone_number} onChange={set('phone_number')} autoComplete="tel" />
        <Input label="Password (8 or more characters)" type="password" value={f.password} onChange={set('password')} autoComplete="new-password" required />
        {error && <p role="alert" className="text-sm text-accent">{error}</p>}
        <Button type="submit" full busy={busy}>Create account</Button>
      </form>
      <p className="mt-8 text-sm text-muted">Already have an account? <Link to="/login" state={{ from }} className="text-ink underline underline-offset-4 hover:text-accent">Sign in</Link></p>
    </div>
  );
}
