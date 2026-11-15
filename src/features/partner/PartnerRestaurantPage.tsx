import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import ImageUploadField from '../../components/common/ImageUploadField';
import { partnerApi } from './api';
import type { PartnerOutletContext } from './PartnerLayout';

const LABEL = 'block text-sm font-semibold text-slate-700 mb-1.5';
const INPUT = 'w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-orange-100 bg-white';

/** What the restaurant can change about itself (commission, area and name stay with Jhatpats). */
export function PartnerRestaurantPage() {
  const { restaurant, setRestaurant } = useOutletContext<PartnerOutletContext>();
  const [form, setForm] = useState({
    imageUrl: '', description: '', cuisines: '', phone: '', prepTimeMins: 20, openTime: '', closeTime: '', isPureVeg: false,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!restaurant) return;
    setForm({
      imageUrl:     restaurant.imageUrl ?? '',
      description:  restaurant.description ?? '',
      cuisines:     restaurant.cuisines ?? '',
      phone:        restaurant.phone ?? '',
      prepTimeMins: restaurant.prepTimeMins ?? 20,
      openTime:     restaurant.openTime ?? '',
      closeTime:    restaurant.closeTime ?? '',
      isPureVeg:    restaurant.isPureVeg,
    });
  }, [restaurant?.id]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(f => ({ ...f, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!!form.openTime !== !!form.closeTime) { setMsg({ ok: false, text: 'Set both opening and closing time, or leave both empty' }); return; }
    setSaving(true); setMsg(null);
    try {
      const r = await partnerApi.updateRestaurant({
        ...form,
        imageUrl:  form.imageUrl || null,
        openTime:  form.openTime || null,
        closeTime: form.closeTime || null,
      });
      setRestaurant(r);
      setMsg({ ok: true, text: 'Saved — customers see the changes now' });
    } catch (err: any) {
      setMsg({ ok: false, text: err?.response?.data?.message ?? 'Could not save' });
    } finally { setSaving(false); }
  };

  if (!restaurant) {
    return <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin mr-2" /> Loading...</div>;
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{restaurant.name}</h1>
        <p className="text-sm text-slate-500">{restaurant.address}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h3 className="font-bold text-slate-900">About your restaurant</h3>
        <div>
          <span className={LABEL}>Photo</span>
          <ImageUploadField label="Restaurant photo" value={form.imageUrl} onChange={url => set('imageUrl', url)} aspectRatio={1} previewClassName="h-40" uploadFn={partnerApi.upload} />
        </div>
        <div>
          <label className={LABEL}>What you serve</label>
          <input className={INPUT} value={form.cuisines} onChange={e => set('cuisines', e.target.value)} placeholder="e.g. Mithai, Snacks, Thali" />
        </div>
        <div>
          <label className={LABEL}>Short description</label>
          <input className={INPUT} value={form.description} maxLength={255} onChange={e => set('description', e.target.value)} placeholder="e.g. Pure desi ghee sweets since 1985" />
        </div>
        <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={form.isPureVeg} onChange={e => set('isPureVeg', e.target.checked)} className="accent-[#16A34A] w-4 h-4" />
          Pure Veg restaurant
        </label>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h3 className="font-bold text-slate-900">Timings & contact</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Opens at</label>
            <input type="time" className={INPUT} value={form.openTime} onChange={e => set('openTime', e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>Closes at</label>
            <input type="time" className={INPUT} value={form.closeTime} onChange={e => set('closeTime', e.target.value)} />
          </div>
        </div>
        <p className="text-xs text-slate-400 -mt-2">Leave both empty if you are open all day. Use the switch at the top to close for a while.</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Cooking time (min)</label>
            <input type="number" min={0} className={INPUT} value={form.prepTimeMins} onChange={e => set('prepTimeMins', Number(e.target.value))} />
          </div>
          <div>
            <label className={LABEL}>Phone for orders</label>
            <input className={INPUT} inputMode="tel" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
        </div>
      </div>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${msg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {msg.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}{msg.text}
        </div>
      )}
      <button type="submit" disabled={saving}
        className="w-full sm:w-64 h-12 rounded-xl bg-[#EA580C] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
        {saving && <Loader2 size={17} className="animate-spin" />} Save changes
      </button>
      <p className="text-xs text-slate-400">To change the restaurant name, area or commission, contact Jhatpats.</p>
    </form>
  );
}
