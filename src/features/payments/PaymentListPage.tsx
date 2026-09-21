import React, { useState, useEffect, useCallback } from 'react';
import { Search, Download, Loader2, AlertCircle, ChevronLeft, ChevronRight, CreditCard, CheckCircle2, Clock, XCircle, RotateCcw, TrendingUp } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { money, formatDateTime } from '../../lib/utils';
import { paymentApi, Payment, PaymentStats } from './api';

const GATEWAYS = ['all','razorpay','paytm','phonepe','upi','wallet','cod'];
const STATUSES = [
  { v:'all',      l:'All' },
  { v:'paid',     l:'Paid' },
  { v:'pending',  l:'Pending' },
  { v:'failed',   l:'Failed' },
  { v:'refunded', l:'Refunded' },
];
const GATEWAY_COLORS: Record<string, string> = {
  razorpay:'bg-blue-50 text-blue-700', paytm:'bg-sky-50 text-sky-700',
  phonepe:'bg-purple-50 text-purple-700', upi:'bg-green-50 text-green-700',
  wallet:'bg-teal-50 text-[#0F766E]', cod:'bg-amber-50 text-amber-700',
};

export function PaymentListPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats]       = useState<PaymentStats | null>(null);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('all');
  const [gateway, setGateway]   = useState('all');

  useEffect(() => { paymentApi.getStats().then(setStats).catch(() => {}); }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const d = await paymentApi.getAll({ status: status !== 'all' ? status : undefined, gateway: gateway !== 'all' ? gateway : undefined, search: search || undefined, page });
      setPayments(d.payments); setTotal(d.total); setPages(d.pages);
    } catch (e: any) { setError(e?.response?.data?.message ?? 'Failed to load'); }
    finally { setLoading(false); }
  }, [status, gateway, search, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [status, gateway, search]);

  return (
    <div>
      <PageHeader title="Payments" subtitle={loading ? 'Loading...' : `${total} transactions`}
        breadcrumbs={[{ label: 'Home' }, { label: 'Payments' }]}
        action={<Button variant="outline" size="sm"><Download size={14} /> Export</Button>} />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          <StatCard label="Total" value={stats.total} icon={CreditCard} color="#475569" />
          <StatCard label="Paid" value={stats.paid} icon={CheckCircle2} color="#16A34A" />
          <StatCard label="Pending" value={stats.pending} icon={Clock} color="#F59E0B" />
          <StatCard label="Failed" value={stats.failed} icon={XCircle} color="#DC2626" />
          <StatCard label="Refunded" value={stats.refunded} icon={RotateCcw} color="#8B5CF6" />
          <StatCard label="Revenue" value={money(stats.revenue)} icon={TrendingUp} color="#0F766E" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search txn, order ID or customer..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={gateway} onChange={e => setGateway(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 capitalize">
          {GATEWAYS.map(g => <option key={g} value={g}>{g === 'all' ? 'All Gateways' : g}</option>)}
        </select>
        <div className="flex gap-1.5">
          {STATUSES.map(s => (
            <button key={s.v} onClick={() => setStatus(s.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${status === s.v ? 'bg-[#EA580C] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-200'}`}>
              {s.l}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600"><AlertCircle size={14} />{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Txn ID</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Order</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Customer</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Gateway</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={7} className="py-20 text-center text-slate-400">
                <Loader2 size={22} className="animate-spin mx-auto mb-2" />Loading payments...
              </td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={7} className="py-20 text-center text-slate-400">
                <CreditCard size={36} className="mx-auto mb-3 text-slate-200" /><p className="font-medium">No transactions found</p>
              </td></tr>
            ) : payments.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{p.txnId || `PAY-${p.id}`}</td>
                <td className="px-5 py-3.5 font-semibold text-slate-800">#{p.orderId}</td>
                <td className="px-5 py-3.5 hidden md:table-cell text-sm text-slate-600">{p.order?.customer?.name ?? '—'}</td>
                <td className="px-5 py-3.5 hidden md:table-cell">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${GATEWAY_COLORS[p.gateway] ?? 'bg-slate-100 text-slate-600'}`}>{p.gateway}</span>
                </td>
                <td className="px-5 py-3.5 font-semibold text-slate-800">{money(p.amount)}</td>
                <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
                <td className="px-5 py-3.5 hidden lg:table-cell text-xs text-slate-400">{formatDateTime(p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/30">
            <span className="text-xs text-slate-400">Page {page} of {pages}</span>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p-1)} disabled={page===1}><ChevronLeft size={14}/></Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p+1)} disabled={page===pages}><ChevronRight size={14}/></Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
