import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Download, Loader2, AlertCircle, ChevronLeft, ChevronRight, Package, Clock, CheckCircle, Truck, XCircle, X, Bike, MapPin, ShoppingBag, UserCheck } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { money, formatDateTime } from '../../lib/utils';
import { orderApi, Order, OrderStats, OrderStatus } from './api';
import { riderApi, Rider } from '../riders/api';

// ── Status config ──────────────────────────────────────────

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all',              label: 'All' },
  { value: 'pending',          label: 'Pending' },
  { value: 'confirmed',        label: 'Confirmed' },
  { value: 'preparing',        label: 'Preparing' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered',        label: 'Delivered' },
  { value: 'cancelled',        label: 'Cancelled' },
];

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending:          'confirmed',
  confirmed:        'preparing',
  preparing:        'out_for_delivery',
  out_for_delivery: 'delivered',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending:          'Confirm',
  confirmed:        'Start Preparing',
  preparing:        'Out for Delivery',
  out_for_delivery: 'Mark Delivered',
  delivered:        '',
  cancelled:        '',
};

// ── Order Detail Drawer ────────────────────────────────────

function OrderDrawer({ order, onClose, onStatusUpdate }: { order: Order; onClose: () => void; onStatusUpdate: (o: Order) => void }) {
  const [updating, setUpdating]     = useState(false);
  const [error, setError]           = useState('');
  const [riders, setRiders]         = useState<Rider[]>([]);
  const [assigningRider, setAssigningRider] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState<number | ''>(order.rider?.id ?? '');
  const nextStatus = NEXT_STATUS[order.status];

  useEffect(() => {
    riderApi.getAll({ status: 'active' }).then(setRiders).catch(() => {});
  }, []);

  useEffect(() => {
    setSelectedRiderId(order.rider?.id ?? '');
  }, [order.rider]);

  const handleAdvance = async () => {
    if (!nextStatus) return;
    setUpdating(true); setError('');
    try {
      const updated = await orderApi.updateStatus(order.id, nextStatus);
      onStatusUpdate(updated);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Update failed');
    } finally { setUpdating(false); }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this order?')) return;
    setUpdating(true); setError('');
    try {
      const updated = await orderApi.updateStatus(order.id, 'cancelled', 'Cancelled by admin');
      onStatusUpdate(updated);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Cancel failed');
    } finally { setUpdating(false); }
  };

  const handleAssignRider = async () => {
    setAssigningRider(true); setError('');
    try {
      const riderId = selectedRiderId !== '' ? Number(selectedRiderId) : null;
      const updated = await orderApi.assignRider(order.id, riderId);
      onStatusUpdate(updated);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Assign failed');
    } finally { setAssigningRider(false); }
  };

  const timelineIcons: Record<OrderStatus, React.ReactNode> = {
    pending:          <Clock size={14} />,
    confirmed:        <CheckCircle size={14} />,
    preparing:        <Package size={14} />,
    out_for_delivery: <Truck size={14} />,
    delivered:        <CheckCircle size={14} className="text-green-600" />,
    cancelled:        <XCircle size={14} className="text-red-500" />,
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-bold text-slate-800">Order #{order.id}</h2>
            <div className="text-xs text-slate-400 mt-0.5">{formatDateTime(order.created_at)}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-5 flex-1">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600"><AlertCircle size={14} />{error}</div>}

          {/* Status + actions */}
          <div className="flex items-center justify-between">
            <StatusBadge status={order.status} />
            <div className="flex gap-2">
              {nextStatus && (
                <Button size="sm" onClick={handleAdvance} disabled={updating}>
                  {updating && <Loader2 size={12} className="animate-spin" />}
                  {STATUS_LABEL[order.status]}
                </Button>
              )}
              {order.status !== 'delivered' && order.status !== 'cancelled' && (
                <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={handleCancel} disabled={updating}>
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Customer */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Customer</div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#EA580C] to-[#0F766E] flex items-center justify-center text-white text-sm font-bold">
                {order.customer.name[0]}
              </div>
              <div>
                <div className="font-semibold text-slate-800">{order.customer.name}</div>
                <div className="text-xs text-slate-400">{order.customer.email}</div>
                {order.customer.mobile && <div className="text-xs text-slate-400">{order.customer.mobile}</div>}
              </div>
            </div>
          </div>

          {/* Store + Rider */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1"><MapPin size={11} /> Store</div>
              <div className="font-semibold text-sm text-slate-700">{order.store.name}</div>
              <div className="text-xs text-slate-400">{order.store.city}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1"><Bike size={11} /> Rider</div>
              {order.rider ? (
                <>
                  <div className="font-semibold text-sm text-slate-700">{order.rider.name}</div>
                  <div className="text-xs text-slate-400">{order.rider.mobile}</div>
                </>
              ) : <div className="text-xs text-slate-400 italic">Not assigned</div>}
            </div>
          </div>

          {/* Assign Rider */}
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">
                <UserCheck size={12} /> Assign Rider
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedRiderId}
                  onChange={e => setSelectedRiderId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="flex-1 border border-blue-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
                >
                  <option value="">— Unassign rider —</option>
                  {riders.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} · {r.mobile} {r.store ? `(${r.store.name})` : ''}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  onClick={handleAssignRider}
                  disabled={assigningRider || selectedRiderId === (order.rider?.id ?? '')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {assigningRider ? <Loader2 size={12} className="animate-spin" /> : 'Assign'}
                </Button>
              </div>
            </div>
          )}

          {/* Items */}
          {order.items && order.items.length > 0 && (
            <div>
              <div className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Items ({order.items.length})</div>
              <div className="space-y-2">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        {item.product.imageUrl
                          ? <img src={item.product.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                          : <ShoppingBag size={14} className="text-slate-300" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-700">{item.product.name}</div>
                        <div className="text-xs text-slate-400">x{item.quantity} × {money(item.unitPrice)}</div>
                      </div>
                    </div>
                    <span className="font-semibold text-sm text-slate-800">{money(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bill summary */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">Bill Summary</div>
            {[
              { label: 'Subtotal',     value: order.subtotal },
              { label: 'Delivery Fee', value: order.deliveryFee },
              ...(order.discount ? [{ label: 'Discount',    value: -order.discount }] : []),
            ].map(r => (
              <div key={r.label} className="flex justify-between text-sm">
                <span className="text-slate-500">{r.label}</span>
                <span className={`font-medium ${r.value < 0 ? 'text-green-600' : 'text-slate-700'}`}>
                  {r.value < 0 ? `- ${money(Math.abs(r.value))}` : money(r.value)}
                </span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200">
              <span className="text-slate-800">Total</span>
              <span className="text-[#EA580C]">{money(order.total)}</span>
            </div>
          </div>

          {/* Timeline */}
          {order.timeline && order.timeline.length > 0 && (
            <div>
              <div className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">Timeline</div>
              <div className="relative pl-5">
                <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-100" />
                {order.timeline.map((t, i) => (
                  <div key={t.id} className="relative mb-3 last:mb-0">
                    <div className="absolute -left-3.5 w-5 h-5 rounded-full bg-white border-2 border-[#EA580C] flex items-center justify-center text-[#EA580C]">
                      {timelineIcons[t.status]}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-slate-700 capitalize">{t.status.replace(/_/g, ' ')}</div>
                      {t.note && <div className="text-xs text-slate-400">{t.note}</div>}
                      <div className="text-xs text-slate-300 mt-0.5">{formatDateTime(t.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────

export function OrderListPage() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [stats, setStats]     = useState<OrderStats | null>(null);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('all');
  const [selected, setSelected] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { orderApi.getStats().then(setStats).catch(() => {}); }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await orderApi.getAll({ status: status !== 'all' ? status : undefined, search: search || undefined, page, limit: 15 });
      setOrders(data.orders);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load orders');
    } finally { setLoading(false); }
  }, [status, search, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [status, search]);

  const openDetail = async (order: Order) => {
    setDetailLoading(true);
    setSelected(order);
    try {
      const full = await orderApi.getById(order.id);
      setSelected(full);
    } catch {}
    finally { setDetailLoading(false); }
  };

  const handleStatusUpdate = (updated: Order) => {
    setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o));
    setSelected(prev => prev ? { ...prev, ...updated } : null);
    orderApi.getStats().then(setStats).catch(() => {});
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={loading ? 'Loading...' : `${total} total orders`}
        breadcrumbs={[{ label: 'Home' }, { label: 'Orders' }]}
        action={<Button variant="outline" size="sm"><Download size={14} /> Export</Button>}
      />

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          {[
            { label: 'Total',       value: stats.total,     bg: 'bg-slate-50',   text: 'text-slate-700' },
            { label: 'Pending',     value: stats.pending,   bg: 'bg-amber-50',   text: 'text-amber-700' },
            { label: 'Active',      value: stats.active,    bg: 'bg-blue-50',    text: 'text-blue-700' },
            { label: 'Delivered',   value: stats.delivered, bg: 'bg-green-50',   text: 'text-green-700' },
            { label: 'Cancelled',   value: stats.cancelled, bg: 'bg-red-50',     text: 'text-red-600' },
            { label: 'Revenue',     value: money(stats.revenue), bg: 'bg-teal-50', text: 'text-[#0F766E]' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl px-4 py-3`}>
              <div className={`text-lg font-bold ${s.text}`}>{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search by order ID or customer..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_OPTIONS.map(s => (
            <button key={s.value} onClick={() => setStatus(s.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${status === s.value ? 'bg-[#EA580C] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-200'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600"><AlertCircle size={14} />{error}</div>}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Order</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Store</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Time</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={7} className="py-20 text-center text-slate-400">
                <Loader2 size={22} className="animate-spin mx-auto mb-2" />Loading orders...
              </td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="py-20 text-center text-slate-400">
                <ShoppingBag size={36} className="mx-auto mb-3 text-slate-200" />
                <p className="font-medium">No orders found</p>
              </td></tr>
            ) : orders.map(order => (
              <tr key={order.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => openDetail(order)}>
                <td className="px-5 py-3.5">
                  <span className="font-semibold text-slate-800">#{order.id}</span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#EA580C] to-[#0F766E] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {order.customer?.name?.[0] ?? '?'}
                    </div>
                    <span className="font-medium text-slate-700">{order.customer?.name ?? '—'}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 hidden md:table-cell">
                  <span className="text-slate-500 text-xs">{order.store?.name ?? '—'}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="font-semibold text-slate-800">{money(order.total)}</span>
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-5 py-3.5 hidden lg:table-cell">
                  <span className="text-slate-400 text-xs">{formatDateTime(order.created_at)}</span>
                </td>
                <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openDetail(order)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                    <Eye size={15} />
                  </button>
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
        <OrderDrawer
          order={selected}
          onClose={() => setSelected(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}
