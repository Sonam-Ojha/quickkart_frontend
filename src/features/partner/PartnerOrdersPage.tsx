import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Phone, MapPin, Loader2, CheckCircle2, LayoutGrid, Table2, ChefHat, PackageCheck, XCircle, Clock, AlertCircle, Bike } from 'lucide-react';
import { partnerApi, PartnerOrder, OrderGroup } from './api';
import { ORDERS_CHANGED, REJECT_REASONS, announceOrdersChanged } from './NewOrderModal';
import type { PartnerOutletContext } from './PartnerLayout';

const POLL_MS = 10_000;

const TABS: { key: OrderGroup; label: string }[] = [
  { key: 'new',       label: 'New' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'onTheWay',  label: 'On the way' },
  { key: 'done',      label: 'Done' },
];


const VIEW_KEY = 'qk-partner-orders-view';
type View = 'table' | 'cards';
const loadView = (): View => { try { return localStorage.getItem(VIEW_KEY) === 'cards' ? 'cards' : 'table'; } catch { return 'table'; } };

const STATUS_PILL: Record<PartnerOrder['status'], { label: string; cls: string }> = {
  pending:          { label: 'New',        cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  confirmed:        { label: 'Accepted',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  preparing:        { label: 'Preparing',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  out_for_delivery: { label: 'On the way', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  delivered:        { label: 'Delivered',  cls: 'bg-green-50 text-green-700 border-green-200' },
  cancelled:        { label: 'Cancelled',  cls: 'bg-slate-100 text-slate-500 border-slate-200' },
};

const minutesAgo = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
const timeLabel = (iso: string) => {
  const m = minutesAgo(iso);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const d = new Date(iso);
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  // Older than today → show the date too, so "11:43 pm" from yesterday isn't mistaken for later today.
  return d.toDateString() === new Date().toDateString()
    ? time
    : `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${time}`;
};

export function PartnerOrdersPage() {
  const [tab, setTab]         = useState<OrderGroup>('new');
  const [orders, setOrders]   = useState<PartnerOrder[]>([]);
  const [counts, setCounts]   = useState<Record<OrderGroup, number | null>>({ new: 0, preparing: 0, onTheWay: 0, done: null });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [busy, setBusy]       = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<PartnerOrder | null>(null);
  const { refreshNew } = useOutletContext<PartnerOutletContext>();
  const [view, setViewState] = useState<View>(loadView);
  const setView = (v: View) => { setViewState(v); try { localStorage.setItem(VIEW_KEY, v); } catch { /* private mode */ } };

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const cur = await partnerApi.orders(tab);
      setOrders(cur.orders);
      setCounts(cur.counts);
      setError('');
    } catch (err: any) {
      if (!quiet) setError(err?.response?.data?.message ?? 'Could not load orders. Check your internet.');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);
  // Accept/reject from the new-order pop-up → reload this page too
  useEffect(() => {
    const on = () => load(true);
    window.addEventListener(ORDERS_CHANGED, on);
    return () => window.removeEventListener(ORDERS_CHANGED, on);
  }, [load]);
  useEffect(() => {
    const t = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const act = async (o: PartnerOrder, fn: () => Promise<unknown>) => {
    setBusy(o.id); setError('');
    try { await fn(); await load(true); refreshNew(); announceOrdersChanged(); }
    catch (err: any) { setError(err?.response?.data?.message ?? 'Something went wrong'); await load(true); refreshNew(); }
    finally { setBusy(null); }
  };

  const doReject = async (reason: string) => {
    const o = rejecting;
    if (!o || !reason.trim()) return;
    setRejecting(null);
    await act(o, () => partnerApi.reject(o.id, reason.trim()));
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1.5 sm:flex sm:gap-2">
        {TABS.map(t => {
          const n = counts[t.key];
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`rounded-xl py-2 sm:px-5 text-xs sm:text-sm font-semibold border transition-colors ${
                active ? 'bg-[#EA580C] border-[#EA580C] text-white' : 'bg-white border-slate-200 text-slate-600'
              }`}>
              {t.label}
              {n != null && n > 0 && (
                <span className={`ml-1 inline-flex min-w-[18px] h-[18px] px-1 items-center justify-center rounded-full text-[11px] ${
                  active ? 'bg-white text-[#EA580C]' : t.key === 'new' ? 'bg-[#EA580C] text-white' : 'bg-slate-200 text-slate-700'
                }`}>{n}</span>
              )}
            </button>
          );
        })}
      </div>
      {/* View switch */}
      <div className="flex bg-white border border-slate-200 rounded-xl p-1 sm:ml-auto self-start">
        {([['table', 'Table', Table2], ['cards', 'Cards', LayoutGrid]] as const).map(([v, label, Icon]) => (
          <button key={v} onClick={() => setView(v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              view === v ? 'bg-[#0F1923] text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>
      </div>

      {error && <div className="flex items-center gap-2 p-3 mb-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600"><AlertCircle size={15} />{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin mr-2" /> Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <CheckCircle2 size={38} className="mx-auto mb-2 text-slate-200" />
          <p className="font-semibold text-slate-500">{tab === 'new' ? 'No new orders right now' : 'Nothing here'}</p>
          {tab === 'new' && <p className="text-sm mt-1">New orders show up here by themselves.</p>}
        </div>
      ) : view === 'table' ? (
        <OrdersTable orders={orders} busy={busy} onAct={act} onReject={setRejecting} />
      ) : (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 items-start">
          {orders.map(o => <OrderCard key={o.id} o={o} busy={busy === o.id} onAct={act} onReject={() => setRejecting(o)} />)}
        </div>
      )}

      {rejecting && <RejectSheet order={rejecting} onClose={() => setRejecting(null)} onReject={doReject} />}
    </div>
  );
}

function OrderCard({ o, busy, onAct, onReject }: {
  o: PartnerOrder; busy: boolean;
  onAct: (o: PartnerOrder, fn: () => Promise<unknown>) => void;
  onReject: () => void;
}) {
  const waiting = o.status === 'pending';
  const late = waiting && minutesAgo(o.created_at) >= 5;
  const cod = o.payment?.gateway === 'cod' && o.payment?.status !== 'paid';
  const addr = o.address;
  const phone = addr?.phone || o.customer?.mobile;
  const itemCount = o.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden ${waiting ? (late ? 'border-red-300 ring-2 ring-red-100' : 'border-amber-300') : 'border-slate-200'}`}>
      {/* Head */}
      <div className={`flex items-center justify-between px-4 py-2.5 ${waiting ? 'bg-amber-50' : 'bg-slate-50'}`}>
        <div className="font-bold text-slate-900">#{o.id}</div>
        <div className={`flex items-center gap-1 text-xs font-semibold ${late ? 'text-red-600' : 'text-slate-500'}`}>
          <Clock size={13} /> {timeLabel(o.created_at)}{late ? ' — accept now' : ''}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Items */}
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-1.5">{itemCount} item{itemCount === 1 ? '' : 's'}</div>
          <div className="space-y-1">
            {o.items.map(i => (
              <div key={i.id} className="flex items-baseline gap-2 text-sm">
                <span className="font-bold text-slate-900 w-8 shrink-0">{i.quantity} ×</span>
                <span className="flex-1 text-slate-800">{i.itemName ?? 'Item'}</span>
                <span className="text-slate-500">₹{i.total}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-slate-200 text-sm">
            <span className="font-semibold text-slate-700">Food total</span>
            <span className="font-bold text-slate-900">₹{o.subtotal}</span>
          </div>
          <div className="mt-1 text-xs">
            {cod
              ? <span className="text-amber-700 font-semibold">Cash on delivery — rider collects ₹{o.total} from the customer</span>
              : <span className="text-green-700 font-semibold">Paid online</span>}
          </div>
        </div>

        {/* Customer */}
        <div className="rounded-xl bg-slate-50 p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-slate-800">{o.customer?.name ?? 'Customer'}</span>
            {phone && (
              <a href={`tel:${phone}`} className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                <Phone size={12} /> {phone}
              </a>
            )}
          </div>
          {addr && (
            <div className="flex items-start gap-1.5 mt-1.5 text-xs text-slate-500">
              <MapPin size={12} className="mt-0.5 shrink-0" />
              <span>{[addr.line1, addr.line2, addr.city, addr.pincode].filter(Boolean).join(', ')}</span>
            </div>
          )}
        </div>

        {o.status === 'cancelled' && o.cancelReason && (
          <div className="text-xs text-red-600 font-semibold">Cancelled — {o.cancelReason}</div>
        )}
        {o.status === 'delivered' && <div className="text-xs text-green-700 font-semibold">Delivered</div>}
        {o.status === 'out_for_delivery' && (
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold"><Bike size={14} /> Rider picked it up — on the way</div>
        )}

        {/* Actions */}
        {waiting && (
          <div className="grid grid-cols-3 gap-2">
            <button disabled={busy} onClick={onReject}
              className="h-12 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm flex items-center justify-center gap-1.5 disabled:opacity-60">
              <XCircle size={16} /> Reject
            </button>
            <button disabled={busy} onClick={() => onAct(o, () => partnerApi.accept(o.id))}
              className="col-span-2 h-12 rounded-xl bg-[#16A34A] text-white font-bold text-base flex items-center justify-center gap-2 hover:bg-[#15803D] disabled:opacity-60">
              {busy ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} Accept order
            </button>
          </div>
        )}
        {o.status === 'confirmed' && (
          <div className="grid grid-cols-3 gap-2">
            <button disabled={busy} onClick={onReject}
              className="h-11 rounded-xl border border-slate-300 text-slate-600 font-semibold text-sm disabled:opacity-60">Cancel</button>
            <button disabled={busy} onClick={() => onAct(o, () => partnerApi.preparing(o.id))}
              className="col-span-2 h-11 rounded-xl bg-[#EA580C] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <ChefHat size={17} />} Start preparing
            </button>
          </div>
        )}
        {o.status === 'preparing' && (o.readyAt ? (
          <div className="flex items-center justify-center gap-2 h-11 rounded-xl bg-green-50 text-green-700 font-semibold text-sm">
            <PackageCheck size={17} /> Ready — waiting for the rider
          </div>
        ) : (
          <button disabled={busy} onClick={() => onAct(o, () => partnerApi.ready(o.id))}
            className="w-full h-11 rounded-xl bg-[#EA580C] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <PackageCheck size={17} />} Food is ready for pickup
          </button>
        ))}
      </div>
    </div>
  );
}

function RejectSheet({ order, onClose, onReject }: { order: PartnerOrder; onClose: () => void; onReject: (reason: string) => void }) {
  const [other, setOther] = useState('');
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-lg text-slate-900">Reject order #{order.id}?</h3>
        <p className="text-sm text-slate-500 mt-1 mb-4">The order will be cancelled and the customer told why.</p>
        <div className="space-y-2">
          {REJECT_REASONS.map(r => (
            <button key={r} onClick={() => onReject(r)}
              className="w-full text-left px-4 h-12 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:border-[#EA580C] hover:bg-orange-50">
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <input value={other} onChange={e => setOther(e.target.value)} placeholder="Other reason…"
            className="flex-1 h-12 px-4 rounded-xl border border-slate-200 outline-none focus:border-[#EA580C]" />
          <button disabled={!other.trim()} onClick={() => onReject(other)}
            className="px-4 h-12 rounded-xl bg-[#EA580C] text-white font-semibold disabled:opacity-50">Reject</button>
        </div>
        <button onClick={onClose} className="w-full h-11 mt-3 rounded-xl text-slate-600 font-semibold">Keep the order</button>
      </div>
    </div>
  );
}

function OrdersTable({ orders, busy, onAct, onReject }: {
  orders: PartnerOrder[]; busy: number | null;
  onAct: (o: PartnerOrder, fn: () => Promise<unknown>) => void;
  onReject: (o: PartnerOrder) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3 text-right">Food total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map(o => {
              const waiting = o.status === 'pending';
              const late = waiting && minutesAgo(o.created_at) >= 5;
              const cod = o.payment?.gateway === 'cod' && o.payment?.status !== 'paid';
              const phone = o.address?.phone || o.customer?.mobile;
              const addr = o.address ? [o.address.line1, o.address.line2, o.address.city, o.address.pincode].filter(Boolean).join(', ') : '';
              const isBusy = busy === o.id;
              const pill = STATUS_PILL[o.status];
              return (
                <tr key={o.id} className={`align-top ${waiting ? (late ? 'bg-red-50/50' : 'bg-amber-50/40') : 'hover:bg-slate-50/60'}`}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-bold text-slate-900">#{o.id}</div>
                    <div className={`flex items-center gap-1 text-xs mt-0.5 ${late ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                      <Clock size={11} /> {timeLabel(o.created_at)}
                    </div>
                  </td>
                  <td className="px-4 py-3 min-w-[180px]">
                    {o.items.map(i => (
                      <div key={i.id} className="text-slate-800"><b>{i.quantity}×</b> {i.itemName ?? 'Item'}</div>
                    ))}
                  </td>
                  <td className="px-4 py-3 min-w-[220px] max-w-[320px]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{o.customer?.name ?? 'Customer'}</span>
                      {phone && <a href={`tel:${phone}`} className="flex items-center gap-1 text-xs font-semibold text-[#EA580C] hover:underline"><Phone size={11} />{phone}</a>}
                    </div>
                    {addr && <div className="text-xs text-slate-500 mt-0.5 line-clamp-2" title={addr}>{addr}</div>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {cod
                      ? <><div className="text-xs font-semibold text-amber-700">Cash on delivery</div><div className="text-xs text-slate-400">Collect ₹{o.total}</div></>
                      : <div className="text-xs font-semibold text-green-700">Paid online</div>}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">₹{o.subtotal}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full border text-xs font-semibold whitespace-nowrap ${pill.cls}`}>
                      {o.status === 'preparing' && o.readyAt ? 'Ready' : pill.label}
                    </span>
                    {o.status === 'cancelled' && o.cancelReason && <div className="text-[11px] text-slate-400 mt-1 max-w-[180px]">{o.cancelReason}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                      {waiting && <>
                        <button disabled={isBusy} onClick={() => onReject(o)}
                          className="h-9 px-3 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:border-red-300 hover:text-red-600 disabled:opacity-60">Reject</button>
                        <button disabled={isBusy} onClick={() => onAct(o, () => partnerApi.accept(o.id))}
                          className="h-9 px-4 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60">
                          {isBusy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Accept
                        </button>
                      </>}
                      {o.status === 'confirmed' && <>
                        <button disabled={isBusy} onClick={() => onReject(o)}
                          className="h-9 px-3 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold disabled:opacity-60">Cancel</button>
                        <button disabled={isBusy} onClick={() => onAct(o, () => partnerApi.preparing(o.id))}
                          className="h-9 px-4 rounded-lg bg-[#EA580C] text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60">
                          {isBusy ? <Loader2 size={14} className="animate-spin" /> : <ChefHat size={14} />} Start preparing
                        </button>
                      </>}
                      {o.status === 'preparing' && !o.readyAt && (
                        <button disabled={isBusy} onClick={() => onAct(o, () => partnerApi.ready(o.id))}
                          className="h-9 px-4 rounded-lg bg-[#EA580C] text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60">
                          {isBusy ? <Loader2 size={14} className="animate-spin" /> : <PackageCheck size={14} />} Food is ready
                        </button>
                      )}
                      {o.status === 'preparing' && o.readyAt && <span className="text-xs text-green-700 font-semibold">Waiting for rider</span>}
                      {o.status === 'out_for_delivery' && <span className="flex items-center gap-1 text-xs text-slate-500"><Bike size={13} /> With rider</span>}
                      {['delivered', 'cancelled'].includes(o.status) && <span className="text-xs text-slate-300">—</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
