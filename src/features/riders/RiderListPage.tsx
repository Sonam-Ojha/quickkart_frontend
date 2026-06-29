import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Star, Bike, MapPin, Phone, Edit2, Trash2, Loader2, AlertCircle, X, Search, Wifi, WifiOff, TrendingUp } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { usePermission } from '../../hooks/usePermission';
import { riderApi, Rider, RiderPayload } from './api';
import { darkStoreApi, DarkStore } from '../dark-stores/api';

// ── Modal ─────────────────────────────────────────────────

function RiderModal({ rider, stores, onClose, onSave }: { rider?: Rider | null; stores: DarkStore[]; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState<RiderPayload>({
    name: rider?.name ?? '',
    mobile: rider?.mobile ?? '',
    storeId: rider?.storeId ?? (stores[0]?.id ?? 0),
    vehicleType: rider?.vehicleType ?? 'bike',
    vehicleNumber: rider?.vehicleNumber ?? '',
    password: '',
    rating: rider?.rating ?? 5,
    status: rider?.status ?? 'active',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof RiderPayload, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.mobile || !form.storeId) { setError('Name, mobile and store are required'); return; }
    setSaving(true); setError('');
    try {
      rider ? await riderApi.update(rider.id, form) : await riderApi.create(form);
      onSave();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Something went wrong');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">{rider ? 'Edit Rider' : 'Add Rider'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600"><AlertCircle size={14} />{error}</div>}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Name *</label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Rider name" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Mobile *</label>
            <Input type="tel" value={form.mobile} onChange={e => set('mobile', e.target.value)} placeholder="+91 XXXXX XXXXX" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Dark Store *</label>
            <select value={form.storeId} onChange={e => set('storeId', Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400">
              <option value="">Select store</option>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Vehicle Type</label>
              <select value={form.vehicleType} onChange={e => set('vehicleType', e.target.value as any)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400">
                <option value="bike">🏍️ Bike</option>
                <option value="scooter">🛵 Scooter</option>
                <option value="cycle">🚲 Cycle</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Vehicle Number</label>
              <Input value={form.vehicleNumber ?? ''} onChange={e => set('vehicleNumber', e.target.value)} placeholder="MH 01 AB 1234" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              {rider ? 'New Password (leave blank to keep)' : 'Password (for app login) *'}
            </label>
            <Input
              type="password"
              value={form.password ?? ''}
              onChange={e => set('password', e.target.value)}
              placeholder="Min 6 characters"
              required={!rider}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Rating</label>
              <Input type="number" step="0.1" min="1" max="5" value={form.rating ?? 5} onChange={e => set('rating', Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value as any)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />}
              {rider ? 'Save Changes' : 'Add Rider'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  active:    'bg-green-50 text-green-700',
  inactive:  'bg-slate-100 text-slate-500',
  suspended: 'bg-red-50 text-red-600',
};

export function RiderListPage() {
  const { can } = usePermission();
  const [riders, setRiders] = useState<Rider[]>([]);
  const [stores, setStores] = useState<DarkStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState<number | undefined>();
  const [modal, setModal] = useState<{ open: boolean; rider?: Rider | null }>({ open: false });

  useEffect(() => { darkStoreApi.getAll().then(setStores).catch(() => {}); }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      setRiders(await riderApi.getAll({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        storeId: storeFilter,
      }));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load riders');
    } finally { setLoading(false); }
  }, [search, statusFilter, storeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (r: Rider) => {
    try {
      const updated = await riderApi.toggle(r.id);
      setRiders(prev => prev.map(x => x.id === r.id ? updated : x));
    } catch {}
  };

  const handleDelete = async (r: Rider) => {
    if (!confirm(`Delete rider ${r.name}?`)) return;
    try { await riderApi.remove(r.id); load(); }
    catch (err: any) { setError(err?.response?.data?.message ?? 'Delete failed'); }
  };

  return (
    <div>
      <PageHeader
        title="Riders"
        subtitle={loading ? 'Loading...' : `${riders.length} delivery partners`}
        breadcrumbs={[{ label: 'Home' }, { label: 'Riders' }]}
        action={can('riders.edit') && (
          <Button size="sm" onClick={() => setModal({ open: true, rider: null })}>
            <Plus size={14} /> Add Rider
          </Button>
        )}
      />

      {error && <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600"><AlertCircle size={14} />{error}</div>}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search riders..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={storeFilter ?? ''} onChange={e => setStoreFilter(e.target.value ? Number(e.target.value) : undefined)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400">
          <option value="">All Stores</option>
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="flex gap-1.5">
          {['all', 'active', 'inactive', 'suspended'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${statusFilter === s ? 'bg-[#EA580C] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-200'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 size={24} className="animate-spin mr-2" /> Loading riders...</div>
      ) : riders.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Bike size={40} className="mx-auto mb-3 text-slate-200" />
          <p className="font-medium">No riders found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {riders.map(rider => (
            <div key={rider.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-slate-200 hover:shadow-sm transition-all group">
              <div className="flex items-start gap-3 mb-4">
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#EA580C] to-[#0F766E] flex items-center justify-center text-white font-bold">
                    {rider.name[0]}
                  </div>
                  {rider.status === 'active' && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate">{rider.name}</h3>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500">
                    <Phone size={10} />{rider.mobile}
                  </div>
                </div>
                <button onClick={() => can('riders.edit') && handleToggle(rider)}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[rider.status]}`}>
                  {rider.status}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-center gap-1 text-amber-500 mb-0.5">
                    <Star size={12} fill="currentColor" />
                    <span className="font-bold text-sm text-slate-800">{Number(rider.rating).toFixed(1)}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Rating</div>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-xl">
                  <div className="font-bold text-sm text-slate-800 mb-0.5">{rider.totalDeliveries}</div>
                  <div className="text-[10px] text-slate-400">Deliveries</div>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-center gap-0.5 mb-0.5">
                    <TrendingUp size={10} className="text-green-600" />
                    <span className="font-bold text-sm text-slate-800">₹{Math.round((rider.totalEarnings ?? 0) / 100)}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Earned</div>
                </div>
              </div>

              {rider.store && (
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={11} className="text-[#EA580C] shrink-0" />
                    <span className="truncate">{rider.store.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {rider.isOnline
                      ? <><Wifi size={10} className="text-green-500" /><span className="text-green-600 text-[10px] font-semibold">Online</span></>
                      : <><WifiOff size={10} className="text-slate-300" /><span className="text-slate-400 text-[10px]">Offline</span></>
                    }
                  </div>
                </div>
              )}
              {rider.vehicleType && (
                <div className="text-[10px] text-slate-400 mb-3">
                  {rider.vehicleType === 'bike' ? '🏍️' : rider.vehicleType === 'scooter' ? '🛵' : rider.vehicleType === 'cycle' ? '🚲' : '🚗'}{' '}
                  {rider.vehicleType.charAt(0).toUpperCase() + rider.vehicleType.slice(1)}
                  {rider.vehicleNumber ? ` · ${rider.vehicleNumber}` : ''}
                </div>
              )}

              {can('riders.edit') && (
                <div className="flex gap-2 pt-3 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setModal({ open: true, rider })}>
                    <Edit2 size={12} /> Edit
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(rider)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <RiderModal rider={modal.rider} stores={stores}
          onClose={() => setModal({ open: false })}
          onSave={() => { setModal({ open: false }); load(); }} />
      )}
    </div>
  );
}
