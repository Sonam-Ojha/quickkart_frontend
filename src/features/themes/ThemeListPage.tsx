import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Loader2, AlertCircle, Sparkles, CalendarClock, MapPin } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { usePermission } from '../../hooks/usePermission';
import { themeApi, AppTheme, ThemeStatus, StoreOption, PRESETS } from './api';

export const STATUS_META: Record<ThemeStatus, { label: string; cls: string }> = {
  live:      { label: '● Live now',  cls: 'bg-green-50 text-green-700 border-green-200' },
  scheduled: { label: 'Scheduled',   cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  ended:     { label: 'Ended',       cls: 'bg-slate-100 text-slate-500 border-slate-200' },
  off:       { label: 'Off',         cls: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : null;

/** Festival themes: change the app + website look without an app update. */
export function ThemeListPage() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const canEdit = can('banners.edit');
  const [themes, setThemes] = useState<AppTheme[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([themeApi.list(), themeApi.stores()])
      .then(([t, s]) => { setThemes(t); setStores(s); setError(''); })
      .catch(e => setError(e?.response?.data?.message ?? 'Could not load themes'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const toggle = async (t: AppTheme) => {
    try { const u = await themeApi.toggle(t.id); setThemes(ts => ts.map(x => (x.id === u.id ? u : x))); }
    catch (e: any) { setError(e?.response?.data?.message ?? 'Could not change the theme'); }
  };
  const remove = async (t: AppTheme) => {
    if (!confirm(`Delete the theme "${t.name}"?`)) return;
    try { await themeApi.remove(t.id); setThemes(ts => ts.filter(x => x.id !== t.id)); }
    catch (e: any) { setError(e?.response?.data?.message ?? 'Could not delete'); }
  };

  const areaLabel = (ids: number[] | null) => {
    if (!ids?.length) return 'All areas';
    const names = ids.map(id => stores.find(s => s.id === id)?.name ?? `Store #${id}`);
    return names.length > 2 ? `${names.slice(0, 2).join(', ')} +${names.length - 2}` : names.join(', ');
  };

  const live = themes.find(t => t.status === 'live' && !t.storeIds?.length);

  return (
    <div>
      <PageHeader
        title="Festival Themes"
        subtitle="Change how the app and website look for Diwali, Holi, New Year… — no app update needed"
        breadcrumbs={[{ label: 'Home' }, { label: 'Themes' }]}
        action={canEdit && <Button size="sm" onClick={() => navigate('/themes/new')}><Plus size={14} /> New theme</Button>}
      />

      {error && <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600"><AlertCircle size={15} />{error}</div>}

      <div className={`rounded-2xl border p-4 mb-5 flex items-center gap-3 ${live ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${live ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500'}`}><Sparkles size={18} /></div>
        <div className="text-sm">
          {live
            ? <><b className="text-slate-900">{live.name}</b> is live for everyone right now{live.endsAt ? ` — until ${fmtDate(live.endsAt)}` : ''}.</>
            : <span className="text-slate-600">No festival theme is live for all areas — customers see the normal orange design.</span>}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 size={20} className="animate-spin mr-2" /> Loading…</div>
      ) : themes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <Sparkles size={32} className="mx-auto text-orange-300 mb-2" />
          <p className="font-semibold text-slate-800">No themes yet</p>
          <p className="text-sm text-slate-500 mb-4">Start from a festival — you can change everything after.</p>
          {canEdit && (
            <div className="flex flex-wrap justify-center gap-2">
              {PRESETS.map(p => (
                <button key={p.key} onClick={() => navigate(`/themes/new?preset=${p.key}`)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:border-[#EA580C] hover:bg-orange-50">
                  {p.emoji} {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
          {themes.map(t => {
            const st = STATUS_META[t.status];
            return (
              <div key={t.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                {/* Mini header preview */}
                <div className="h-24 relative overflow-hidden" style={{ background: t.config.headerColor }}>
                  {t.config.headerImage && <img src={t.config.headerImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />}
                  {t.config.decorationImage && <img src={t.config.decorationImage} alt="" className="absolute top-0 inset-x-0 w-full h-12 object-cover object-top" />}
                  <div className={`absolute bottom-2 left-3 right-3 text-sm font-bold truncate ${t.config.headerTextColor === 'dark' ? 'text-slate-900' : 'text-white'}`}>
                    {t.config.greeting ?? t.name}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900">{t.name}</h3>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <CalendarClock size={13} />
                    {t.startsAt || t.endsAt ? `${fmtDate(t.startsAt) ?? 'Now'} → ${fmtDate(t.endsAt) ?? 'no end'}` : 'No dates — runs while switched on'}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5"><MapPin size={13} />{areaLabel(t.storeIds)}</div>
                  <div className="mt-auto pt-3 flex items-center gap-2">
                    {canEdit && (
                      <button onClick={() => toggle(t)} role="switch" aria-checked={t.isActive}
                        className="flex items-center gap-2 text-xs font-semibold text-slate-600 mr-auto">
                        <span className={`relative inline-block w-10 h-6 rounded-full shrink-0 transition-colors ${t.isActive ? 'bg-green-600' : 'bg-slate-300'}`}>
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${t.isActive ? 'translate-x-4' : ''}`} />
                        </span>
                        {t.isActive ? 'On' : 'Off'}
                      </button>
                    )}
                    {canEdit && <Button size="sm" variant="outline" onClick={() => navigate(`/themes/${t.id}`)}><Edit2 size={13} /> Edit</Button>}
                    {canEdit && <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => remove(t)}><Trash2 size={14} /></Button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
