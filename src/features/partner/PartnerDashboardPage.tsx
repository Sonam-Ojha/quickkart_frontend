import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, PieChart, Pie, Cell, LabelList,
} from 'recharts';
import {
  IndianRupee, ShoppingBag, Wallet, Receipt, Timer, ChefHat, ThumbsUp, Users,
  TrendingUp, TrendingDown, Minus, XCircle, Loader2, AlertCircle, BellRing, Bike, ArrowRight, RefreshCw,
} from 'lucide-react';
import { partnerApi, PartnerDashboard, DashSummary } from './api';
import { ORDERS_CHANGED } from './NewOrderModal';

const ORANGE = '#EA580C';
const TEAL = '#0F766E';
const RANGES = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
];
const STATUS_META: { key: keyof PartnerDashboard['status']; label: string; color: string }[] = [
  { key: 'delivered', label: 'Delivered',  color: '#16A34A' },
  { key: 'onTheWay',  label: 'On the way', color: '#0EA5E9' },
  { key: 'preparing', label: 'Preparing',  color: '#F59E0B' },
  { key: 'new',       label: 'New',        color: ORANGE },
  { key: 'cancelled', label: 'Cancelled',  color: '#94A3B8' },
];
const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  pending:          { label: 'New',        cls: 'bg-orange-50 text-orange-700' },
  confirmed:        { label: 'Accepted',   cls: 'bg-amber-50 text-amber-700' },
  preparing:        { label: 'Preparing',  cls: 'bg-amber-50 text-amber-700' },
  out_for_delivery: { label: 'On the way', cls: 'bg-sky-50 text-sky-700' },
  delivered:        { label: 'Delivered',  cls: 'bg-green-50 text-green-700' },
  cancelled:        { label: 'Cancelled',  cls: 'bg-slate-100 text-slate-500' },
};

const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const shortDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const hourLabel = (h: number) => `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`;
const ago = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${Math.max(m, 0)} min ago`;
  if (m < 1440) return `${Math.floor(m / 60)} hr ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

