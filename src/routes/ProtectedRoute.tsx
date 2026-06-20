import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { usePermission } from '../hooks/usePermission';

const VALID_ADMIN_ROLES = ['super_admin', 'ops_manager', 'catalog_mgr', 'marketing', 'support', 'finance'];

interface ProtectedRouteProps {
  permission?: string;
}

export function ProtectedRoute({ permission }: ProtectedRouteProps) {
  const token    = useAuthStore(s => s.token);
  const role     = useAuthStore(s => s.user?.role);
  const logout   = useAuthStore(s => s.logout);
  const { can } = usePermission();

  if (!token) return <Navigate to="/login" replace />;

  // Stale token with non-admin role → force re-login
  if (role && !VALID_ADMIN_ROLES.includes(role)) {
    logout();
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
