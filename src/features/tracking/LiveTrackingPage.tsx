import React, { useEffect, useState, useCallback } from 'react';
import { MapPin, Bike, RefreshCw, Circle, Package } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import api from '../../lib/api';

interface RiderLocation {
  id: number;
  name: string;
  mobile: string;
  isOnline: boolean;
  currentLat: number | null;
  currentLng: number | null;
  locationUpdatedAt: string | null;
  status: string;
  activeOrder?: { id: number; status: string; total: number } | null;
}

function StatusDot({ online }: { online: boolean }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${online ? 'bg-green-500' : 'bg-slate-300'}`} />
  );
}

export function LiveTrackingPage() {
  const [riders, setRiders]   = useState<RiderLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [selected, setSelected] = useState<RiderLocation | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/api/admin/riders?limit=200')
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : (r.data.rows ?? []);
        setRiders(list);
        setLastRefresh(new Date());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, [load]);

  const online  = riders.filter(r => r.isOnline);
  const offline = riders.filter(r => !r.isOnline);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Live Tracking"
        subtitle="Real-time rider locations and order status"
        breadcrumbs={[{ label: 'Home' }, { label: 'Live Tracking' }]}
      />

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Online Riders', value: online.length, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Offline Riders', value: offline.length, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-100' },
          { label: 'Total Riders', value: riders.length, color: 'text-[#EA580C]', bg: 'bg-orange-50', border: 'border-orange-100' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4 text-center`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Rider list */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
            <h3 className="font-semibold text-slate-800 text-sm">All Riders</h3>
            <button onClick={load} disabled={loading}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#EA580C] transition-colors">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </button>
          </div>
          <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
            {loading && riders.length === 0 ? (
              <div className="py-10 text-center text-slate-300 text-sm">Loading...</div>
            ) : riders.length === 0 ? (
              <div className="py-10 text-center text-slate-300 text-sm">No riders found</div>
            ) : (
              [...online, ...offline].map(r => (
                <button key={r.id} onClick={() => setSelected(r === selected ? null : r)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${selected?.id === r.id ? 'bg-orange-50' : 'hover:bg-slate-50'}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${r.isOnline ? 'bg-green-100' : 'bg-slate-100'}`}>
                    <Bike size={16} className={r.isOnline ? 'text-green-600' : 'text-slate-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <StatusDot online={r.isOnline} />
                      <span className="text-sm font-medium text-slate-800 truncate">{r.name}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 truncate">{r.mobile}</div>
                  </div>
                  {r.currentLat && r.currentLng ? (
                    <MapPin size={13} className="text-[#EA580C] shrink-0" />
                  ) : (
                    <Circle size={13} className="text-slate-200 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail / Map panel */}
        <div className="lg:col-span-2 space-y-4">
          {selected ? (
            <>
              {/* Rider detail card */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${selected.isOnline ? 'bg-green-100' : 'bg-slate-100'}`}>
                    <Bike size={22} className={selected.isOnline ? 'text-green-600' : 'text-slate-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900">{selected.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selected.isOnline ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {selected.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500 mt-1">{selected.mobile}</div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-xl p-3">
                        <div className="text-xs text-slate-400 mb-1">Location</div>
                        {selected.currentLat && selected.currentLng ? (
                          <div className="text-xs font-mono text-slate-700">
                            {Number(selected.currentLat).toFixed(4)}, {Number(selected.currentLng).toFixed(4)}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400">Not available</div>
                        )}
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3">
                        <div className="text-xs text-slate-400 mb-1">Last update</div>
                        <div className="text-xs text-slate-700">
                          {selected.locationUpdatedAt
                            ? new Date(selected.locationUpdatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map */}
              {selected.currentLat && selected.currentLng ? (
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-50 flex items-center gap-2">
                    <MapPin size={14} className="text-[#EA580C]" />
                    <span className="text-sm font-medium text-slate-700">Last Known Location</span>
                  </div>
                  <iframe
                    title="rider-map"
                    width="100%"
                    height="320"
                    style={{ border: 0 }}
                    src={`https://maps.google.com/maps?q=${selected.currentLat},${selected.currentLng}&z=15&output=embed`}
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
                  <MapPin size={32} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No location data for this rider</p>
                  <p className="text-slate-300 text-xs mt-1">Location updates when rider is on an active delivery</p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center h-full flex flex-col items-center justify-center min-h-[300px]">
              <Bike size={40} className="text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">Select a rider</p>
              <p className="text-slate-300 text-sm mt-1">Click any rider from the list to see their location</p>
              <div className="mt-6 text-xs text-slate-300">Auto-refreshes every 30 seconds</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
