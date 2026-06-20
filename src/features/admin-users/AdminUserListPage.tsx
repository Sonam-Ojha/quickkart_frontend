import { useState, useMemo } from 'react';
import { Plus, Mail, Edit2, Search, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { StatusBadge } from '../../components/common/StatusBadge';
import { InviteAdminModal } from './InviteAdminModal';
import { EditAdminModal } from './EditAdminModal';
import { adminUsersApi, AdminUser } from './api';

const ROLES = ['super_admin', 'ops_manager', 'catalog_mgr', 'marketing', 'support', 'finance'];

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  ops_manager: 'Ops Manager',
  catalog_mgr: 'Catalog Mgr',
  marketing:   'Marketing',
  support:     'Support',
  finance:     'Finance',
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-red-50 text-red-700',
  ops_manager: 'bg-blue-50 text-blue-700',
  catalog_mgr: 'bg-purple-50 text-purple-700',
  marketing:   'bg-orange-50 text-[#EA580C]',
  support:     'bg-teal-50 text-[#0F766E]',
  finance:     'bg-green-50 text-green-700',
};

const AVATAR_COLORS = [
  'from-[#EA580C] to-[#C2410C]',
  'from-[#0F766E] to-[#0D6B64]',
  'from-purple-500 to-purple-700',
  'from-blue-500 to-blue-700',
  'from-green-500 to-green-700',
  'from-rose-500 to-rose-700',
];

export function AdminUserListPage() {
  const [inviteOpen, setInviteOpen]   = useState(false);
  const [editAdmin, setEditAdmin]     = useState<AdminUser | null>(null);
  const [search, setSearch]           = useState('');
  const [roleFilter, setRoleFilter]   = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: admins = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminUsersApi.list,
  });

  const filtered = useMemo(() => {
    return admins.filter(a => {
      const matchSearch = !search ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase());
      const matchRole   = roleFilter === 'all' || a.role === roleFilter;
      const matchStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && a.isActive) ||
        (statusFilter === 'inactive' && !a.isActive);
      return matchSearch && matchRole && matchStatus;
    });
  }, [admins, search, roleFilter, statusFilter]);

  return (
    <div>
      <PageHeader
        title="Admin Users"
        subtitle="Manage admin accounts and role permissions"
        breadcrumbs={[{ label: 'Home' }, { label: 'Admin Users' }]}
        action={
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <Plus size={14} /> Invite Admin
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name or email..."
            className="pl-8"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
        >
          <option value="all">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button
          onClick={() => refetch()}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
        >
          <RefreshCw size={14} />
        </button>

        <span className="text-xs text-slate-400 ml-auto">
          {filtered.length} of {admins.length} admins
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Admin</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Email</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Joined</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">
                  Loading admins...
                </td>
              </tr>
            )}

            {isError && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center">
                  <p className="text-sm text-red-500 mb-2">Failed to load admin users</p>
                  <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
                </td>
              </tr>
            )}

            {!isLoading && !isError && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">
                  {admins.length === 0 ? 'Koi admin user nahi mila' : 'No results for current filters'}
                </td>
              </tr>
            )}

            {filtered.map((admin, i) => (
              <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {admin.name[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-800">{admin.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 hidden md:table-cell">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                    <Mail size={12} />
                    {admin.email}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[admin.role] ?? 'bg-slate-100 text-slate-600'}`}>
                    {ROLE_LABELS[admin.role] ?? admin.role}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={admin.isActive ? 'active' : 'inactive'} />
                </td>
                <td className="px-5 py-3.5 hidden lg:table-cell">
                  <span className="text-xs text-slate-400">
                    {new Date(admin.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => setEditAdmin(admin)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Edit2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InviteAdminModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <EditAdminModal admin={editAdmin} onClose={() => setEditAdmin(null)} />
    </div>
  );
}
