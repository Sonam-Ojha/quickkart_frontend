import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Loader2, AlertCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { money, formatDateTime } from '../../lib/utils';
import { walletApi, WalletTransaction, WalletStats } from './api';

const SOURCES = ['all','refund','referral','manual','order_payment','cashback'];

export function WalletPage() {
  const [txns, setTxns]         = useState<WalletTransaction[]>([]);
  const [stats, setStats]       = useState<WalletStats | null>(null);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [type, setType]         = useState('all');
  const [source, setSource]     = useState('all');

  useEffect(() => { walletApi.getStats().then(setStats).catch(() => {}); }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const d = await walletApi.getAll({ type: type !== 'all' ? type : undefined, source: source !== 'all' ? source : undefined, search: search || undefined, page });
      setTxns(d.transactions); setTotal(d.total); setPages(d.pages);
    } catch (e: any) { setError(e?.response?.data?.message ?? 'Failed to load'); }
    finally { setLoading(false); }
  }, [type, source, search, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [type, source, search]);

  return (
    <div>
      <PageHeader title="Wallet Transactions" subtitle={loading ? 'Loading...' : `${total} transactions`}
        breadcrumbs={[{ label: 'Home' }, { label: 'Wallet' }]} />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="bg-green-50 rounded-2xl px-5 py-4">
            <div className="text-2xl font-bold text-green-700">{money(stats.totalCredits)}</div>
            <div className="text-xs text-slate-500 mt-0.5">Total Credits</div>
          </div>
          <div className="bg-red-50 rounded-2xl px-5 py-4">
            <div className="text-2xl font-bold text-red-600">{money(stats.totalDebits)}</div>
            <div className="text-xs text-slate-500 mt-0.5">Total Debits</div>
          </div>
          <div className="bg-slate-50 rounded-2xl px-5 py-4">
            <div className="text-2xl font-bold text-slate-700">{stats.txnCount}</div>
            <div className="text-xs text-slate-500 mt-0.5">Total Transactions</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search by user or note..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {[{v:'all',l:'All'},{v:'credit',l:'Credits'},{v:'debit',l:'Debits'}].map(t => (
            <button key={t.v} onClick={() => setType(t.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${type === t.v ? 'bg-[#EA580C] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-200'}`}>
              {t.l}
            </button>
          ))}
        </div>
        <select value={source} onChange={e => setSource(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none capitalize">
          {SOURCES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Sources' : s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {error && <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600"><AlertCircle size={14} />{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Source</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Balance After</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Note</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={7} className="py-20 text-center text-slate-400">
                <Loader2 size={22} className="animate-spin mx-auto mb-2" />Loading transactions...
              </td></tr>
            ) : txns.length === 0 ? (
              <tr><td colSpan={7} className="py-20 text-center text-slate-400">
                <Wallet size={36} className="mx-auto mb-3 text-slate-200" /><p className="font-medium">No transactions found</p>
              </td></tr>
            ) : txns.map(t => (
              <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="font-medium text-slate-800 text-sm">{t.user?.name ?? '—'}</div>
                  <div className="text-xs text-slate-400">{t.user?.email ?? ''}</div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${t.type === 'credit' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {t.type === 'credit' ? <ArrowUpCircle size={11} /> : <ArrowDownCircle size={11} />}
                    {t.type}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`font-semibold text-sm ${t.type === 'credit' ? 'text-green-700' : 'text-red-600'}`}>
                    {t.type === 'credit' ? '+' : '-'}{money(t.amount)}
                  </span>
                </td>
                <td className="px-5 py-3.5 hidden md:table-cell">
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">{t.source?.replace('_',' ')}</span>
                </td>
                <td className="px-5 py-3.5 hidden lg:table-cell text-sm font-medium text-slate-700">{money(t.balanceAfter)}</td>
                <td className="px-5 py-3.5 hidden lg:table-cell text-xs text-slate-400 max-w-[160px] truncate">{t.note ?? '—'}</td>
                <td className="px-5 py-3.5 hidden lg:table-cell text-xs text-slate-400">{formatDateTime(t.created_at)}</td>
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
