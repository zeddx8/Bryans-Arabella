import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import { errMsg } from '../../services/apiClient';
import { useAuthStore } from '../../store/authStore';
import Spinner from '../../components/common/Spinner';

export default function VerifyEmail() {
  const token = useSearchParams()[0].get('token') ?? '';
  const { token: session, setAuth } = useAuthStore();
  const [state, setState] = useState<{ ok: boolean; text: string } | null>(null);
  const ran = useRef(false); // a link works once, so never call it twice

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!token) { setState({ ok: false, text: 'This link is not complete. Open it again from your email.' }); return; }
    authService.verifyEmail(token)
      .then(async (r) => {
        setState({ ok: true, text: r.message });
        if (session) { try { setAuth(session, await authService.me()); } catch { /* ignore */ } }
      })
      .catch((e) => setState({ ok: false, text: errMsg(e) }));
  }, [token, session, setAuth]);

  return (
    <div className="mx-auto max-w-md px-5 py-24 text-center md:py-32">
      {!state ? <Spinner className="h-6 w-6" /> : (
        <div role="status">
          <h1 className="font-display text-4xl">{state.ok ? 'Email confirmed' : 'We could not confirm that'}</h1>
          <p className="mt-4 leading-relaxed text-muted">{state.text}</p>
          <Link to={state.ok ? '/' : '/login'} className="mt-8 inline-block bg-ink px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-paper hover:bg-accent hover:text-accent-ink">{state.ok ? 'Start shopping' : 'Sign in'}</Link>
        </div>
      )}
    </div>
  );
}
