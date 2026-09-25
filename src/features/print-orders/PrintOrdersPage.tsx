import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, Printer, ExternalLink, ChevronLeft, ChevronRight, FileText, X, Eye, Info, Clock, CheckCircle2, PackageCheck, XCircle } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/ui/button';
import { cn, money, formatDateTime } from '../../lib/utils';
import api from '../../lib/api';

// ── Types ────────────────────────────────────────────────────

interface PrintFile { name: string; url: string; pages: number }

interface PrintOrder {
  id: number;
  status: 'pending' | 'confirmed' | 'printing' | 'delivered' | 'cancelled';
  color: 'bw' | 'color';
  paper: string;
  sides: 'single' | 'double';
  copies: number;
  totalPages: number;
  printCost: number;
  deliveryFee: number;
  grandTotal: number;
  files: PrintFile[];
  created_at: string;
  customer?: { id: number; name: string; mobile: string; email?: string };
}

interface PrintOrderStats {
  total: number; pending: number; confirmed: number;
  printing: number; delivered: number; cancelled: number;
}

// Some older rows have `files` stored as a JSON string instead of an array
// (legacy data) — normalize so the UI never crashes on it.
function getFiles(order: PrintOrder): PrintFile[] {
  const raw = order.files as unknown;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* not valid JSON — fall through */ }
  }
  return [];
}

// ── Status config ─────────────────────────────────────────────

const STATUS_STYLES: Record<PrintOrder['status'], string> = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  printing:  'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
};

const STATUS_LABEL: Record<PrintOrder['status'], string> = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  printing:  'Printing',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const NEXT_STATUS: Partial<Record<PrintOrder['status'], PrintOrder['status']>> = {
  pending:   'confirmed',
  confirmed: 'printing',
  printing:  'delivered',
};

const NEXT_LABEL: Partial<Record<PrintOrder['status'], string>> = {
  pending:   'Confirm Order',
  confirmed: 'Start Printing',
  printing:  'Mark Delivered',
};

const STATUS_FILTER = ['all', 'pending', 'confirmed', 'printing', 'delivered', 'cancelled'] as const;

// ── Uploaded documents preview modal ────────────────────────────

const isImageFile = (name: string) => /\.(jpe?g|png|gif|webp)$/i.test(name);
const isPdfFile   = (name: string) => /\.pdf$/i.test(name);

