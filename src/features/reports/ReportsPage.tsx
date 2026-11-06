import { useState, useEffect } from 'react';
import { Download, TrendingUp, ShoppingBag, Package, Store, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/ui/button';
import { rupees } from '../../lib/utils';
import api from '../../lib/api';

interface ReportData {
  kpis: { todayOrders: number; todayRevenue: number; totalCustomers: number; activeRiders: number };
  weeklyChart: { day: string; orders: number; revenue: number }[];
  topProducts: { id: number; name: string; totalQty: number; totalRevenue: number }[];
  statusDist: { status: string; count: number }[];
}

const PRESETS = [
  { value: 'today',     label: 'Today',      days: 0 },
  { value: 'week',      label: 'This Week',  days: 6 },
  { value: 'month',     label: 'This Month', days: 29 },
  { value: '3months',   label: 'Last 3 Months', days: 89 },
];

const fmt = (d: Date) => d.toISOString().slice(0, 10);

export function ReportsPage() {
  const [preset, setPreset]   = useState('month');
  const [data, setData]       = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const p = PRESETS.find(x => x.value === preset)!;
    const to   = fmt(new Date());
    const from = fmt(new Date(Date.now() - p.days * 86400000));
    setLoading(true);
    api.get(`/api/admin/dashboard?from=${from}&to=${to}`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [preset]);

  const handleExport = () => {
    if (!data) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Revenue', data.kpis.todayRevenue],
      ['Total Orders', data.kpis.todayOrders],
      ['Total Customers', data.kpis.totalCustomers],
      ['Active Riders', data.kpis.activeRiders],
      [],
      ['Day', 'Orders', 'Revenue'],
      ...data.weeklyChart.map(r => [r.day, r.orders, r.revenue]),
      [],
      ['Product', 'Qty Sold', 'Revenue'],
      ...data.topProducts.map(p => [p.name, p.totalQty, p.totalRevenue]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `jhatpats-report-${preset}.csv`;
    a.click();
  };

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Business performance overview"
        breadcrumbs={[{ label: 'Home' }, { label: 'Reports' }]}
        action={
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!data}>
            <Download size={14} /> Export CSV
          </Button>
        }
      />

      {/* Date range */}
      <div className="flex gap-2 mb-5 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 sm:flex-wrap">
        {PRESETS.map(p => (
          <button key={p.value} onClick={() => setPreset(p.value)}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              preset === p.value ? 'bg-[#EA580C] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-200'
            }`}>
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : !data ? (
        <div className="text-center py-20 text-slate-400">Failed to load data</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatCard label="Total Revenue"    value={rupees(data.kpis.todayRevenue)}  icon={TrendingUp} color="#EA580C" />
            <StatCard label="Total Orders"     value={String(data.kpis.todayOrders)}   icon={ShoppingBag} color="#0F766E" />
            <StatCard label="Total Customers"  value={String(data.kpis.totalCustomers)} icon={Store} color="#8B5CF6" />
            <StatCard label="Active Riders"    value={String(data.kpis.activeRiders)}  icon={Package} color="#F59E0B" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Revenue Trend */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-4">Revenue Trend</h3>
              {data.weeklyChart.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-slate-300 text-sm border-2 border-dashed border-slate-100 rounded-xl">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.weeklyChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v}`} />
                    <Tooltip formatter={(v) => rupees(Number(v))} />
                    <Line type="monotone" dataKey="revenue" stroke="#EA580C" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Orders Chart */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-4">Orders Per Day</h3>
              {data.weeklyChart.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-slate-300 text-sm border-2 border-dashed border-slate-100 rounded-xl">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.weeklyChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#0F766E" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50">
              <h3 className="font-semibold text-slate-900">Top Products</h3>
            </div>
            {data.topProducts.length === 0 ? (
              <div className="py-12 text-center text-slate-300 text-sm">No orders in this period</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Product</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Qty Sold</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.topProducts.map((p, i) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5 flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center shrink-0">{i+1}</span>
                        <span className="font-medium text-slate-800">{p.name}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-600">{p.totalQty}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-slate-800">{rupees(p.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
