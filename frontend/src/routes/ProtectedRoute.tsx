import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute() {
  const token = useAuthStore((s) => s.token);
  const loc = useLocation();
  return token ? <Outlet /> : <Navigate to="/login" replace state={{ from: loc.pathname }} />;
}
