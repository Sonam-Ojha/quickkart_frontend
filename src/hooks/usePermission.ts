import { useAuthStore } from '../store/auth.store';
import { hasPermission, Role } from '../config/permissions';

export function usePermission() {
  const role = useAuthStore(s => s.user?.role);
  return {
    can: (permission: string) => role ? hasPermission(role as Role, permission) : false,
  };
}
