import { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { partnerApi, Earnings, EarningsPeriod } from './api';

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

function PeriodCard({ title, p, pct, highlight }: { title: string; p: EarningsPeriod; pct: number; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? 'bg-orange-50 border-orange-100' : 'bg-white border-slate-200'}`}>
      <div className="flex items-baseline justify-between">
        <h3 className="font-bold text-slate-900">{title}</h3>
        <span className="text-xs text-slate-500">{p.orders} order{p.orders === 1 ? '' : 's'} delivered</span>
      </div>
      <div className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between"><span className="text-slate-600">Food sales</span><span className="font-semibold">{rupees(p.sales)}</span></div>
        <div className="flex justify-between"><span className="text-slate-600">Jhatpats commission ({pct}%)</span><span className="font-semibold text-red-600">− {rupees(p.commission)}</span></div>
        <div className="flex justify-between pt-1.5 border-t border-slate-200">
          <span className="font-bold text-slate-900">You get</span><span className="font-bold text-[#15803D] text-base">{rupees(p.payout)}</span>
        </div>
      </div>
    </div>
  );
}

/** Delivered-order totals for today / this week / this month (IST). */
export function PartnerEarningsPage() {
  const [data, setData]   = useState<Earnings | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    partnerApi.earnings().then(setData).catch(err => setError(err?.response?.data?.message ?? 'Could not load earnings'));
  }, []);

  if (error) return <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600"><AlertCircle size={15} />{error}</div>;
  if (!data) return <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin mr-2" /> Loading...</div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Only delivered orders count. Delivery and handling charges are Jhatpats'. For charts, see the Dashboard.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PeriodCard title="Today" p={data.today} pct={data.commissionPct} highlight />
        <PeriodCard title="This week" p={data.week} pct={data.commissionPct} />
        <PeriodCard title="This month" p={data.month} pct={data.commissionPct} />
      </div>
      {data.cancelledThisMonth > 0 && (
        <p className="text-xs text-slate-500">{data.cancelledThisMonth} order{data.cancelledThisMonth === 1 ? ' was' : 's were'} cancelled this month.</p>
      )}
    </div>
  );
}
