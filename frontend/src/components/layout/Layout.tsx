import { useEffect } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useInboxStore } from '../../store/inboxStore';
import { authService } from '../../services/authService';
import Navbar from './Navbar';
import VerifyBanner from './VerifyBanner';
import Footer from './Footer';

export default function Layout() {
  const token = useAuthStore((s) => s.token);
  const { pathname } = useLocation();
  const loadWishes = useWishlistStore((s) => s.load);
  const resetWishes = useWishlistStore((s) => s.reset);
  const { refresh, setUnread } = useInboxStore();
  const setAuth = useAuthStore((s) => s.setAuth);

  // Load the shopper's saved bags once per sign-in, clear on sign-out
  useEffect(() => { if (token) void loadWishes(); else resetWishes(); }, [token, loadWishes, resetWishes]);
  // Refresh who they are on page load, so the verified status is never stale
  useEffect(() => { if (token) authService.me().then((u) => setAuth(token, u)).catch(() => undefined); }, [token, setAuth]);
  // Keep the unread count fresh as they move around the site
  useEffect(() => { if (token) void refresh(); else setUnread(0); }, [token, pathname, refresh, setUnread]);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">Skip to content</a>
      <VerifyBanner />
      <Navbar />
      <main id="main" className="flex-1"><Outlet /></main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}
