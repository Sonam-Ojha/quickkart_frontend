import React, { useState } from 'react';
import { Download, TrendingUp, ShoppingBag, Package, Store } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/ui/button';

export function ReportsPage() {
  const [dateRange, setDateRange] = useState('this_month');

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Business performance overview"
        breadcrumbs={[{ label: 'Home' }, { label: 'Reports' }]}
        action={
          <Button variant="outline" size="sm">
            <Download size={14} /> Export CSV
          </Button>
        }
      />

      {/* Date range */}
      <div className="flex gap-2 mb-6">
        {[
          { value: 'today',        label: 'Today' },
          { value: 'this_week',    label: 'This Week' },
          { value: 'this_month',   label: 'This Month' },
          { value: 'last_3_months',label: 'Last 3 Months' },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setDateRange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              dateRange === opt.value ? 'bg-[#EA580C] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Revenue" value="—" icon={TrendingUp} color="#EA580C" />
        <StatCard label="Total Orders" value="—" icon={ShoppingBag} color="#0F766E" />
        <StatCard label="Top Product" value="—" icon={Package} color="#8B5CF6" />
        <StatCard label="Best Store" value="—" icon={Store} color="#F59E0B" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <h3 className="font-semibold text-slate-900 mb-4">Revenue Trend</h3>
          <div className="h-[220px] flex items-center justify-center text-slate-300 text-sm border-2 border-dashed border-slate-100 rounded-xl">
            No data yet
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <h3 className="font-semibold text-slate-900 mb-4">Store Performance</h3>
          <div className="h-[220px] flex items-center justify-center text-slate-300 text-sm border-2 border-dashed border-slate-100 rounded-xl">
            No data yet
          </div>
        </div>
      </div>
    </div>
  );
}
