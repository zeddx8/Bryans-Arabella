import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// The API enforces admin access too; this guard only keeps customers out of the screens.
export default function AdminRoute() {
  const { token, user } = useAuthStore();
  const loc = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return user?.role === 'admin' ? <Outlet /> : <Navigate to="/" replace />;
}
