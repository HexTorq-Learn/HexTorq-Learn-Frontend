import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { usePortalActivityTracking } from '../../hooks/usePortalActivityTracking.js';

export function ProtectedRoute() {
  const { auth } = useAuth();
  usePortalActivityTracking(auth);
  if (!auth) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function AdminRoute() {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (auth.user.role !== 'ADMIN') return <Navigate to="/learn" replace />;
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { auth } = useAuth();
  if (auth) return <Navigate to="/learn" replace />;
  return <Outlet />;
}