function PrintFilesModal({ order, onClose }: { order: PrintOrder; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-semibold text-slate-800">Uploaded Documents</h3>
            <p className="text-xs text-slate-400 mt-0.5">Order #{order.id} · {order.customer?.name ?? '—'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
        </div>

        {/* Files */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {getFiles(order).length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-10">No files on this order.</p>
          ) : getFiles(order).map((f, i) => (
            <div key={i} className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={15} className="text-[#EA580C] shrink-0" />
                  <span className="text-sm font-medium text-slate-700 truncate">{f.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400">{f.pages} pg</span>
                  <a href={f.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#EA580C] hover:underline flex items-center gap-1">
                    Open <ExternalLink size={12} />
                  </a>
                </div>
              </div>
              {isImageFile(f.name) ? (
                <img src={f.url} alt={f.name} className="w-full max-h-80 object-contain bg-slate-100" />
              ) : isPdfFile(f.name) ? (
                <iframe src={f.url} className="w-full h-80" title={f.name} />
              ) : (
                <div className="flex items-center justify-center gap-2 py-8 text-slate-400 text-sm">
                  <FileText size={20} /> Preview not available for this file type
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Print specs strip — pages, color, single/double at a glance */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 shrink-0">
          <span className="font-semibold text-slate-700">{order.color === 'bw' ? 'Black & White' : 'Color'}</span>
          <span>{order.paper}</span>
          <span>{order.sides === 'single' ? 'Single-sided' : 'Double-sided'}</span>
          <span>{order.copies} {order.copies > 1 ? 'copies' : 'copy'}</span>
          <span>{order.totalPages} total page{order.totalPages !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}

// ── Detail drawer ─────────────────────────────────────────────

function PrintOrderDrawer({ order, onClose, onUpdate }: {
  order: PrintOrder; onClose: () => void; onUpdate: (o: PrintOrder) => void
}) {
  const [updating, setUpdating] = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const advance = async () => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdating(true); setError('');
    try {
      const { data } = await api.patch<{ order: PrintOrder }>(`/api/admin/print-orders/${order.id}/status`, { status: next });
      onUpdate(data.order);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Update failed');
    } finally { setUpdating(false); }
  };

  const cancel = async () => {
    if (!confirm('Cancel this print order?')) return;
    setUpdating(true); setError('');
    try {
      const { data } = await api.patch<{ order: PrintOrder }>(`/api/admin/print-orders/${order.id}/status`, { status: 'cancelled' });
      onUpdate(data.order);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Cancel failed');
    } finally { setUpdating(false); }
  };

  const isClosed = order.status === 'delivered' || order.status === 'cancelled';
  const nextStatus = NEXT_STATUS[order.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Print Order #{order.id}</h2>
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border', STATUS_STYLES[order.status])}>
                {STATUS_LABEL[order.status]}
              </span>
            </div>
            <div className="mt-0.5 text-xs text-slate-400">{formatDateTime(order.created_at)}</div>
          </div>
          <button onClick={onClose} className="-mr-1.5 shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle size={14} className="shrink-0" />{error}
            </div>
          )}

          {/* Customer */}
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Customer</h3>
            <p className="font-semibold text-slate-800">{order.customer?.name ?? '—'}</p>
            {order.customer?.mobile && <p className="text-xs text-slate-400 mt-0.5">📞 {order.customer.mobile}</p>}
            {order.customer?.email  && <p className="text-xs text-slate-400">✉️ {order.customer.email}</p>}
          </section>

          {/* Print specs */}
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Print Details</h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              {[
                ['Color',   order.color === 'bw' ? 'Black & White' : 'Color'],
                ['Paper',   order.paper],
                ['Sides',   order.sides === 'single' ? 'Single-sided' : 'Double-sided'],
                ['Copies',  String(order.copies)],
                ['Pages',   String(order.totalPages)],
                ['Files',   String(getFiles(order).length)],
              ].map(([label, val]) => (
                <React.Fragment key={label}>
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium text-slate-800">{val}</span>
                </React.Fragment>
              ))}
            </div>
          </section>

          {/* Files */}
          {getFiles(order).length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Files to Print</h3>
              <div className="space-y-2">
                {getFiles(order).map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <FileText size={16} className="text-[#EA580C] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 truncate">{f.name}</p>
                      <p className="text-xs text-slate-400">{f.pages} page{f.pages !== 1 ? 's' : ''}</p>
                    </div>
                    <a href={f.url} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#EA580C] transition-colors">
                      <ExternalLink size={14} />
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Bill */}
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Bill</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Print Cost</span><span>{money(order.printCost)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Delivery</span><span>{money(order.deliveryFee)}</span></div>
              <div className="flex justify-between border-t border-slate-100 pt-2 font-bold">
                <span>Total</span><span className="text-[#EA580C]">{money(order.grandTotal)}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        {!isClosed && (
          <div className="flex shrink-0 gap-2 border-t border-slate-100 bg-white px-5 py-3.5">
            {nextStatus && (
              <Button className="flex-1" onClick={advance} disabled={updating}>
                {updating ? <Loader2 size={14} className="animate-spin" /> : null}
                {NEXT_LABEL[order.status]}
              </Button>
            )}
            <Button variant="outline" className={cn('border-red-200 text-red-500 hover:bg-red-50', !nextStatus && 'flex-1')} onClick={cancel} disabled={updating}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────

export function PrintOrdersPage() {
  const [orders,  setOrders]  = useState<PrintOrder[]>([]);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [status,  setStatus]  = useState<string>('all');
  const [selected, setSelected] = useState<PrintOrder | null>(null);
  const [viewOrder, setViewOrder] = useState<PrintOrder | null>(null);
  const [stats, setStats] = useState<PrintOrderStats | null>(null);

  useEffect(() => {
    api.get('/api/admin/print-orders/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/api/admin/print-orders', { params: { status: status !== 'all' ? status : undefined, page, limit: 15 } });
      setOrders(data.orders);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load');
    } finally { setLoading(false); }
  }, [status, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [status]);

  const handleUpdate = (updated: PrintOrder) => {
    setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o));
    setSelected(prev => prev ? { ...prev, ...updated } : null);
    api.get('/api/admin/print-orders/stats').then(r => setStats(r.data)).catch(() => {});
  };

  return (
    <div>
      <PageHeader
        title="Print Orders"
        subtitle={loading ? 'Loading...' : `${total} total`}
        breadcrumbs={[{ label: 'Home' }, { label: 'Print Orders' }]}
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          <StatCard label="Total" value={stats.total} icon={Printer} color="#475569" />
          <StatCard label="Pending" value={stats.pending} icon={Clock} color="#F59E0B" />
          <StatCard label="Confirmed" value={stats.confirmed} icon={CheckCircle2} color="#3B82F6" />
          <StatCard label="Printing" value={stats.printing} icon={Printer} color="#8B5CF6" />
          <StatCard label="Delivered" value={stats.delivered} icon={PackageCheck} color="#16A34A" />
          <StatCard label="Cancelled" value={stats.cancelled} icon={XCircle} color="#DC2626" />
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap mb-5">
        {STATUS_FILTER.map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize', status === s ? 'bg-[#EA580C] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-200')}>
            {s === 'all' ? 'All' : STATUS_LABEL[s as PrintOrder['status']]}
          </button>
        ))}
      </div>

      {error && <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600"><AlertCircle size={14} />{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Order</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Specs</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Time</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={7} className="py-20 text-center text-slate-400">
                <Loader2 size={22} className="animate-spin mx-auto mb-2" />Loading...
              </td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="py-20 text-center text-slate-400">
                <Printer size={36} className="mx-auto mb-3 text-slate-200" />
                <p className="font-medium">No print orders yet</p>
              </td></tr>
            ) : orders.map(order => (
              <tr key={order.id} className="hover:bg-slate-50/50 cursor-pointer transition-colors" onClick={() => setSelected(order)}>
                <td className="px-5 py-3.5 font-semibold text-slate-800">#{order.id}</td>
                <td className="px-5 py-3.5">
                  <div className="font-medium text-slate-700">{order.customer?.name ?? '—'}</div>
                  <div className="text-xs text-slate-400">{order.customer?.mobile}</div>
                </td>
                <td className="px-5 py-3.5 hidden md:table-cell text-slate-500 text-xs">
                  {order.color === 'bw' ? 'B&W' : 'Color'} · {order.paper} · {order.sides === 'single' ? '1-side' : '2-side'} · {order.copies}x · {order.totalPages}pg · {getFiles(order).length} file{getFiles(order).length !== 1 ? 's' : ''}
                </td>
                <td className="px-5 py-3.5 font-semibold text-slate-800">{money(order.grandTotal)}</td>
                <td className="px-5 py-3.5">
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border', STATUS_STYLES[order.status])}>
                    {STATUS_LABEL[order.status]}
                  </span>
                </td>
                <td className="px-5 py-3.5 hidden lg:table-cell text-xs text-slate-400">{formatDateTime(order.created_at)}</td>
                <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setViewOrder(order)}>
                      <Eye size={13} /> View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelected(order)}>
                      <Info size={13} /> Details
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/30">
            <span className="text-xs text-slate-400">Page {page} of {pages} · {total} orders</span>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}><ChevronLeft size={14} /></Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === pages}><ChevronRight size={14} /></Button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <PrintOrderDrawer
          order={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}

      {viewOrder && (
        <PrintFilesModal order={viewOrder} onClose={() => setViewOrder(null)} />
      )}
    </div>
  );
}
