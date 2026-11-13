import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Loader2, AlertCircle, X, UtensilsCrossed, MapPin, Clock, Phone, ArrowRight } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import ImageUploadField from '../../components/common/ImageUploadField';
import { usePermission } from '../../hooks/usePermission';
import { darkStoreApi, DarkStore } from '../dark-stores/api';
import { foodApi, Restaurant, RestaurantPayload } from './api';

const LABEL = 'text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block';

// Small on/off switch shared by the restaurant + menu pages
export function Switch({ on, onClick, disabled, busy, label }: {
  on: boolean; onClick: () => void; disabled?: boolean; busy?: boolean; label: string;
}) {
  return (
    <button
      type="button" role="switch" aria-checked={on} aria-label={label} title={label}
      onClick={onClick} disabled={disabled || busy}
      className={`w-10 h-5 rounded-full transition-colors relative shrink-0 disabled:opacity-60 ${on ? 'bg-[#DC2626]' : 'bg-slate-300'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform flex items-center justify-center ${on ? 'translate-x-5' : 'translate-x-0.5'}`}>
        {busy && <Loader2 size={10} className="animate-spin text-slate-400" />}
      </span>
    </button>
  );
}

const hoursLabel = (r: Restaurant) =>
  r.openTime && r.closeTime ? `${r.openTime} – ${r.closeTime}` : 'Open all day';

