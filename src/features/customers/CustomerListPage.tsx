import React, { useState, useEffect, useCallback } from 'react';
import { Search, Users, Eye, Ban, CheckCircle, Loader2, AlertCircle, Wallet, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { money, formatDate } from '../../lib/utils';
import { customerApi, Customer } from './api';

// ── Customer Detail Drawer ─────────────────────────────────

function CustomerDrawer({ customer, onClose, onToggleBlock }: { customer: Customer; onClose: () => void; onToggleBlock: (c: Customer) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white shadow-2xl flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-slate-800">Customer Detail</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar + name */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0F766E] to-[#EA580C] flex items-center justify-center text-white text-2xl font-bold mb-3">
              {customer.name[0]}
            </div>
            <h3 className="font-bold text-slate-800 text-lg">{customer.name}</h3>
            <span className={`mt-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${customer.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {customer.isActive ? 'Active' : 'Blocked'}
            </span>
          </div>

          {/* Info rows */}
          <div className="space-y-3">
            {[
              { label: 'Email',    value: customer.email },
              { label: 'Mobile',   value: customer.mobile ?? '—' },
              { label: 'Referral', value: customer.referralCode ?? '—' },
              { label: 'Joined',   value: formatDate(customer.created_at) },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-slate-400">{row.label}</span>
                <span className="font-medium text-slate-700 text-right max-w-[180px] truncate">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Wallet */}
          <div className="bg-gradient-to-r from-[#0F766E] to-teal-500 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-1 opacity-80 text-sm"><Wallet size={14} /> Wallet Balance</div>
            <div className="text-2xl font-bold">{money(customer.walletBalance)}</div>
          </div>

          {/* Action */}
          <Button
            variant={customer.isActive ? 'outline' : 'default'}
            className={`w-full ${customer.isActive ? 'text-red-500 border-red-200 hover:bg-red-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
            onClick={() => onToggleBlock(customer)}
          >
            {customer.isActive ? <><Ban size={14} /> Block Customer</> : <><CheckCircle size={14} /> Unblock Customer</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'all',     label: 'All' },
  { value: 'active',  label: 'Active' },
  { value: 'blocked', label: 'Blocked' },
];

export function CustomerListPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [status, setStatus]       = useState('all');
  const [selected, setSelected]   = useState<Customer | null>(null);
  const [toggling, setToggling]   = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await customerApi.getAll({
        search: search || undefined,
        status: status !== 'all' ? status : undefined,
        page,
        limit: 15,
      });
      setCustomers(data.customers);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => { load(); }, [load]);

  // reset to page 1 when filter changes
  useEffect(() => { setPage(1); }, [search, status]);

  const handleToggleBlock = async (customer: Customer) => {
    setToggling(customer.id);
    try {
      const res = await customerApi.toggleBlock(customer.id);
      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, isActive: res.isActive } : c));
      if (selected?.id === customer.id) setSelected(prev => prev ? { ...prev, isActive: res.isActive } : null);
    } catch {}
    finally { setToggling(null); }
  };

  const activeCount  = customers.filter(c => c.isActive).length;
  const blockedCount = customers.filter(c => !c.isActive).length;

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={loading ? 'Loading...' : `${total} registered customers`}
        breadcrumbs={[{ label: 'Home' }, { label: 'Customers' }]}
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <StatCard label="Total" value={loading ? '—' : total} icon={Users} color="#475569" />
        <StatCard label="Active" value={loading ? '—' : activeCount} icon={CheckCircle} color="#16A34A" />
        <StatCard label="Blocked" value={loading ? '—' : blockedCount} icon={Ban} color="#DC2626" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, email or mobile..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                status === opt.value
                  ? 'bg-[#EA580C] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          <AlertCircle size={14} />{error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Contact</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Wallet</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Joined</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-20 text-center text-slate-400">
                  <Loader2 size={22} className="animate-spin mx-auto mb-2" />
                  Loading customers...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center text-slate-400">
                  <Users size={36} className="mx-auto mb-3 text-slate-200" />
                  <p className="font-medium">No customers found</p>
                </td>
              </tr>
            ) : customers.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0F766E] to-[#EA580C] flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {c.name[0]}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">{c.name}</div>
                      <div className="text-xs text-slate-400">{c.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 hidden md:table-cell">
                  <span className="text-slate-500 text-xs font-mono">{c.mobile ?? '—'}</span>
                </td>
                <td className="px-5 py-3.5 hidden lg:table-cell">
                  <span className="font-semibold text-[#0F766E] text-xs">{money(c.walletBalance)}</span>
                </td>
                <td className="px-5 py-3.5 hidden lg:table-cell">
                  <span className="text-xs text-slate-400">{formatDate(c.created_at)}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {c.isActive ? 'Active' : 'Blocked'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex gap-1">
                    <button
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                      title="View detail"
                      onClick={() => setSelected(c)}
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                        c.isActive
                          ? 'hover:bg-red-50 text-slate-400 hover:text-red-500'
                          : 'hover:bg-green-50 text-slate-400 hover:text-green-600'
                      }`}
                      title={c.isActive ? 'Block' : 'Unblock'}
                      onClick={() => handleToggleBlock(c)}
                      disabled={toggling === c.id}
                    >
                      {toggling === c.id
                        ? <Loader2 size={14} className="animate-spin" />
                        : c.isActive ? <Ban size={14} /> : <CheckCircle size={14} />
                      }
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/30">
            <span className="text-xs text-slate-400">Page {page} of {pages}</span>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                <ChevronLeft size={14} />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === pages}>
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <CustomerDrawer
          customer={selected}
          onClose={() => setSelected(null)}
          onToggleBlock={handleToggleBlock}
        />
      )}
    </div>
  );
}
