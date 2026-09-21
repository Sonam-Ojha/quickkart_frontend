import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Download, Loader2, AlertCircle, ChevronLeft, ChevronRight, Package, Clock, CheckCircle, Truck, XCircle, X, Bike, MapPin, ShoppingBag, UserCheck, Mail, Phone, IndianRupee } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { cn, money, formatDateTime } from '../../lib/utils';
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
  const [show, setShow]             = useState(false);
  const nextStatus = NEXT_STATUS[order.status];
  const isClosed   = order.status === 'delivered' || order.status === 'cancelled';

  const handleClose = () => { setShow(false); setTimeout(onClose, 200); };

  // Slide-in on mount, close on Escape, lock background scroll while open.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true));
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setShow(false); setTimeout(onClose, 200); } };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

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

  const fmtTime = (iso?: string | null) => {
    if (!iso) return '';
    const t = new Date(iso).getTime();
    return !t || Number.isNaN(t) ? '' : formatDateTime(iso);
  };
  const initial = order.customer?.name?.trim().charAt(0).toUpperCase() || '?';
  const timeline = order.timeline ?? [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className={cn(
          'absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200',
          show ? 'opacity-100' : 'opacity-0',
        )}
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative flex h-full w-full max-w-xl flex-col bg-slate-50 shadow-2xl transition-transform duration-200 ease-out',
          show ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Order #{order.id}</h2>
              <StatusBadge status={order.status} />
            </div>
            <div className="mt-0.5 text-xs text-slate-400">{fmtTime(order.created_at)}</div>
          </div>
          <button
            onClick={handleClose}
            className="-mr-1.5 shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle size={14} className="shrink-0" />{error}
            </div>
          )}

          {/* Customer */}
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Customer</h3>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#EA580C] to-[#0F766E] text-sm font-bold text-white">
                {initial}
              </div>
              <div className="min-w-0">
                <div className="truncate font-semibold text-slate-800">{order.customer?.name ?? '—'}</div>
                {order.customer?.email && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Mail size={11} className="shrink-0" />
                    <span className="truncate">{order.customer.email}</span>
                  </div>
                )}
                {order.customer?.mobile && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Phone size={11} className="shrink-0" />
                    <span className="truncate">{order.customer.mobile}</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Store + Rider */}
          <div className="grid grid-cols-2 gap-3">
            <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <MapPin size={11} className="shrink-0" /> Store
              </h3>
              <div className="truncate text-sm font-semibold text-slate-700">{order.store?.name ?? '—'}</div>
              <div className="truncate text-xs text-slate-400">{order.store?.city}</div>
            </section>
            <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <Bike size={11} className="shrink-0" /> Rider
              </h3>
              {order.rider ? (
                <>
                  <div className="truncate text-sm font-semibold text-slate-700">{order.rider.name}</div>
                  <div className="truncate text-xs text-slate-400">{order.rider.mobile}</div>
                </>
              ) : (
                <div className="text-xs italic text-slate-400">Not assigned</div>
              )}
            </section>
          </div>

          {/* Assign Rider */}
          {!isClosed && (
            <section className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                <UserCheck size={12} className="shrink-0" /> Assign Rider
              </h3>
              <div className="flex gap-2">
                <select
                  value={selectedRiderId}
                  onChange={e => setSelectedRiderId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="min-w-0 flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                >
                  <option value="">— Unassign rider —</option>
                  {riders.map(r => (
                    <option key={r.id} value={r.id}>{r.name} · {r.mobile}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  onClick={handleAssignRider}
                  disabled={assigningRider || selectedRiderId === (order.rider?.id ?? '')}
                  className="shrink-0 bg-blue-600 text-white hover:bg-blue-700"
                >
                  {assigningRider ? <Loader2 size={12} className="animate-spin" /> : 'Assign'}
                </Button>
              </div>
            </section>
          )}

          {/* Items */}
          {order.items && order.items.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Items ({order.items.length})
              </h3>
              <div className="space-y-3">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                      {item.product.imageUrl
                        ? <img src={item.product.imageUrl} alt="" className="h-full w-full object-cover" />
                        : <ShoppingBag size={14} className="text-slate-300" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-slate-700">{item.product.name}</div>
                      <div className="text-xs text-slate-400">{item.quantity} × {money(item.unitPrice)}</div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-slate-800">{money(item.total)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Bill summary */}
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Bill Summary</h3>
            <div className="space-y-2">
              {[
                { label: 'Subtotal',     value: order.subtotal },
                { label: 'Delivery Fee', value: order.deliveryFee },
                ...(order.discount ? [{ label: 'Discount', value: -order.discount }] : []),
              ].map(r => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{r.label}</span>
                  <span className={cn('font-medium', r.value < 0 ? 'text-green-600' : 'text-slate-700')}>
                    {r.value < 0 ? `- ${money(Math.abs(r.value))}` : money(r.value)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold">
                <span className="text-slate-800">Total</span>
                <span className="text-[#EA580C]">{money(order.total)}</span>
              </div>
            </div>
          </section>

          {/* Timeline */}
          {timeline.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Timeline</h3>
              <div className="space-y-1">
                {timeline.map((t, i) => (
                  <div key={t.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#EA580C] bg-white text-[#EA580C]">
                        {timelineIcons[t.status]}
                      </div>
                      {i < timeline.length - 1 && <div className="w-px flex-1 bg-slate-200" />}
                    </div>
                    <div className="pb-4">
                      <div className="text-sm font-medium capitalize text-slate-700">{t.status.replace(/_/g, ' ')}</div>
                      {t.note && <div className="text-xs text-slate-400">{t.note}</div>}
                      {fmtTime(t.createdAt) && <div className="mt-0.5 text-xs text-slate-300">{fmtTime(t.createdAt)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer actions */}
        {!isClosed && (
          <div className="flex shrink-0 gap-2 border-t border-slate-200 bg-white px-5 py-3.5">
            {nextStatus && (
              <Button className="flex-1" onClick={handleAdvance} disabled={updating}>
                {updating && <Loader2 size={14} className="animate-spin" />}
                {STATUS_LABEL[order.status]}
              </Button>
            )}
            <Button
              variant="outline"
              className={cn('border-red-200 text-red-500 hover:bg-red-50', !nextStatus && 'flex-1')}
              onClick={handleCancel}
              disabled={updating}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────

function OrderStatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div
      className="rounded-2xl px-4 py-3.5 border transition-shadow hover:shadow-sm"
      style={{ background: `linear-gradient(155deg, ${color}17, ${color}08)`, borderColor: color + '2A' }}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ background: color + '22' }}>
        <Icon size={14} style={{ color }} />
      </div>
      <div className="text-lg font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
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
          <OrderStatCard label="Total"     value={String(stats.total)}      icon={ShoppingBag}  color="#64748B" />
          <OrderStatCard label="Pending"   value={String(stats.pending)}    icon={Clock}        color="#D97706" />
          <OrderStatCard label="Active"    value={String(stats.active)}     icon={Truck}        color="#2563EB" />
          <OrderStatCard label="Delivered" value={String(stats.delivered)}  icon={CheckCircle}  color="#16A34A" />
          <OrderStatCard label="Cancelled" value={String(stats.cancelled)}  icon={XCircle}      color="#DC2626" />
          <OrderStatCard label="Revenue"   value={money(stats.revenue)}     icon={IndianRupee}  color="#0F766E" />
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
