import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../ui/Spinner';

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" label="Checking your session" />
        <p className="text-sm text-subtle">Loading BillNow…</p>
      </div>
    </div>
  );
}

/** Gate for authenticated areas; redirects to /login when signed out. */
export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return <Outlet />;
}

/** Redirects signed-in users away from public-only pages (login/register). */
export function PublicOnlyRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <FullPageLoader />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

export default ProtectedRoute;
