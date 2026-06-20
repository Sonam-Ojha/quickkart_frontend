import React, { useState, useEffect, useCallback } from 'react';
import { Users2, CheckCircle, XCircle, Clock, Wallet, Search, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { money, formatDate } from '../../lib/utils';
import { referralApi, Referral, ReferralStats } from './api';

// ── Status badge ───────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  approved: 'bg-green-50 text-green-700',
  pending:  'bg-amber-50 text-amber-700',
  rejected: 'bg-red-50 text-red-600',
};
const STATUS_ICON: Record<string, React.ReactNode> = {
  approved: <CheckCircle size={11} />,
  pending:  <Clock size={11} />,
  rejected: <XCircle size={11} />,
};

// ── Stat card ─────────────────────────────────────────────

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className={`rounded-2xl p-5 ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium opacity-70">{label}</span>
        <span className="opacity-60">{icon}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: 'all',      label: 'All' },
  { value: 'pending',  label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export function ReferralPage() {
  const [stats, setStats]       = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('all');
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    referralApi.getStats().then(setStats).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await referralApi.getAll({ status: status !== 'all' ? status : undefined, search: search || undefined, page, limit: 15 });
      setReferrals(data.referrals);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load referrals');
    } finally { setLoading(false); }
  }, [status, search, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [status, search]);

  const handleStatus = async (r: Referral, newStatus: 'approved' | 'rejected') => {
    setUpdating(r.id);
    try {
      const updated = await referralApi.updateStatus(r.id, newStatus, newStatus === 'approved' ? 5000 : 0);
      setReferrals(prev => prev.map(x => x.id === r.id ? { ...x, status: updated.status, rewardAmount: updated.rewardAmount } : x));
      referralApi.getStats().then(setStats).catch(() => {});
    } catch {}
    finally { setUpdating(null); }
  };

  return (
    <div>
      <PageHeader
        title="Referrals"
        subtitle={loading ? 'Loading...' : `${total} total referrals`}
        breadcrumbs={[{ label: 'Home' }, { label: 'Referrals' }]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total"       value={stats?.total ?? '—'}    icon={<Users2 size={16} />}       color="bg-slate-50 text-slate-700" />
        <StatCard label="Approved"    value={stats?.approved ?? '—'} icon={<CheckCircle size={16} />}  color="bg-green-50 text-green-800" />
        <StatCard label="Pending"     value={stats?.pending ?? '—'}  icon={<Clock size={16} />}         color="bg-amber-50 text-amber-800" />
        <StatCard label="Rejected"    value={stats?.rejected ?? '—'} icon={<XCircle size={16} />}      color="bg-red-50 text-red-700" />
        <StatCard label="Rewards Paid" value={stats ? money(stats.totalRewards) : '—'} icon={<Wallet size={16} />} color="bg-teal-50 text-[#0F766E] col-span-2 lg:col-span-1" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search by name, email or code..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map(f => (
            <button key={f.value} onClick={() => setStatus(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${status === f.value ? 'bg-[#EA580C] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-200'}`}>
              {f.label}
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
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Referrer</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Referee</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Code</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Reward</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Date</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={7} className="py-20 text-center text-slate-400">
                <Loader2 size={22} className="animate-spin mx-auto mb-2" />Loading referrals...
              </td></tr>
            ) : referrals.length === 0 ? (
              <tr><td colSpan={7} className="py-20 text-center text-slate-400">
                <Users2 size={36} className="mx-auto mb-3 text-slate-200" />
                <p className="font-medium">No referrals found</p>
              </td></tr>
            ) : referrals.map(r => (
              <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#EA580C] to-orange-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {r.referrer?.name?.[0] ?? '?'}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800 text-xs">{r.referrer?.name ?? '—'}</div>
                      <div className="text-[11px] text-slate-400">{r.referrer?.email ?? ''}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0F766E] to-teal-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {r.referee?.name?.[0] ?? '?'}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800 text-xs">{r.referee?.name ?? '—'}</div>
                      <div className="text-[11px] text-slate-400">{r.referee?.email ?? ''}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 hidden md:table-cell">
                  <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{r.referralCode}</span>
                </td>
                <td className="px-5 py-3.5 hidden lg:table-cell">
                  <span className="text-sm font-semibold text-[#0F766E]">{r.rewardAmount ? money(r.rewardAmount) : '—'}</span>
                </td>
                <td className="px-5 py-3.5 hidden lg:table-cell">
                  <span className="text-xs text-slate-400">{formatDate(r.created_at)}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[r.status]}`}>
                    {STATUS_ICON[r.status]}{r.status}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {r.status === 'pending' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleStatus(r, 'approved')}
                        disabled={updating === r.id}
                        className="p-1.5 rounded-lg hover:bg-green-50 text-slate-400 hover:text-green-600 transition-colors disabled:opacity-40"
                        title="Approve"
                      >
                        {updating === r.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                      </button>
                      <button
                        onClick={() => handleStatus(r, 'rejected')}
                        disabled={updating === r.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
                        title="Reject"
                      >
                        <XCircle size={13} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/30">
            <span className="text-xs text-slate-400">Page {page} of {pages}</span>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}><ChevronLeft size={14} /></Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === pages}><ChevronRight size={14} /></Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