/** Restaurant home: live orders, money, charts — all from real orders. */
export function PartnerDashboardPage() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<PartnerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try { setData(await partnerApi.dashboard(days)); setError(''); }
    catch (e: any) { if (!quiet) setError(e?.response?.data?.message ?? 'Could not load the dashboard. Check your internet.'); }
    finally { if (!quiet) setLoading(false); }
  }, [days]);

  useEffect(() => { load(); }, [load]);
  // Accept/reject from the new-order pop-up → reload this page too
  useEffect(() => {
    const on = () => load(true);
    window.addEventListener(ORDERS_CHANGED, on);
    return () => window.removeEventListener(ORDERS_CHANGED, on);
  }, [load]);
  useEffect(() => { const t = setInterval(() => load(true), 30_000); return () => clearInterval(t); }, [load]);

  if (loading && !data) return <div className="flex items-center justify-center py-24 text-slate-400"><Loader2 size={22} className="animate-spin mr-2" /> Loading dashboard…</div>;
  if (error && !data) return <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600"><AlertCircle size={15} />{error}</div>;
  if (!data) return null;

  const cur = data.current, prev = data.previous;
  const rangeLabel = days === 7 ? 'last 7 days' : days === 30 ? 'last 30 days' : 'last 90 days';
  const hasOrders = cur.orders > 0;

  return (
    <div className="space-y-5">
      {/* Live strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <LiveCard to="/partner/orders" icon={BellRing} label="New orders — accept now" value={data.live.new} urgent={data.live.new > 0} />
        <LiveCard to="/partner/orders" icon={ChefHat} label="Being prepared" value={data.live.preparing} />
        <LiveCard to="/partner/orders" icon={Bike} label="On the way to customer" value={data.live.onTheWay} />
      </div>

      {/* Today */}
      <div>
        <h2 className="font-bold text-slate-900 text-lg mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Today</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <TodayCard icon={Wallet} label="You earn today" value={rupees(data.today.payout)} hint={`After ${data.commissionPct}% commission`} accent />
          <TodayCard icon={IndianRupee} label="Food sales" value={rupees(data.today.sales)} hint="Delivered orders only" />
          <TodayCard icon={ShoppingBag} label="Orders" value={String(data.today.orders)} hint={`${data.today.delivered} delivered`} />
          <TodayCard icon={XCircle} label="Cancelled" value={String(data.today.cancelled)} hint={data.today.rejected ? `${data.today.rejected} rejected by you` : 'Keep this at 0'} />
        </div>
      </div>

      {/* Range picker */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-900 text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>How you're doing</h2>
          <p className="text-xs text-slate-500">Compared with the {days} days before</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load()} title="Refresh" className="p-2 rounded-lg text-slate-500 hover:bg-white border border-transparent hover:border-slate-200">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="flex bg-white border border-slate-200 rounded-xl p-1">
            {RANGES.map(r => (
              <button key={r.days} onClick={() => setDays(r.days)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${days === r.days ? 'bg-[#EA580C] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={IndianRupee} label="Food sales" value={rupees(cur.sales)} now={cur.sales} before={prev.sales} hint="Delivered orders only" />
        <Kpi icon={Wallet} label="You earn" value={rupees(cur.payout)} now={cur.payout} before={prev.payout} hint={`After ${data.commissionPct}% commission (${rupees(cur.commission)})`} accent />
        <Kpi icon={ShoppingBag} label="Orders" value={String(cur.orders)} now={cur.orders} before={prev.orders} hint={`${cur.delivered} delivered · ${cur.cancelled} cancelled`} />
        <Kpi icon={Receipt} label="Average order" value={rupees(cur.avgOrderValue)} now={cur.avgOrderValue} before={prev.avgOrderValue} hint="Food amount per delivered order" />
        <Kpi icon={Timer} label="Time to accept" value={cur.avgAcceptMins == null ? '—' : `${cur.avgAcceptMins} min`} now={cur.avgAcceptMins} before={prev.avgAcceptMins} lowerIsBetter hint="Faster = more orders" />
        <Kpi icon={ChefHat} label="Cooking time" value={cur.avgPrepMins == null ? '—' : `${cur.avgPrepMins} min`} now={cur.avgPrepMins} before={prev.avgPrepMins} lowerIsBetter hint="Accept → food ready" />
        <Kpi icon={ThumbsUp} label="Orders accepted" value={cur.acceptRate == null ? '—' : `${cur.acceptRate}%`} now={cur.acceptRate} before={prev.acceptRate} hint={`${cur.rejected} rejected by you`} />
        <Kpi icon={Users} label="Customers" value={String(cur.customers)} now={cur.customers} before={prev.customers} hint={`${cur.repeatCustomers} ordered more than once`} />
      </div>

      {/* Sales chart + status */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel title="Sales & orders" sub={`Day by day, ${rangeLabel}`} className="xl:col-span-2">
          <div className="flex gap-4 text-xs text-slate-500 mb-2">
            <Legend color={ORANGE} label="Orders" square />
            <Legend color={TEAL} label="Food sales (₹)" />
          </div>
          <div className="flex-1 min-h-[18rem]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.daily} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} minTickGap={16} />
                <YAxis yAxisId="o" allowDecimals={false} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={36} />
                <YAxis yAxisId="s" orientation="right" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={48} tickFormatter={v => `₹${v >= 1000 ? `${Math.round(v / 100) / 10}k` : v}`} />
                <Tooltip
                  cursor={{ fill: '#FFF7ED' }}
                  labelFormatter={(d) => shortDate(String(d))}
                  formatter={(v, name) => (name === 'sales' ? [rupees(Number(v)), 'Food sales'] : [v, name === 'orders' ? 'Orders' : 'Cancelled'])}
                  contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }}
                />
                <Bar yAxisId="o" dataKey="orders" fill={ORANGE} radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Line yAxisId="s" type="monotone" dataKey="sales" stroke={TEAL} strokeWidth={2.5} dot={days <= 30 ? { r: 3, fill: TEAL } : false} activeDot={{ r: 5 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="What happened to orders" sub={rangeLabel}>
          {hasOrders ? (
            <div className="flex flex-col items-center">
              <div className="relative w-[180px] h-[180px]">
                <PieChart width={180} height={180}>
                  <Pie data={STATUS_META.map(s => ({ name: s.label, value: data.status[s.key], color: s.color })).filter(x => x.value > 0)}
                    dataKey="value" cx="50%" cy="50%" innerRadius={62} outerRadius={86} paddingAngle={2}
                    startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
                    {STATUS_META.filter(s => data.status[s.key] > 0).map(s => <Cell key={s.key} fill={s.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-3xl font-bold text-slate-900 leading-none">{cur.orders}</div>
                  <div className="text-xs text-slate-500 mt-1">orders</div>
                </div>
              </div>
              <div className="w-full space-y-2.5 mt-5">
                {STATUS_META.map(s => {
                  const n = data.status[s.key];
                  const pctOf = cur.orders ? Math.round((n / cur.orders) * 100) : 0;
                  return (
                    <div key={s.key} className={n === 0 ? 'opacity-45' : ''}>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                        <span className="flex-1 text-slate-600">{s.label}</span>
                        <span className="text-xs text-slate-400 w-10 text-right">{pctOf}%</span>
                        <span className="font-semibold text-slate-900 w-6 text-right">{n}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1 ml-[18px]">
                        <div className="h-full rounded-full" style={{ width: `${pctOf}%`, background: s.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : <Empty text="No orders in this period yet" />}
        </Panel>
      </div>

      {/* Busy hours + top items */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel title="Busy hours" sub={`When customers order, ${rangeLabel}`}>
          {hasOrders ? <BusyHours hourly={data.hourly} total={cur.orders} /> : <Empty text="Busy hours show once orders come in" />}
        </Panel>

        <Panel title="Best-selling dishes" sub={rangeLabel}
          action={<Link to="/partner/menu" className="text-xs font-semibold text-[#EA580C] bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg">Edit menu</Link>}>
          {data.topItems.length ? (
            <div className="flex-1 flex flex-col">
              <div className="space-y-4">
                {data.topItems.map((it, i) => {
                  const max = data.topItems[0].qty || 1;
                  return (
                    <div key={it.name} className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center shrink-0 ${
                        i === 0 ? 'bg-[#EA580C] text-white' : 'bg-orange-50 text-[#EA580C]'}`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 text-sm">
                          <span className="flex-1 font-semibold text-slate-800 truncate">{it.name}</span>
                          <span className="font-bold text-slate-900">{it.qty} sold</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-[#FDBA74] to-[#EA580C]" style={{ width: `${(it.qty / max) * 100}%` }} />
                          </div>
                          <span className="text-xs text-slate-500 w-16 text-right">{rupees(it.sales)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-auto pt-5">
                <div className="grid grid-cols-2 gap-3">
                  <MiniStat label="Plates sold" value={String(data.topItems.reduce((n, x) => n + x.qty, 0))} />
                  <MiniStat label="Different dishes ordered" value={String(data.topItems.length)} />
                </div>
                {data.topItems.length < 3 && (
                  <p className="text-xs text-slate-400 mt-3">Tip: add clear photos and short descriptions to your dishes — customers order more of what they can see.</p>
                )}
              </div>
            </div>
          ) : <Empty text="Your top dishes show once orders come in" />}
        </Panel>
      </div>

      {/* Recent orders */}
      <Panel title="Latest orders" sub={rangeLabel}
        action={<Link to="/partner/orders" className="text-xs font-semibold text-[#EA580C] hover:underline flex items-center gap-1">All orders <ArrowRight size={12} /></Link>}>
        {data.recent.length ? (
          <div className="divide-y divide-slate-100 -mx-1">
            {data.recent.map(o => (
              <div key={o.id} className="flex items-center gap-3 px-1 py-2.5 text-sm">
                <span className="font-bold text-slate-900 w-12 sm:w-14 shrink-0">#{o.id}</span>
                <span className="flex-1 text-slate-600 truncate">{o.items}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ORDER_STATUS[o.status]?.cls}`}>{ORDER_STATUS[o.status]?.label}</span>
                <span className="font-semibold text-slate-900 w-16 sm:w-20 text-right shrink-0">{rupees(o.subtotal)}</span>
                <span className="text-xs text-slate-400 w-20 text-right hidden sm:block">{ago(o.created_at)}</span>
              </div>
            ))}
          </div>
        ) : <Empty text="No orders in this period yet" />}
      </Panel>
    </div>
  );
}

function LiveCard({ to, icon: Icon, label, value, urgent }: { to: string; icon: React.ElementType; label: string; value: number; urgent?: boolean }) {
  return (
    <Link to={to} className={`group flex items-center gap-4 rounded-2xl p-4 border transition-all hover:shadow-md ${
      urgent ? 'bg-[#EA580C] border-[#EA580C] text-white' : 'bg-white border-slate-200'}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${urgent ? 'bg-white/20' : 'bg-orange-50 text-[#EA580C]'}`}>
        <Icon size={20} className={urgent ? 'animate-pulse' : ''} />
      </div>
      <div className="flex-1">
        <div className={`text-2xl font-bold leading-none ${urgent ? '' : 'text-slate-900'}`}>{value}</div>
        <div className={`text-xs mt-1 ${urgent ? 'text-white/90' : 'text-slate-500'}`}>{label}</div>
      </div>
      <ArrowRight size={16} className={`transition-transform group-hover:translate-x-0.5 ${urgent ? '' : 'text-slate-300'}`} />
    </Link>
  );
}

function TodayCard({ icon: Icon, label, value, hint, accent }: { icon: React.ElementType; label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${accent ? 'bg-[#EA580C] text-white' : 'bg-slate-100 text-slate-600'}`}><Icon size={15} /></div>
      <div className="text-xl sm:text-2xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</div>
      <div className="text-sm font-medium text-slate-700">{label}</div>
      {hint && <div className="text-[11px] text-slate-400 mt-0.5">{hint}</div>}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, now, before, hint, accent, lowerIsBetter }: {
  icon: React.ElementType; label: string; value: string; now: number | null; before: number | null;
  hint?: string; accent?: boolean; lowerIsBetter?: boolean;
}) {
  let trend: React.ReactNode = null;
  if (now != null && before != null && (now !== 0 || before !== 0)) {
    const diff = before === 0 ? null : Math.round(((now - before) / before) * 100);
    const up = now > before;
    const good = now === before ? null : lowerIsBetter ? !up : up;
    const T = now === before ? Minus : up ? TrendingUp : TrendingDown;
    trend = (
      <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
        good == null ? 'bg-slate-100 text-slate-500' : good ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
        <T size={11} />{diff == null ? 'new' : `${Math.abs(diff)}%`}
      </span>
    );
  }
  return (
    <div className={`rounded-2xl border p-4 ${accent ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent ? 'bg-[#EA580C] text-white' : 'bg-slate-100 text-slate-600'}`}><Icon size={15} /></div>
        {trend}
      </div>
      <div className="text-xl sm:text-2xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</div>
      <div className="text-sm font-medium text-slate-700">{label}</div>
      {hint && <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{hint}</div>}
    </div>
  );
}

function Panel({ title, sub, action, className = '', children }: { title: string; sub?: string; action?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-5 flex flex-col ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-slate-900">{title}</h3>
          {sub && <p className="text-xs text-slate-400 capitalize-first">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Legend({ color, label, square }: { color: string; label: string; square?: boolean }) {
  return <span className="flex items-center gap-1.5"><span className={square ? 'w-3 h-3 rounded-sm' : 'w-3 h-0.5 rounded'} style={{ background: color }} />{label}</span>;
}

function Empty({ text }: { text: string }) {
  return <div className="h-40 flex items-center justify-center text-sm text-slate-400 text-center">{text}</div>;
}

// Hours grouped the way a kitchen thinks about the day.
const DAY_PARTS = [
  { label: 'Breakfast',  time: '6–11am',  hours: [6, 7, 8, 9, 10] },
  { label: 'Lunch',      time: '11am–3pm', hours: [11, 12, 13, 14] },
  { label: 'Evening',    time: '3–7pm',   hours: [15, 16, 17, 18] },
  { label: 'Dinner',     time: '7–11pm',  hours: [19, 20, 21, 22] },
  { label: 'Late night', time: '11pm–6am', hours: [23, 0, 1, 2, 3, 4, 5] },
];

function BusyHours({ hourly, total }: { hourly: PartnerDashboard['hourly']; total: number }) {
  const parts = DAY_PARTS.map(p => ({ ...p, orders: p.hours.reduce((n, h) => n + (hourly[h]?.orders ?? 0), 0) }));
  const max = Math.max(...parts.map(p => p.orders));
  const peak = parts.find(p => p.orders === max)!;
  const peakHour = hourly.reduce((a, b) => (b.orders > a.orders ? b : a), hourly[0]);
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-3 rounded-xl bg-orange-50 border border-orange-100 px-4 py-3 mb-4">
        <Timer size={18} className="text-[#EA580C] shrink-0" />
        <p className="text-sm text-slate-700">
          Busiest: <b className="text-slate-900">{peak.label} ({peak.time})</b> — {peak.orders} of {total} orders.
          {peakHour.orders > 0 && <> Peak hour <b className="text-slate-900">{hourLabel(peakHour.hour)}–{hourLabel((peakHour.hour + 1) % 24)}</b>. Keep the kitchen ready then.</>}
        </p>
      </div>
      <div className="flex-1 min-h-[13rem]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={parts} margin={{ top: 22, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="label" interval={0} axisLine={false} tickLine={false}
              tick={({ x, y, payload }) => {
                const p = parts.find(d => d.label === payload.value);
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text dy={12} textAnchor="middle" fontSize={12} fontWeight={600} fill="#334155">{payload.value}</text>
                    <text dy={27} textAnchor="middle" fontSize={10} fill="#94A3B8">{p?.time}</text>
                  </g>
                );
              }}
              height={40} />
            <YAxis hide allowDecimals={false} domain={[0, (dataMax: number) => Math.max(dataMax, 1)]} />
            <Tooltip cursor={{ fill: '#FFF7ED' }} formatter={(v) => [v, 'Orders']}
              contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
            <Bar dataKey="orders" radius={[8, 8, 0, 0]} maxBarSize={64} minPointSize={3}>
              {parts.map(p => <Cell key={p.label} fill={p.orders > 0 && p.orders === max ? ORANGE : p.orders > 0 ? '#FDBA74' : '#E2E8F0'} />)}
              <LabelList dataKey="orders" position="top" fontSize={12} fontWeight={700} fill="#0F172A" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
      <div className="text-xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
