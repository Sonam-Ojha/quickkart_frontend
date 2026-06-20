import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, CheckCircle, Clock, AlertCircle, Search, Loader2, X, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { formatDateTime } from '../../lib/utils';
import { supportApi, SupportTicket, SupportStats } from './api';

// ── Ticket Drawer ──────────────────────────────────────────

function TicketDrawer({ ticket: init, onClose, onUpdate }: { ticket: SupportTicket; onClose: () => void; onUpdate: (t: SupportTicket) => void }) {
  const [ticket, setTicket] = useState(init);
  const [reply, setReply]   = useState('');
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    supportApi.getById(init.id).then(setTicket).catch(() => {});
  }, [init.id]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const msg = await supportApi.reply(ticket.id, reply.trim());
      setTicket(prev => ({ ...prev, messages: [...(prev.messages ?? []), msg], status: prev.status === 'open' ? 'in_progress' : prev.status }));
      onUpdate({ ...ticket, status: ticket.status === 'open' ? 'in_progress' : ticket.status });
      setReply('');
    } catch {}
    finally { setSending(false); }
  };

  const handleStatus = async (status: string) => {
    setUpdating(true);
    try {
      const updated = await supportApi.updateStatus(ticket.id, status);
      setTicket(prev => ({ ...prev, status: updated.status }));
      onUpdate({ ...ticket, status: updated.status });
    } catch {}
    finally { setUpdating(false); }
  };

  const STATUS_COLOR: Record<string, string> = {
    open: 'bg-red-50 text-red-600', in_progress: 'bg-amber-50 text-amber-700', resolved: 'bg-green-50 text-green-700',
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="font-bold text-slate-800">Ticket #{ticket.id}</h2>
            <div className="text-xs text-slate-400 mt-0.5 capitalize">{ticket.category} · {formatDateTime(ticket.created_at)}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>

        {/* Customer + status */}
        <div className="p-4 border-b border-slate-50 shrink-0 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#EA580C] to-[#0F766E] flex items-center justify-center text-white text-sm font-bold">
              {ticket.customer?.name?.[0] ?? '?'}
            </div>
            <div>
              <div className="font-semibold text-slate-800 text-sm">{ticket.customer?.name}</div>
              <div className="text-xs text-slate-400">{ticket.customer?.email}</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[ticket.status]}`}>
              {ticket.status.replace('_', ' ')}
            </span>
            <div className="flex gap-1.5">
              {ticket.status !== 'in_progress' && (
                <Button size="sm" variant="outline" onClick={() => handleStatus('in_progress')} disabled={updating}>
                  {updating ? <Loader2 size={12} className="animate-spin" /> : 'In Progress'}
                </Button>
              )}
              {ticket.status !== 'resolved' && (
                <Button size="sm" onClick={() => handleStatus('resolved')} disabled={updating}>
                  {updating ? <Loader2 size={12} className="animate-spin" /> : 'Resolve'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!ticket.messages || ticket.messages.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-10">No messages yet</div>
          ) : ticket.messages.map(m => (
            <div key={m.id} className={`flex ${m.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.senderType === 'admin' ? 'bg-[#EA580C] text-white rounded-tr-sm' : 'bg-slate-100 text-slate-800 rounded-tl-sm'}`}>
                <p>{m.message}</p>
                <p className={`text-[10px] mt-1 ${m.senderType === 'admin' ? 'text-orange-200' : 'text-slate-400'}`}>{formatDateTime(m.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Reply box */}
        {ticket.status !== 'resolved' && (
          <div className="p-4 border-t border-slate-100 shrink-0 flex gap-2">
            <Input placeholder="Type a reply..." value={reply} onChange={e => setReply(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply()} className="flex-1" />
            <Button onClick={handleReply} disabled={sending || !reply.trim()}>
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────

const CATEGORIES = ['all','delivery','payment','product','account','other'];

export function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats]     = useState<SupportStats | null>(null);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('all');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState<SupportTicket | null>(null);

  const loadStats = () => supportApi.getStats().then(setStats).catch(() => {});
  useEffect(() => { loadStats(); }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const d = await supportApi.getAll({ status: status !== 'all' ? status : undefined, category: category !== 'all' ? category : undefined, search: search || undefined, page });
      setTickets(d.tickets); setTotal(d.total); setPages(d.pages);
    } catch (e: any) { setError(e?.response?.data?.message ?? 'Failed to load'); }
    finally { setLoading(false); }
  }, [status, category, search, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [status, category, search]);

  const handleUpdate = (updated: SupportTicket) => {
    setTickets(prev => prev.map(t => t.id === updated.id ? { ...t, status: updated.status } : t));
    loadStats();
  };

  const STATUS_STYLE: Record<string, string> = {
    open: 'bg-red-50 text-red-600', in_progress: 'bg-amber-50 text-amber-700', resolved: 'bg-green-50 text-green-700',
  };

  return (
    <div>
      <PageHeader title="Support Tickets" subtitle={loading ? 'Loading...' : `${total} tickets`}
        breadcrumbs={[{ label: 'Home' }, { label: 'Support' }]} />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          {[
            { l:'Total', v: stats.total, bg:'bg-slate-50', t:'text-slate-700' },
            { l:'Open',  v: stats.open,  bg:'bg-red-50',   t:'text-red-600' },
            { l:'In Progress', v: stats.in_progress, bg:'bg-amber-50', t:'text-amber-700' },
            { l:'Resolved',    v: stats.resolved,    bg:'bg-green-50', t:'text-green-700' },
          ].map(s => (
            <div key={s.l} className={`${s.bg} rounded-2xl px-5 py-4`}>
              <div className={`text-2xl font-bold ${s.t}`}>{s.v}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search by name, email or ID..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {[{v:'all',l:'All'},{v:'open',l:'Open'},{v:'in_progress',l:'In Progress'},{v:'resolved',l:'Resolved'}].map(s => (
            <button key={s.v} onClick={() => setStatus(s.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${status === s.v ? 'bg-[#EA580C] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-200'}`}>
              {s.l}
            </button>
          ))}
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none capitalize">
          {CATEGORIES.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
        </select>
      </div>

      {error && <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600"><AlertCircle size={14} />{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Category</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Order</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Date</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={7} className="py-20 text-center text-slate-400">
                <Loader2 size={22} className="animate-spin mx-auto mb-2" />Loading tickets...
              </td></tr>
            ) : tickets.length === 0 ? (
              <tr><td colSpan={7} className="py-20 text-center text-slate-400">
                <MessageSquare size={36} className="mx-auto mb-3 text-slate-200" /><p className="font-medium">No tickets found</p>
              </td></tr>
            ) : tickets.map(t => (
              <tr key={t.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelected(t)}>
                <td className="px-5 py-3.5 font-semibold text-slate-700">#{t.id}</td>
                <td className="px-5 py-3.5">
                  <div className="font-medium text-slate-800">{t.customer?.name ?? '—'}</div>
                  <div className="text-xs text-slate-400">{t.customer?.email ?? ''}</div>
                </td>
                <td className="px-5 py-3.5 hidden md:table-cell">
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">{t.category}</span>
                </td>
                <td className="px-5 py-3.5 hidden lg:table-cell text-xs text-slate-500">{t.order ? `#${t.order.id}` : '—'}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[t.status]}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-5 py-3.5 hidden lg:table-cell text-xs text-slate-400">{formatDateTime(t.created_at)}</td>
                <td className="px-5 py-3.5">
                  <MessageSquare size={14} className="text-slate-300 hover:text-[#EA580C] transition-colors" />
                </td>
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

      {selected && <TicketDrawer ticket={selected} onClose={() => setSelected(null)} onUpdate={handleUpdate} />}
    </div>
  );
}
