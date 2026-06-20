import React, { useState, useEffect } from 'react';
import { ShoppingBag, TrendingUp, Clock, Bike, Package, ArrowUp, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { money } from '../../lib/utils';
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
    <div className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-slate-200 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + '15' }}>
          <Icon size={18} style={{ color }} />
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
          <ArrowUp size={12} /> Live
        </span>
      </div>
      <div className="text-2xl font-bold text-slate-900 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );
}

export function DashboardPage() {
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const userName = useAuthStore(s => s.user?.name?.split(' ')[0] ?? 'Admin');

  useEffect(() => {
    api.get('/api/admin/dashboard')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pieData = data?.statusDist.map(s => ({ name: s.status.replace(/_/g, ' '), value: s.count, color: STATUS_COLORS[s.status] ?? '#94A3B8' })) ?? [];

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <Loader2 size={28} className="animate-spin mr-3" /> Loading dashboard...
    </div>
  );

  const kpis = data?.kpis;
  const avgDelivery = 18;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {userName} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Here's what's happening today</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live · Today, {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Orders Today"   value={String(kpis?.todayOrders ?? 0)}       icon={ShoppingBag} color="#EA580C" />
        <KpiCard label="Revenue Today"  value={money(kpis?.todayRevenue ?? 0)}        icon={TrendingUp}  color="#0F766E" />
        <KpiCard label="Total Customers" value={String(kpis?.totalCustomers ?? 0)}    icon={Package}     color="#8B5CF6" />
        <KpiCard label="Active Riders"  value={String(kpis?.activeRiders ?? 0)}       icon={Bike}        color="#F59E0B" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-slate-900">Orders this week</h3>
              <p className="text-xs text-slate-400 mt-0.5">Daily order volume</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-3 h-0.5 bg-[#EA580C] inline-block rounded" /> Orders
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data?.weeklyChart ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
              <Line type="monotone" dataKey="orders" stroke="#EA580C" strokeWidth={2.5} dot={{ fill: '#EA580C', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100">
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
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <h3 className="font-semibold text-slate-900">Recent Orders</h3>
            <span className="text-xs text-slate-400">{data?.recentOrders.length ?? 0} latest</span>
          </div>
          {!data?.recentOrders.length ? (
            <div className="py-10 text-center text-slate-300 text-sm">No orders yet</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {data.recentOrders.map(order => (
                <div key={order.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/50 transition-colors">
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
                    <div className="text-sm font-semibold text-slate-800">{money(order.total)}</div>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <h3 className="font-semibold text-slate-900">Top Products</h3>
            <Package size={16} className="text-slate-400" />
          </div>
          {!data?.topProducts.length ? (
            <div className="py-10 text-center text-slate-300 text-sm">No data yet</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {data.topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-5 text-xs font-bold text-slate-400">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{p.name}</div>
                    <div className="text-xs text-slate-400">{p.totalQty} orders</div>
                  </div>
                  <span className="text-sm font-semibold text-[#0F766E] shrink-0">{money(p.totalRevenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
