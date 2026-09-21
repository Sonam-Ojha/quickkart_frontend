import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, color, className }: StatCardProps) {
  return (
    <div
      className={`rounded-2xl p-4 border transition-shadow hover:shadow-sm ${className ?? ''}`}
      style={{ background: `linear-gradient(155deg, ${color}17, ${color}08)`, borderColor: color + '2A' }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: color + '22' }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</div>
      <div className="text-xs font-medium text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}
