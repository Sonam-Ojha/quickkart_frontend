import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { usePermission } from '../hooks/usePermission';

const VALID_ADMIN_ROLES = ['super_admin', 'ops_manager', 'catalog_mgr', 'marketing', 'support', 'finance'];

interface ProtectedRouteProps {
  permission?: string;
}

function isTokenExpiredOrInvalid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return !!(payload.exp && Date.now() / 1000 > payload.exp);
  } catch {
    return true;
  }
}

export function ProtectedRoute({ permission }: ProtectedRouteProps) {
  const hydrated = useAuthStore(s => s._hasHydrated);
  const token    = useAuthStore(s => s.token);
  const role     = useAuthStore(s => s.user?.role);
  const logout   = useAuthStore(s => s.logout);
  const { can } = usePermission();
  const [evicted, setEvicted] = useState(false);

  useEffect(() => {
    if (!token) return;
    const shouldEvict = isTokenExpiredOrInvalid(token) || (role != null && !VALID_ADMIN_ROLES.includes(role));
    if (shouldEvict) {
      logout();
      setEvicted(true);
    }
  }, [token, role, logout]);

  if (!hydrated) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-6 h-6 border-2 border-[#EA580C] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!token || evicted) return <Navigate to="/login" replace />;

  if (isTokenExpiredOrInvalid(token)) return <Navigate to="/login" replace />;

  // Stale token with non-admin role → force re-login
  if (role && !VALID_ADMIN_ROLES.includes(role)) {
    return <Navigate to="/login" replace />;
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
