import React, { useState, useEffect } from 'react';
import { ShoppingBag, TrendingUp, Clock, Bike, Package, ArrowUp, Loader2, CalendarDays, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { rupees } from '../../lib/utils';
import { StatusBadge } from '../../components/common/StatusBadge';
import api from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';

interface DashboardData {
  kpis: { todayOrders: number; todayRevenue: number; totalCustomers: number; activeRiders: number };
  statusDist: { status: string; count: number }[];
  weeklyChart: { day: string; orders: number; revenue: number }[];
  recentOrders: { id: number; total: number; status: string; created_at: string; customer: { name: string }; store: { name: string } }[];
  topProducts: { id: number; name: string; totalQty: number; totalRevenue: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  delivered:        '#0F766E',
  out_for_delivery: '#EA580C',
  preparing:        '#8B5CF6',
  confirmed:        '#3B82F6',
  pending:          '#F59E0B',
  cancelled:        '#EF4444',
};

function KpiCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div
      className="rounded-2xl p-4 sm:p-5 border transition-shadow hover:shadow-sm min-w-0"
      style={{ background: `linear-gradient(155deg, ${color}17, ${color}08)`, borderColor: color + '2A' }}
    >
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + '22' }}>
          <Icon size={18} style={{ color }} />
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
          <ArrowUp size={12} /> Live
        </span>
      </div>
      <div className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</div>
      <div className="text-xs sm:text-sm font-medium text-slate-600 truncate">{label}</div>
    </div>
  );
}

const fmt = (d: Date) => d.toISOString().slice(0, 10);
const PRESETS = [
  { label: 'Today',      getDates: () => { const t = fmt(new Date()); return { from: t, to: t }; } },
  { label: 'Yesterday',  getDates: () => { const d = new Date(); d.setDate(d.getDate()-1); const t = fmt(d); return { from: t, to: t }; } },
  { label: 'Last 7 days',getDates: () => { const d = new Date(); d.setDate(d.getDate()-6); return { from: fmt(d), to: fmt(new Date()) }; } },
  { label: 'Last 30 days',getDates: () => { const d = new Date(); d.setDate(d.getDate()-29); return { from: fmt(d), to: fmt(new Date()) }; } },
  { label: 'This month', getDates: () => { const d = new Date(); return { from: fmt(new Date(d.getFullYear(),d.getMonth(),1)), to: fmt(d) }; } },
];

