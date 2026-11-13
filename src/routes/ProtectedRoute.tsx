import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { usePermission } from '../hooks/usePermission';

const VALID_ADMIN_ROLES = ['super_admin', 'ops_manager', 'catalog_mgr', 'marketing', 'support', 'finance'];

interface ProtectedRouteProps {
  permission?: string;
}

function isTokenExpiredOrInvalid(token: string): boolean {
  try {
    const raw    = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = raw + '=='.slice(0, (4 - raw.length % 4) % 4);
    const payload = JSON.parse(atob(padded));
    return !!(payload.exp && Date.now() / 1000 > payload.exp);
  } catch {
    return true;
  }
}

export function ProtectedRoute({ permission }: ProtectedRouteProps) {
  // Use Zustand v5 persist API — more reliable than custom _hasHydrated flag
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  const token  = useAuthStore(s => s.token);
  const role   = useAuthStore(s => s.user?.role);
  const logout = useAuthStore(s => s.logout);
  const { can } = usePermission();
  const location = useLocation();

  useEffect(() => {
    if (!token) return;
    const expired    = isTokenExpiredOrInvalid(token);
    const wrongRole  = role != null && !VALID_ADMIN_ROLES.includes(role);
    if (expired || wrongRole) logout();
  }, [token, role, logout]);

  if (!hydrated) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-6 h-6 border-2 border-[#EA580C] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!token) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  if (isTokenExpiredOrInvalid(token)) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  if (role && !VALID_ADMIN_ROLES.includes(role)) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (permission && !can(permission)) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <span className="text-3xl">🔒</span>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Access Denied</h2>
        <p className="text-slate-500 text-sm">You don't have permission to view this page.</p>
      </div>
    );
  }

  return <Outlet />;
}
