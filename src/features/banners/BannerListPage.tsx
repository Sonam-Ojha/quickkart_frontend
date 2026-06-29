import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Loader2, AlertCircle, X, Image } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { usePermission } from '../../hooks/usePermission';
import { bannerApi, Banner, BannerPayload, BgType } from './api';

const BG_OPTIONS: { value: BgType; label: string; from: string; to: string }[] = [
  { value: 'orange-tint',  label: '🟠 Orange',  from: '#EA580C', to: '#FB923C' },
  { value: 'teal-tint',    label: '🟢 Teal',    from: '#0F766E', to: '#14B8A6' },
  { value: 'blue-tint',    label: '🔵 Blue',    from: '#1D4ED8', to: '#3B82F6' },
  { value: 'emerald-tint', label: '💚 Emerald', from: '#065F46', to: '#10B981' },
  { value: 'rose-tint',    label: '🌸 Rose',    from: '#BE123C', to: '#FB7185' },
  { value: 'purple-tint',  label: '💜 Purple',  from: '#6D28D9', to: '#A78BFA' },
];

// ── Modal ─────────────────────────────────────────────────

function BannerModal({ banner, onClose, onSave }: { banner?: Banner | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState<BannerPayload>({
    title:       banner?.title       ?? '',
    subtitle:    banner?.subtitle    ?? '',
    bannerImage: banner?.bannerImage ?? '',
    section:     banner?.section     ?? 'hero',
    emoji:       banner?.emoji       ?? '',
    bgType:      banner?.bgType      ?? 'orange-tint',
    deeplink:    banner?.deeplink    ?? '',
    sortOrder:   banner?.sortOrder   ?? 0,
    validTo:     banner?.validTo ? banner.validTo.slice(0, 10) : '',
    isActive:    banner?.isActive    ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (k: keyof BannerPayload, v: any) => setForm(f => ({ ...f, [k]: v }));

  const bgOption = BG_OPTIONS.find(o => o.value === form.bgType) ?? BG_OPTIONS[0];
  const isPromo  = form.section === 'promo';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title)       { setError('Title is required'); return; }
    if (!form.bannerImage) { setError('Banner image URL is required'); return; }
    if (isPromo && !form.emoji) { setError('Emoji is required for Promo Tiles'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        validTo:  form.validTo  || undefined,
        deeplink: form.deeplink || undefined,
        subtitle: form.subtitle || undefined,
        emoji:    form.emoji    || undefined,
      };
      banner ? await bannerApi.update(banner.id, payload) : await bannerApi.create(payload);
      onSave();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Something went wrong');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="font-semibold text-slate-800">{banner ? 'Edit Banner' : 'Add Banner'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600"><AlertCircle size={14} />{error}</div>}

          {/* Section toggle */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-2 block">Banner Type *</label>
            <div className="flex gap-2">
              {(['hero', 'promo'] as const).map(s => (
                <button
                  key={s} type="button"
                  onClick={() => set('section', s)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    form.section === s
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300'
                  }`}
                >
                  {s === 'hero' ? '🖼️ Hero Carousel' : '🃏 Promo Tile'}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isPromo ? 'Small card row below the main carousel' : 'Full-width sliding carousel at the top'}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Title *</label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder={isPromo ? 'e.g. Get printouts delivered' : 'e.g. Weekend Sale'} />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">{isPromo ? 'Sub-text' : 'Subtitle'}</label>
            <Input value={form.subtitle ?? ''} onChange={e => set('subtitle', e.target.value)} placeholder={isPromo ? 'e.g. Safe, secure & fast' : 'e.g. Up to 40% off on groceries'} />
          </div>

          {/* Emoji — promo tiles only */}
          {isPromo && (
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Emoji * <span className="text-slate-400">(shown on the tile)</span></label>
              <Input value={form.emoji ?? ''} onChange={e => set('emoji', e.target.value)} placeholder="e.g. 🖨️ 💊 🥬 🍼" maxLength={4} />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Image URL *</label>
            <Input value={form.bannerImage} onChange={e => set('bannerImage', e.target.value)} placeholder="https://..." />
          </div>

          {/* Live preview */}
          {(form.title || form.bannerImage) && (
            <div
              className="h-24 rounded-xl relative flex flex-col justify-end p-4 overflow-hidden"
              style={{ background: `linear-gradient(to right, ${bgOption.from}, ${bgOption.to})` }}
            >
              {form.bannerImage && <img src={form.bannerImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" onError={() => {}} />}
              {isPromo && form.emoji && <span className="absolute top-3 left-3 text-2xl">{form.emoji}</span>}
              <p className="font-bold text-white text-sm leading-tight">{form.title || 'Title'}</p>
              {form.subtitle && <p className="text-white/80 text-xs mt-0.5">{form.subtitle}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Color Theme</label>
              <select value={form.bgType} onChange={e => set('bgType', e.target.value as BgType)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400">
                {BG_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Sort Order</label>
              <Input type="number" min="0" value={form.sortOrder ?? 0} onChange={e => set('sortOrder', Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Valid Until</label>
              <Input type="date" value={form.validTo ?? ''} onChange={e => set('validTo', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">{isPromo ? 'Links to (route)' : 'Deeplink'}</label>
              <Input value={form.deeplink ?? ''} onChange={e => set('deeplink', e.target.value)} placeholder={isPromo ? '/category or /print' : 'app://...'} />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive ?? true} onChange={e => set('isActive', e.target.checked)} className="accent-[#EA580C]" />
            <span className="text-sm text-slate-600">Active (visible on customer site)</span>
          </label>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />}
              {banner ? 'Save Changes' : 'Add Banner'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────

export function BannerListPage() {
  const { can } = usePermission();
  const [banners, setBanners]     = useState<Banner[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [filterSection, setFilter] = useState<'all' | 'hero' | 'promo'>('all');
  const [modal, setModal]         = useState<{ open: boolean; banner?: Banner | null }>({ open: false });
  const [toggling, setToggling]   = useState<number | null>(null);
  const [deleting, setDeleting]   = useState<number | null>(null);

  const load = async () => {
    setLoading(true); setError('');
    try { setBanners(await bannerApi.getAll()); }
    catch (err: any) { setError(err?.response?.data?.message ?? 'Failed to load banners'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (b: Banner) => {
    setToggling(b.id);
    try {
      const updated = await bannerApi.toggle(b.id);
      setBanners(prev => prev.map(x => x.id === b.id ? updated : x));
    } catch {}
    finally { setToggling(null); }
  };

  const handleDelete = async (b: Banner) => {
    if (!confirm(`Delete banner "${b.title}"?`)) return;
    setDeleting(b.id);
    try { await bannerApi.remove(b.id); setBanners(prev => prev.filter(x => x.id !== b.id)); }
    catch (err: any) { setError(err?.response?.data?.message ?? 'Delete failed'); }
    finally { setDeleting(null); }
  };

  const filtered = filterSection === 'all' ? banners : banners.filter(b => b.section === filterSection);
  const liveCount = banners.filter(b => b.isActive).length;

  return (
    <div>
      <PageHeader
        title="Banners & Offers"
        subtitle={loading ? 'Loading...' : `${liveCount} live / ${banners.length} total`}
        breadcrumbs={[{ label: 'Home' }, { label: 'Banners' }]}
        action={can('banners.edit') && (
          <Button size="sm" onClick={() => setModal({ open: true, banner: null })}>
            <Plus size={14} /> Add Banner
          </Button>
        )}
      />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'hero', 'promo'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterSection === s
                ? 'bg-orange-500 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-300'
            }`}
          >
            {s === 'all' ? 'All' : s === 'hero' ? '🖼️ Hero Carousel' : '🃏 Promo Tiles'}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          <AlertCircle size={14} />{error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading banners...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Image size={40} className="mx-auto mb-3 text-slate-200" />
          <p className="font-medium">No banners yet</p>
          <p className="text-sm mt-1">Click "Add Banner" to create one</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(banner => {
            const bg = BG_OPTIONS.find(o => o.value === banner.bgType) ?? BG_OPTIONS[0];
            return (
              <div key={banner.id} className={`bg-white rounded-2xl border overflow-hidden hover:shadow-sm transition-all ${banner.isActive ? 'border-slate-100' : 'border-slate-100 opacity-70'}`}>
                {/* Preview */}
                <div
                  className="h-32 relative flex flex-col justify-end p-5 overflow-hidden"
                  style={{ background: `linear-gradient(to right, ${bg.from}, ${bg.to})` }}
                >
                  {banner.bannerImage && (
                    <img src={banner.bannerImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" onError={e => (e.currentTarget.style.display = 'none')} />
                  )}
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${banner.section === 'promo' ? 'bg-white/30 text-white' : 'bg-white/20 text-white'}`}>
                      {banner.section === 'promo' ? '🃏 Promo' : '🖼️ Hero'}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/20 text-white">#{banner.sortOrder}</span>
                    {!banner.isActive && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-black/20 text-white">Hidden</span>}
                  </div>
                  {banner.emoji && <span className="absolute top-3 left-4 text-2xl">{banner.emoji}</span>}
                  <h3 className="font-bold text-white text-lg leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{banner.title}</h3>
                  {banner.subtitle && <p className="text-white/80 text-sm mt-0.5">{banner.subtitle}</p>}
                </div>

                {/* Footer */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">Valid until</div>
                    <div className="text-sm font-medium text-slate-700">
                      {banner.validTo ? new Date(banner.validTo).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(banner)}
                      disabled={toggling === banner.id}
                      className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${banner.isActive ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      {toggling === banner.id ? <Loader2 size={11} className="animate-spin" /> : banner.isActive ? <Eye size={11} /> : <EyeOff size={11} />}
                      {banner.isActive ? 'Live' : 'Hidden'}
                    </button>
                    {can('banners.edit') && (
                      <>
                        <button onClick={() => setModal({ open: true, banner })}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(banner)} disabled={deleting === banner.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40">
                          {deleting === banner.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal.open && (
        <BannerModal
          banner={modal.banner}
          onClose={() => setModal({ open: false })}
          onSave={() => { setModal({ open: false }); load(); }}
        />
      )}
    </div>
  );
}
