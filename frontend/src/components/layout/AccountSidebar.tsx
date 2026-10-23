import { NavLink, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { useInboxStore } from '../../store/inboxStore';

const link = ({ isActive }: { isActive: boolean }) =>
  `block py-2 text-sm transition-colors ${isActive ? 'text-accent' : 'text-ink hover:text-accent'}`;

export default function AccountSidebar() {
  const nav = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const unread = useInboxStore((s) => s.unread);
  return (
    <nav aria-label="Account" className="flex gap-6 overflow-x-auto md:block md:w-48 md:shrink-0 md:space-y-1">
      <NavLink to="/account" end className={link}>Overview</NavLink>
      <NavLink to="/account/orders" className={link}>Orders</NavLink>
      <NavLink to="/account/inbox" className={link}>Inbox{unread > 0 && <span className="ml-1.5 text-accent">({unread})</span>}</NavLink>
      <NavLink to="/account/wishlist" className={link}>Wishlist</NavLink>
      <button className="block py-2 text-sm text-muted hover:text-accent md:pt-6" onClick={async () => { await authService.logout(); logout(); nav('/'); }}>Log out</button>
    </nav>
  );
}
