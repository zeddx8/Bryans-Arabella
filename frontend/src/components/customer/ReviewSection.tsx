import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { productService } from '../../services/productService';
import { errMsg } from '../../services/apiClient';
import { useAuthStore } from '../../store/authStore';
import { shortDate } from '../../utils/format';
import type { Review } from '../../types/product';
import Button from '../common/Button';
import Input from '../common/Input';
import Stars from '../common/Stars';

export default function ReviewSection({ productId, onChanged }: { productId: number; onChanged?: () => void }) {
  const token = useAuthStore((s) => s.token);
  const loc = useLocation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState<number | null>(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(() => {
    productService.reviews(productId).then((d) => { setReviews(d.data); setAverage(d.meta.average); }).catch(() => undefined);
  }, [productId]);
  useEffect(load, [load]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!rating) { setMsg({ ok: false, text: 'Choose a star rating first.' }); return; }
    setBusy(true); setMsg(null);
    try {
      await productService.addReview(productId, { rating, title: title.trim() || undefined, comment: comment.trim() || undefined });
      setRating(0); setTitle(''); setComment('');
      setMsg({ ok: true, text: 'Thank you. Your review is live.' });
      load(); onChanged?.();
    } catch (err) { setMsg({ ok: false, text: errMsg(err) }); }
    finally { setBusy(false); }
  };

  return (
    <section aria-labelledby="reviews-h" className="grid gap-12 md:grid-cols-[1fr_1.4fr]">
      <div>
        <h2 id="reviews-h" className="font-display text-3xl">Reviews</h2>
        {reviews.length > 0 && <p className="mt-3 flex items-center gap-3 text-sm"><Stars value={average} /><span className="text-muted">{average} from {reviews.length} review{reviews.length === 1 ? '' : 's'}</span></p>}

        {token ? (
          <form onSubmit={submit} className="mt-8 space-y-5">
            <fieldset>
              <legend className="mb-1.5 text-[11px] uppercase tracking-[0.16em] text-muted">Your rating</legend>
              <div className="flex gap-1" role="radiogroup">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)} className={`text-3xl leading-none ${n <= rating ? 'text-accent' : 'text-line hover:text-accent/60'}`}>★</button>
                ))}
              </div>
            </fieldset>
            <Input label="Title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
            <label className="block">
              <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted">Your review</span>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} className="w-full bg-tone px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent" />
            </label>
            <Button type="submit" busy={busy}>Post review</Button>
            {msg && <p role="status" className={`text-sm ${msg.ok ? 'text-ink' : 'text-accent'}`}>{msg.text}</p>}
          </form>
        ) : (
          <p className="mt-8 text-sm text-muted"><Link to="/login" state={{ from: loc.pathname }} className="text-ink underline underline-offset-4 hover:text-accent">Sign in</Link> to review this bag.</p>
        )}
      </div>

      <div>
        {reviews.length === 0 ? (
          <p className="text-muted">No reviews yet. Be the first to share how it wears.</p>
        ) : (
          <ul className="space-y-8">
            {reviews.map((r) => (
              <li key={r.id}>
                <div className="flex items-center justify-between gap-4"><Stars value={r.rating} /><time className="text-xs text-muted">{shortDate(r.created_at)}</time></div>
                {r.title && <h3 className="mt-2 font-display text-lg">{r.title}</h3>}
                {r.comment && <p className="mt-1 max-w-prose leading-relaxed">{r.comment}</p>}
                <p className="mt-2 text-xs text-muted">{r.author}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
