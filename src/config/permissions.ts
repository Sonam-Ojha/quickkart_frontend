export type Role = 'super_admin' | 'ops_manager' | 'catalog_mgr' | 'marketing' | 'support' | 'finance';

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  super_admin:  ['*'],
  ops_manager:  ['orders.*','tracking.view','dark_stores.*','riders.*','support.edit','customers.view','reports.view'],
  catalog_mgr:  ['catalog.*','banners.edit','coupons.edit','reports.view'],
  marketing:    ['banners.*','coupons.*','referrals.view','notifications.*','customers.view','reports.view'],
  support:      ['support.*','orders.view','customers.view'],
  finance:      ['payments.*','wallet.*','referrals.view','reports.view'],
};

export function hasPermission(role: Role, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role] ?? [];
  if (perms.includes('*')) return true;
  if (perms.includes(permission)) return true;
  const [module, action] = permission.split('.');
  if (perms.includes(`${module}.*`)) return true;
  return false;
}