function RestaurantModal({ restaurant, stores, onClose, onSave }: {
  restaurant?: Restaurant | null; stores: DarkStore[]; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState<RestaurantPayload>({
    storeId:       restaurant?.storeId       ?? stores.find(s => s.foodEnabled)?.id ?? stores[0]?.id,
    name:          restaurant?.name          ?? '',
    cuisines:      restaurant?.cuisines      ?? '',
    description:   restaurant?.description   ?? '',
    imageUrl:      restaurant?.imageUrl      ?? '',
    address:       restaurant?.address       ?? '',
    lat:           restaurant?.lat           ?? '',
    lng:           restaurant?.lng           ?? '',
    phone:         restaurant?.phone         ?? '',
    isPureVeg:     restaurant?.isPureVeg     ?? false,
    commissionPct: restaurant != null ? Number(restaurant.commissionPct) : 15,
    prepTimeMins:  restaurant?.prepTimeMins  ?? 20,
    openTime:      restaurant?.openTime      ?? '',
    closeTime:     restaurant?.closeTime     ?? '',
    sortOrder:     restaurant?.sortOrder     ?? 0,
    isActive:      restaurant?.isActive      ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const set = (k: keyof RestaurantPayload, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim())    { setError('Name is required'); return; }
    if (!form.address?.trim()) { setError('Address is required'); return; }
    if (!form.storeId)         { setError('Choose the store / area'); return; }
    if (!!form.openTime !== !!form.closeTime) { setError('Set both opening and closing time, or neither'); return; }
    setSaving(true); setError('');
    try {
      const payload: RestaurantPayload = {
        ...form,
        lat: form.lat === '' ? null : Number(form.lat),
        lng: form.lng === '' ? null : Number(form.lng),
        openTime:  form.openTime  || null,
        closeTime: form.closeTime || null,
        imageUrl:  form.imageUrl  || null,
      };
      restaurant ? await foodApi.update(restaurant.id, payload) : await foodApi.create(payload);
      onSave();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Something went wrong');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-4 sm:px-8 pt-5 sm:pt-6 pb-5 sm:pb-6 shrink-0 bg-gradient-to-r from-red-50 to-amber-50">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-red-100">
                <UtensilsCrossed size={22} className="text-[#DC2626]" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-lg leading-tight">{restaurant ? 'Edit' : 'Add'} Restaurant</h2>
                <p className="text-sm text-slate-500 mt-0.5">Shown in the Food tab to customers of the chosen store's area</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/70 text-slate-400 transition-colors"><X size={18} /></button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-4 sm:p-8 space-y-5 overflow-y-auto">
            {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600"><AlertCircle size={14} />{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              <div className="lg:col-span-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-700">Basic Details</h3>
                <div>
                  <label className={LABEL}>Store / Area *</label>
                  <select
                    value={form.storeId ?? ''}
                    onChange={e => set('storeId', Number(e.target.value))}
                    className="w-full h-11 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-700 bg-white outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
                  >
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>{s.name}{s.city ? ` — ${s.city}` : ''}{s.foodEnabled ? '' : ' (food off)'}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1.5">Customers this store delivers to will see the restaurant.</p>
                </div>
                <div>
                  <label className={LABEL}>Name *</label>
                  <Input value={form.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Sharma Mithai Bhandar" className="h-11 bg-white" autoFocus />
                </div>
                <div>
                  <label className={LABEL}>Cuisines</label>
                  <Input value={form.cuisines ?? ''} onChange={e => set('cuisines', e.target.value)} placeholder="e.g. Mithai, Snacks, Namkeen" className="h-11 bg-white" />
                </div>
                <div>
                  <label className={LABEL}>Short description <span className="text-slate-400 normal-case">(optional)</span></label>
                  <Input value={form.description ?? ''} onChange={e => set('description', e.target.value)} maxLength={255} placeholder="e.g. Pure desi ghee sweets since 1985" className="h-11 bg-white" />
                </div>
                <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={!!form.isPureVeg} onChange={e => set('isPureVeg', e.target.checked)} className="accent-[#16A34A] w-4 h-4" />
                  Pure Veg restaurant
                </label>
              </div>

              <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-slate-700">Photo</h3>
                <p className="text-xs text-slate-400 mb-3">Square, at least 600 × 600px</p>
                <ImageUploadField label="Restaurant photo" value={form.imageUrl ?? ''} onChange={url => set('imageUrl', url)} aspectRatio={1} previewClassName="h-40" />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">Location &amp; Contact</h3>
              <div>
                <label className={LABEL}>Address *</label>
                <Input value={form.address ?? ''} onChange={e => set('address', e.target.value)} placeholder="Shop no., market, landmark, town" className="h-11 bg-white" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={LABEL}>Latitude</label>
                  <Input value={String(form.lat ?? '')} onChange={e => set('lat', e.target.value)} placeholder="25.8390" inputMode="decimal" className="h-11 bg-white" />
                </div>
                <div>
                  <label className={LABEL}>Longitude</label>
                  <Input value={String(form.lng ?? '')} onChange={e => set('lng', e.target.value)} placeholder="81.1210" inputMode="decimal" className="h-11 bg-white" />
                </div>
                <div>
                  <label className={LABEL}>Phone (for orders)</label>
                  <Input value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} placeholder="98xxxxxxxx" inputMode="tel" className="h-11 bg-white" />
                </div>
              </div>
              <p className="text-xs text-slate-400">Latitude/longitude is the rider's pickup point — copy it from Google Maps (right-click the shop → the numbers at the top).</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">Business &amp; Timing</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className={LABEL}>Commission %</label>
                  <Input type="number" min={0} max={100} step="0.5" value={form.commissionPct ?? 0} onChange={e => set('commissionPct', e.target.value === '' ? 0 : Number(e.target.value))} className="h-11 bg-white" />
                </div>
                <div>
                  <label className={LABEL}>Prep time (min)</label>
                  <Input type="number" min={0} value={form.prepTimeMins ?? 20} onChange={e => set('prepTimeMins', Number(e.target.value))} className="h-11 bg-white" />
                </div>
                <div>
                  <label className={LABEL}>Opens at</label>
                  <Input type="time" value={form.openTime ?? ''} onChange={e => set('openTime', e.target.value)} className="h-11 bg-white" />
                </div>
                <div>
                  <label className={LABEL}>Closes at</label>
                  <Input type="time" value={form.closeTime ?? ''} onChange={e => set('closeTime', e.target.value)} className="h-11 bg-white" />
                </div>
              </div>
              <p className="text-xs text-slate-400">Leave both times empty if it is open all day. A closing time earlier than the opening time means it closes after midnight.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Sort order</label>
                  <Input type="number" value={form.sortOrder ?? 0} onChange={e => set('sortOrder', Number(e.target.value))} className="h-11 bg-white" />
                </div>
                <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer self-end h-11">
                  <input type="checkbox" checked={!!form.isActive} onChange={e => set('isActive', e.target.checked)} className="accent-[#DC2626] w-4 h-4" />
                  Show in app
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 px-4 sm:px-8 py-4 border-t border-slate-100 bg-slate-50/60 shrink-0">
            <p className="text-xs text-slate-400 hidden sm:block">Fields marked * are required</p>
            <div className="flex gap-3 ml-auto">
              <Button type="button" variant="outline" className="h-10 px-5" onClick={onClose}>Cancel</Button>
              <Button type="submit" className="h-10 px-6" disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                {restaurant ? 'Save Changes' : 'Add Restaurant'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RestaurantListPage() {
  const { can } = usePermission();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [stores, setStores]   = useState<DarkStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [storeFilter, setStoreFilter] = useState<number | 'all'>('all');
  const [modal, setModal]     = useState<{ open: boolean; restaurant?: Restaurant | null }>({ open: false });
  const [busy, setBusy]       = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [r, s] = await Promise.all([foodApi.list(), darkStoreApi.getAll()]);
      setRestaurants(r); setStores(s);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load restaurants');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const toggle = async (r: Restaurant, field: 'isActive' | 'isOpen') => {
    setBusy(`${r.id}-${field}`);
    try {
      await foodApi.toggle(r.id, field);
      // Refetch quietly so "Open now" (computed on the server) stays right
      setRestaurants(await foodApi.list());
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Update failed');
    } finally { setBusy(null); }
  };

  const remove = async (r: Restaurant) => {
    if (!window.confirm(`Delete "${r.name}" and its whole menu? This cannot be undone.`)) return;
    try { await foodApi.remove(r.id); load(); }
    catch (err: any) { setError(err?.response?.data?.message ?? 'Delete failed'); }
  };

  const shown = storeFilter === 'all' ? restaurants : restaurants.filter(r => r.storeId === storeFilter);
  const foodStores = stores.filter(s => s.foodEnabled);
  const canEdit = can('catalog.edit');

  return (
    <div>
      <PageHeader
        title="Restaurants"
        subtitle={loading ? 'Loading...' : `${restaurants.filter(r => r.isActive).length} live / ${restaurants.length} total`}
        breadcrumbs={[{ label: 'Home' }, { label: 'Food' }, { label: 'Restaurants' }]}
        action={canEdit && (
          <Button size="sm" onClick={() => setModal({ open: true, restaurant: null })} disabled={stores.length === 0}>
            <Plus size={14} /> Add Restaurant
          </Button>
        )}
      />

      {!loading && foodStores.length === 0 && (
        <div className="flex items-start gap-2 p-3 mb-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>Food Delivery is off in every area, so customers won't see the Food tab yet. Turn it on for an area in <button className="underline font-medium" onClick={() => navigate('/dark-stores')}>Dark Stores</button>.</span>
        </div>
      )}
      {error && <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600"><AlertCircle size={14} />{error}</div>}

      {stores.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {[{ id: 'all' as const, name: 'All areas' }, ...stores].map(s => (
            <button key={s.id} onClick={() => setStoreFilter(s.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${storeFilter === s.id ? 'bg-[#DC2626] text-white border-[#DC2626]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
              {s.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 size={24} className="animate-spin mr-2" /> Loading restaurants...</div>
      ) : shown.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <UtensilsCrossed size={40} className="mx-auto mb-3 text-slate-200" />
          <p className="font-medium">No restaurants yet</p>
          <p className="text-sm mt-1">Click "Add Restaurant" to list the first one</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {shown.map(r => (
            <div key={r.id} className={`bg-white rounded-2xl border border-slate-100 overflow-hidden transition-all hover:shadow-sm ${r.isActive ? '' : 'opacity-70'}`}>
              <div className="flex gap-3 p-4">
                <div className="w-20 h-20 rounded-xl bg-amber-50 overflow-hidden flex items-center justify-center shrink-0">
                  {r.imageUrl ? <img src={r.imageUrl} alt="" className="w-full h-full object-cover" /> : <UtensilsCrossed size={26} className="text-amber-300" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-800 text-sm leading-tight">{r.name}</h3>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${r.openNow ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {r.openNow ? 'Open now' : 'Closed'}
                    </span>
                  </div>
                  {r.cuisines && <p className="text-xs text-slate-500 mt-0.5 truncate">{r.cuisines}</p>}
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-1.5">
                    <MapPin size={11} className="text-[#DC2626] shrink-0" />
                    <span className="truncate">{r.store?.name ?? 'Unknown store'}</span>
                    {r.store && !r.store.foodEnabled && <span className="text-amber-600 font-medium shrink-0">· food off</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1"><Clock size={11} />{hoursLabel(r)}</span>
                    {r.phone && <span className="flex items-center gap-1"><Phone size={11} />{r.phone}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    {r.isPureVeg && <span className="text-[11px] px-1.5 py-0.5 rounded bg-green-50 text-green-700 font-medium">Pure Veg</span>}
                    <span className="text-[11px] text-slate-500">{r.itemCount ?? 0} items · {Number(r.commissionPct)}% commission</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 text-xs text-slate-600">
                <span className="flex items-center gap-2">
                  <Switch on={r.isOpen} label="Accepting orders" disabled={!canEdit} busy={busy === `${r.id}-isOpen`} onClick={() => toggle(r, 'isOpen')} />
                  Accepting orders
                </span>
                <span className="flex items-center gap-2">
                  <Switch on={r.isActive} label="Show in app" disabled={!canEdit} busy={busy === `${r.id}-isActive`} onClick={() => toggle(r, 'isActive')} />
                  Show in app
                </span>
              </div>
              <div className="flex gap-2 p-3 border-t border-slate-100">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/food/restaurants/${r.id}`)}>
                  <ArrowRight size={12} /> Menu
                </Button>
                {canEdit && (
                  <>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:bg-slate-100" onClick={() => setModal({ open: true, restaurant: r })}><Edit2 size={14} /></Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => remove(r)}><Trash2 size={14} /></Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <RestaurantModal
          restaurant={modal.restaurant}
          stores={stores}
          onClose={() => setModal({ open: false })}
          onSave={() => { setModal({ open: false }); load(); }}
        />
      )}
    </div>
  );
}