export function DashboardPage() {
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom]       = useState('');
  const [to, setTo]           = useState('');
  const [activePreset, setActivePreset] = useState<string>('Today');
  const userName = useAuthStore(s => s.user?.name?.split(' ')[0] ?? 'Admin');

  const fetchData = (fromDate = '', toDate = '') => {
    setLoading(true);
    const params = fromDate && toDate ? `?from=${fromDate}&to=${toDate}` : '';
    api.get(`/api/admin/dashboard${params}`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const preset = PRESETS.find(p => p.label === 'Today')!;
    const { from: f, to: t } = preset.getDates();
    setFrom(f); setTo(t);
    fetchData(f, t);
  }, []);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    const { from: f, to: t } = preset.getDates();
    setFrom(f); setTo(t); setActivePreset(preset.label);
    fetchData(f, t);
  };

  const applyCustom = () => {
    if (from && to) { setActivePreset('Custom'); fetchData(from, to); }
  };

  const clearFilter = () => {
    setActivePreset('Today');
    const preset = PRESETS.find(p => p.label === 'Today')!;
    const { from: f, to: t } = preset.getDates();
    setFrom(f); setTo(t);
    fetchData(f, t);
  };

  const periodLabel = activePreset || (from && to ? `${from} → ${to}` : 'Today');
  const kpiOrderLabel   = `Orders (${periodLabel})`;
  const kpiRevenueLabel = `Revenue (${periodLabel})`;
  const chartTitle = `Orders — ${periodLabel}`;

  const pieData = data?.statusDist.map(s => ({ name: s.status.replace(/_/g, ' '), value: s.count, color: STATUS_COLORS[s.status] ?? '#94A3B8' })) ?? [];

  const kpis = data?.kpis;

  return (
    <div className="space-y-4 sm:space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {userName} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Here's what's happening today</p>
        </div>
        <div className="self-start sm:self-auto flex items-center gap-2 text-xs sm:text-sm text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-1.5 sm:py-2 whitespace-nowrap">
          {loading ? <Loader2 size={12} className="animate-spin shrink-0 text-orange-500" /> : <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />}
          {periodLabel === 'Today'
            ? `Live · Today, ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`
            : from && to && from === to ? from : from && to ? `${from} → ${to}` : periodLabel}
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <CalendarDays size={15} className="text-slate-400 shrink-0" />
          <span className="text-xs font-medium text-slate-500 mr-1">Filter:</span>
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${activePreset === p.label ? 'bg-[#EA580C] text-white' : 'bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-[#EA580C]'}`}>
              {p.label}
            </button>
          ))}
          <div className="flex items-center gap-1.5 ml-auto">
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#EA580C]" />
            <span className="text-slate-400 text-xs">to</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#EA580C]" />
            <button onClick={applyCustom} disabled={!from || !to}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-[#EA580C] text-white disabled:opacity-40 hover:bg-orange-600 transition-colors">
              Apply
            </button>
            {(activePreset || (from && to)) && (
              <button onClick={clearFilter} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 transition-opacity ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <KpiCard label={kpiOrderLabel}   value={String(kpis?.todayOrders ?? 0)}    icon={ShoppingBag} color="#EA580C" />
        <KpiCard label={kpiRevenueLabel} value={rupees(kpis?.todayRevenue ?? 0)}   icon={TrendingUp}  color="#0F766E" />
        <KpiCard label="Total Customers" value={String(kpis?.totalCustomers ?? 0)} icon={Package}     color="#8B5CF6" />
        <KpiCard label="Active Riders"   value={String(kpis?.activeRiders ?? 0)}   icon={Bike}        color="#F59E0B" />
      </div>

      {/* Charts row */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 transition-opacity ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 min-w-0">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-slate-900">{chartTitle}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Daily order volume</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-3 h-0.5 bg-[#EA580C] inline-block rounded" /> Orders
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data?.weeklyChart ?? []} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis width={32} allowDecimals={false} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
              <Line type="monotone" dataKey="orders" stroke="#EA580C" strokeWidth={2.5} dot={{ fill: '#EA580C', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 min-w-0">
          <h3 className="font-semibold text-slate-900 mb-1">Order Status</h3>
          <p className="text-xs text-slate-400 mb-4">Today's distribution</p>
          {pieData.length === 0 ? (
            <div className="h-36 flex items-center justify-center text-slate-300 text-sm">No orders today</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-600 capitalize">
                      <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />{d.name}
                    </span>
                    <span className="font-semibold text-slate-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className={`grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4 transition-opacity ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 overflow-hidden min-w-0">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-50">
            <h3 className="font-semibold text-slate-900">Recent Orders</h3>
            <span className="text-xs text-slate-400">{data?.recentOrders.length ?? 0} latest</span>
          </div>
          {!data?.recentOrders.length ? (
            <div className="py-10 text-center text-slate-300 text-sm">No orders yet</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {data.recentOrders.map(order => (
                <div key={order.id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 hover:bg-slate-50/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                    <ShoppingBag size={14} className="text-[#EA580C]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">#{order.id}</span>
                    </div>
                    <div className="text-xs text-slate-500 truncate">{order.customer?.name} · {order.store?.name}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-slate-800">{rupees(order.total)}</div>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden min-w-0">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-50">
            <h3 className="font-semibold text-slate-900">Top Products</h3>
            <Package size={16} className="text-slate-400" />
          </div>
          {!data?.topProducts.length ? (
            <div className="py-10 text-center text-slate-300 text-sm">No data yet</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {data.topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                  <span className="w-6 shrink-0 text-xs font-bold text-slate-400">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{p.name}</div>
                    <div className="text-xs text-slate-400">{p.totalQty} orders</div>
                  </div>
                  <span className="text-sm font-semibold text-[#0F766E] shrink-0">{rupees(p.totalRevenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
