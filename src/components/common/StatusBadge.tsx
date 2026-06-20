import { cn } from '../../lib/utils';

type Status =
  | 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'
  | 'active' | 'inactive' | 'blocked'
  | 'paid' | 'failed' | 'refunded'
  | 'open' | 'resolved' | 'in_progress'
  | string;

const statusMap: Record<string, { label: string; className: string }> = {
  pending:          { label: 'Pending',          className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  confirmed:        { label: 'Confirmed',        className: 'bg-blue-50 text-blue-700 border-blue-200' },
  preparing:        { label: 'Preparing',        className: 'bg-purple-50 text-purple-700 border-purple-200' },
  out_for_delivery: { label: 'Out for Delivery', className: 'bg-orange-50 text-[#EA580C] border-orange-200' },
  delivered:        { label: 'Delivered',        className: 'bg-green-50 text-green-700 border-green-200' },
  cancelled:        { label: 'Cancelled',        className: 'bg-red-50 text-red-700 border-red-200' },
  active:           { label: 'Active',           className: 'bg-green-50 text-green-700 border-green-200' },
  inactive:         { label: 'Inactive',         className: 'bg-slate-100 text-slate-600 border-slate-200' },
  blocked:          { label: 'Blocked',          className: 'bg-red-50 text-red-700 border-red-200' },
  paid:             { label: 'Paid',             className: 'bg-green-50 text-green-700 border-green-200' },
  failed:           { label: 'Failed',           className: 'bg-red-50 text-red-700 border-red-200' },
  refunded:         { label: 'Refunded',         className: 'bg-teal-50 text-[#0F766E] border-teal-200' },
  open:             { label: 'Open',             className: 'bg-blue-50 text-blue-700 border-blue-200' },
  resolved:         { label: 'Resolved',         className: 'bg-green-50 text-green-700 border-green-200' },
  in_progress:      { label: 'In Progress',      className: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export function StatusBadge({ status }: { status: Status }) {
  const cfg = statusMap[status] ?? { label: status, className: 'bg-slate-100 text-slate-600 border-slate-200' };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', cfg.className)}>
      {cfg.label}
    </span>
  );
}
