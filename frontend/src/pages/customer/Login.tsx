import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { errMsg } from '../../services/apiClient';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as { from?: string } | null)?.from;
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const { token, user } = await authService.login({ email: email.trim(), password });
      setAuth(token, user);
      nav(from ?? (user.role === 'admin' ? '/admin' : '/'), { replace: true });
    } catch (err) { setError(errMsg(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-md px-5 pt-16 md:pt-24">
      <h1 className="font-display text-4xl">Sign in</h1>
      <form onSubmit={submit} className="mt-10 space-y-5">
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        {error && <p role="alert" className="text-sm text-accent">{error}</p>}
        <Button type="submit" full busy={busy}>Sign in</Button>
        <p className="text-sm"><Link to="/forgot-password" className="text-muted underline underline-offset-4 hover:text-accent">Forgot your password?</Link></p>
      </form>
      <p className="mt-8 text-sm text-muted">New here? <Link to="/register" state={{ from }} className="text-ink underline underline-offset-4 hover:text-accent">Create an account</Link></p>
    </div>
  );
}
