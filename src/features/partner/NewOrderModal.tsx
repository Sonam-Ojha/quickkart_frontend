import { useEffect, useState } from 'react';
import { BellRing, CheckCircle2, XCircle, Phone, MapPin, Loader2, Clock, ArrowLeft, AlertCircle } from 'lucide-react';
import { partnerApi, PartnerOrder } from './api';

export const REJECT_REASONS = ['Item out of stock', 'Kitchen too busy', 'Closing now', 'Cannot make this order'];

/** Pages listen for this to reload right after an order is accepted/rejected. */
export const ORDERS_CHANGED = 'partner-orders-changed';
export const announceOrdersChanged = () => window.dispatchEvent(new Event(ORDERS_CHANGED));

const elapsed = (iso: string, now: number) => {
  const s = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Full-screen "new order" pop-up, like a ringing phone: accept or reject right here. */
export function NewOrderModal({ order, queue, onDone, onLater }: {
  order: PartnerOrder;
  queue: number;              // how many new orders are waiting in total
  onDone: () => void;         // accepted / rejected → refresh
  onLater: () => void;        // hide for now (banner + badge stay)
}) {
  const [busy, setBusy] = useState<'accept' | 'reject' | null>(null);
  const [error, setError] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [other, setOther] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  // New order in the pop-up → reset the form
  useEffect(() => { setRejecting(false); setOther(''); setError(''); }, [order.id]);

  const run = async (kind: 'accept' | 'reject', fn: () => Promise<unknown>) => {
    setBusy(kind); setError('');
    try { await fn(); announceOrdersChanged(); onDone(); }
    catch (e: any) { setError(e?.response?.data?.message ?? 'Something went wrong. Try again.'); }
    finally { setBusy(null); }
  };
  const accept = () => run('accept', () => partnerApi.accept(order.id));
  const reject = (reason: string) => reason.trim() && run('reject', () => partnerApi.reject(order.id, reason.trim()));

  const cod = order.payment?.gateway === 'cod' && order.payment?.status !== 'paid';
  const addr = order.address;
  const phone = addr?.phone || order.customer?.mobile;
  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
  const waitSecs = (now - new Date(order.created_at).getTime()) / 1000;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center sm:p-4">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Ringing header */}
        <div className="bg-[#EA580C] text-white px-5 pt-5 pb-4 relative">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 shrink-0">
              <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
              <span className="relative w-12 h-12 rounded-full bg-white text-[#EA580C] flex items-center justify-center">
                <BellRing size={22} />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white/85 uppercase tracking-wide">
                New order{queue > 1 ? ` · 1 of ${queue}` : ''}
              </div>
              <div className="text-2xl font-bold leading-tight">#{order.id} · ₹{order.subtotal}</div>
            </div>
            <div className={`flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-full ${waitSecs > 300 ? 'bg-white text-red-600' : 'bg-white/20'}`}>
              <Clock size={14} /> {elapsed(order.created_at, now)}
            </div>
          </div>
          {waitSecs > 300 && <div className="mt-2 text-xs font-semibold bg-white/15 rounded-lg px-3 py-1.5">Waiting over 5 minutes — Jhatpats team has been alerted.</div>}
        </div>

        {!rejecting ? (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Items */}
              <div>
                <div className="text-xs font-semibold text-slate-500 mb-2">{itemCount} item{itemCount === 1 ? '' : 's'}</div>
                <div className="space-y-2">
                  {order.items.map(i => (
                    <div key={i.id} className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-lg bg-orange-50 text-[#EA580C] font-bold flex items-center justify-center shrink-0">{i.quantity}×</span>
                      <span className="flex-1 font-semibold text-slate-900 text-base">{i.itemName ?? 'Item'}</span>
                      <span className="text-slate-500 text-sm">₹{i.total}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-slate-200">
                  <span className="font-semibold text-slate-700">Food total</span>
                  <span className="text-lg font-bold text-slate-900">₹{order.subtotal}</span>
                </div>
                <div className={`mt-2 text-xs font-semibold rounded-lg px-3 py-2 ${cod ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-700'}`}>
                  {cod ? `Cash on delivery — rider collects ₹${order.total} from the customer` : 'Paid online'}
                </div>
              </div>

              {/* Customer */}
              <div className="rounded-xl bg-slate-50 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">{order.customer?.name ?? 'Customer'}</span>
                  {phone && (
                    <a href={`tel:${phone}`} className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1">
                      <Phone size={13} /> {phone}
                    </a>
                  )}
                </div>
                {addr && (
                  <div className="flex items-start gap-1.5 text-sm text-slate-500 mt-1.5">
                    <MapPin size={14} className="mt-0.5 shrink-0" />
                    <span>{[addr.line1, addr.line2, addr.city, addr.pincode].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>

              {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600"><AlertCircle size={15} />{error}</div>}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-slate-100 space-y-2">
              <button onClick={accept} disabled={!!busy}
                className="w-full h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-lg font-bold flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-green-600/25">
                {busy === 'accept' ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={22} />} Accept order
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setRejecting(true)} disabled={!!busy}
                  className="h-11 rounded-xl border border-slate-200 text-slate-700 font-semibold flex items-center justify-center gap-1.5 hover:border-red-300 hover:text-red-600 disabled:opacity-60">
                  <XCircle size={16} /> Reject
                </button>
                <button onClick={onLater} disabled={!!busy}
                  className="h-11 rounded-xl border border-slate-200 text-slate-500 font-semibold hover:bg-slate-50 disabled:opacity-60">
                  Decide later
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-5 space-y-3 overflow-y-auto">
            <button onClick={() => setRejecting(false)} className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800">
              <ArrowLeft size={15} /> Back
            </button>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Why can't you take order #{order.id}?</h3>
              <p className="text-sm text-slate-500">The customer is told the order was cancelled.</p>
            </div>
            <div className="space-y-2">
              {REJECT_REASONS.map(r => (
                <button key={r} onClick={() => reject(r)} disabled={!!busy}
                  className="w-full text-left px-4 h-12 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:border-[#EA580C] hover:bg-orange-50 disabled:opacity-60">
                  {r}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={other} onChange={e => setOther(e.target.value)} placeholder="Other reason…" maxLength={200}
                className="flex-1 h-12 px-4 rounded-xl border border-slate-200 outline-none focus:border-[#EA580C]" />
              <button onClick={() => reject(other)} disabled={!other.trim() || !!busy}
                className="px-4 h-12 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-50 flex items-center gap-1.5">
                {busy === 'reject' && <Loader2 size={15} className="animate-spin" />} Reject
              </button>
            </div>
            {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600"><AlertCircle size={15} />{error}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
