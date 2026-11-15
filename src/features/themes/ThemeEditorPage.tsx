import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Lottie from 'lottie-react';
import {
  ArrowLeft, Loader2, AlertCircle, Save, Search, Plus, X, ChevronUp, ChevronDown, Upload, Film, Trash2, MapPin, Mic,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import ImageUploadField from '../../components/common/ImageUploadField';
import { themeApi, ThemeConfig, DEFAULT_CONFIG, PRESETS, StoreOption, ThemeProduct, AppTheme } from './api';
import { STATUS_META } from './ThemeListPage';

// <input type="datetime-local"> works in local time without a zone.
const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

const LABEL = 'block text-xs font-semibold text-slate-600 mb-1.5';

export function ThemeEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<AppTheme['status'] | null>(null);

  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [allAreas, setAllAreas] = useState(true);
  const [storeIds, setStoreIds] = useState<number[]>([]);
  const [config, setConfig] = useState<ThemeConfig>(DEFAULT_CONFIG);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [picked, setPicked] = useState<ThemeProduct[]>([]);

  const set = <K extends keyof ThemeConfig>(k: K, v: ThemeConfig[K]) => setConfig(c => ({ ...c, [k]: v }));
  const setSection = (p: Partial<ThemeConfig['section']>) => setConfig(c => ({ ...c, section: { ...c.section, ...p } }));

  const [presetBusy, setPresetBusy] = useState<string | null>(null);
  // A preset fills everything — art, words, "Shop by" tiles — and picks
  // matching products from the catalogue (first hits for each keyword).
  const applyPreset = async (key: string) => {
    const p = PRESETS.find(x => x.key === key);
    if (!p) return;
    setConfig({ ...p.config, section: { ...p.config.section, tiles: [...p.config.section.tiles] } });
    setName(n => n || `${p.name} ${new Date().getFullYear()}`);
    setPresetBusy(key);
    try {
      const found = await Promise.all(p.productKeywords.map(k => themeApi.searchProducts(k).catch(() => [] as ThemeProduct[])));
      const seen = new Set<number>();
      const list: ThemeProduct[] = [];
      for (const hits of found) for (const h of hits.slice(0, 2)) if (!seen.has(h.id) && list.length < 12) { seen.add(h.id); list.push(h); }
      setPicked(list);
    } finally { setPresetBusy(null); }
  };

  useEffect(() => {
    themeApi.stores().then(setStores).catch(() => {});
    if (isNew) {
      const preset = params.get('preset');
      if (preset) applyPreset(preset);
      return;
    }
    themeApi.get(Number(id)).then(async t => {
      setName(t.name); setIsActive(t.isActive); setStatus(t.status);
      setStartsAt(toLocalInput(t.startsAt)); setEndsAt(toLocalInput(t.endsAt));
      setAllAreas(!t.storeIds?.length); setStoreIds(t.storeIds ?? []);
      setConfig({ ...DEFAULT_CONFIG, ...t.config, section: { ...DEFAULT_CONFIG.section, ...t.config.section, tiles: t.config.section?.tiles ?? [] } });
      setPicked(await themeApi.productsByIds(t.config.section?.productIds ?? []));
    }).catch(e => setError(e?.response?.data?.message ?? 'Could not load the theme')).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const save = async () => {
    setError('');
    if (!name.trim()) { setError('Give the theme a name'); return; }
    if (!allAreas && storeIds.length === 0) { setError('Pick at least one area, or choose "All areas"'); return; }
    setSaving(true);
    try {
      const payload = {
        name, isActive,
        startsAt: fromLocalInput(startsAt), endsAt: fromLocalInput(endsAt),
        storeIds: allAreas ? null : storeIds,
        config: { ...config, section: { ...config.section, productIds: picked.map(p => p.id) } },
      };
      if (isNew) await themeApi.create(payload); else await themeApi.update(Number(id), payload);
      navigate('/themes');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not save the theme');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-24 text-slate-400"><Loader2 size={20} className="animate-spin mr-2" /> Loading…</div>;

  return (
    <div>
      <PageHeader
        title={isNew ? 'New festival theme' : name || 'Edit theme'}
        subtitle="Changes reach the app and website within a minute — no app update"
        breadcrumbs={[{ label: 'Home' }, { label: 'Themes', href: '/themes' }, { label: isNew ? 'New' : 'Edit' }]}
        action={
          <div className="flex items-center gap-2">
            {status && <span className={`px-2 py-0.5 rounded-full border text-xs font-semibold ${STATUS_META[status].cls}`}>{STATUS_META[status].label}</span>}
            <Button size="sm" variant="outline" onClick={() => navigate('/themes')}><ArrowLeft size={14} /> Back</Button>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save theme</Button>
          </div>
        }
      />

      {error && <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600"><AlertCircle size={15} />{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="space-y-4 min-w-0">
          {/* Presets */}
          <Card title="Start from a festival" sub="One tap fills everything — header art, decoration, animation, page pattern, store banner, “Shop by” tiles and products. Change anything after.">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(p => (
                <button key={p.key} type="button" onClick={() => applyPreset(p.key)} disabled={!!presetBusy}
                  className="group relative w-[150px] rounded-xl border border-slate-200 overflow-hidden text-left hover:border-[#EA580C] hover:shadow-md transition-all disabled:opacity-60">
                  <div className="h-16 relative" style={{ background: p.config.headerColor }}>
                    {p.config.headerImage && <img src={p.config.headerImage} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                    {p.config.decorationImage && <img src={p.config.decorationImage} alt="" className="absolute top-0 inset-x-0 w-full h-7 object-cover object-top" />}
                    {presetBusy === p.key && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 size={18} className="animate-spin text-white" /></div>}
                  </div>
                  <div className="px-2.5 py-2 text-sm font-semibold text-slate-800">{p.emoji} {p.name}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* When & where */}
          <Card title="When and where">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={LABEL}>Theme name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Diwali 2026" maxLength={80} />
              </div>
              <div>
                <label className={LABEL}>Starts</label>
                <Input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} />
                <p className="text-[11px] text-slate-400 mt-1">Empty = starts as soon as it is switched on</p>
              </div>
              <div>
                <label className={LABEL}>Ends</label>
                <Input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} />
                <p className="text-[11px] text-slate-400 mt-1">Empty = runs until you switch it off</p>
              </div>
              <div className="md:col-span-2">
                <label className={LABEL}>Areas</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Chip on={allAreas} onClick={() => setAllAreas(true)}>All areas</Chip>
                  <Chip on={!allAreas} onClick={() => setAllAreas(false)}>Only some areas</Chip>
                </div>
                {!allAreas && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {stores.map(s => {
                      const on = storeIds.includes(s.id);
                      return (
                        <label key={s.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer ${on ? 'border-[#EA580C] bg-orange-50' : 'border-slate-200'}`}>
                          <input type="checkbox" checked={on} className="accent-[#EA580C]"
                            onChange={() => setStoreIds(ids => (on ? ids.filter(x => x !== s.id) : [...ids, s.id]))} />
                          <MapPin size={13} className="text-slate-400" />
                          <span className="truncate">{s.name} <span className="text-slate-400">· {s.city}</span></span>
                        </label>
                      );
                    })}
                  </div>
                )}
                <p className="text-[11px] text-slate-400 mt-1">An area's own theme wins over an "All areas" theme at the same time.</p>
              </div>
              <label className="md:col-span-2 flex items-center gap-3 cursor-pointer">
                <button type="button" role="switch" aria-checked={isActive} onClick={() => setIsActive(v => !v)}
                  className={`relative inline-block w-11 h-6 rounded-full shrink-0 transition-colors ${isActive ? 'bg-green-600' : 'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-5' : ''}`} />
                </button>
                <span className="text-sm font-semibold text-slate-700">{isActive ? 'Switched on — goes live on the start date' : 'Switched off — saved as a draft'}</span>
              </label>
            </div>
          </Card>

          {/* Header */}
          <Card title="Header" sub="The coloured band at the top of the app and website">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ColorField label="Header colour" value={config.headerColor} onChange={v => set('headerColor', v)} />
              <ColorField label="Highlight colour (selected tab)" value={config.accentColor} onChange={v => set('accentColor', v)} />
              <div className="md:col-span-2">
                <label className={LABEL}>Text on the header</label>
                <div className="flex gap-2">
                  <Chip on={config.headerTextColor === 'light'} onClick={() => set('headerTextColor', 'light')}>White text (dark header)</Chip>
                  <Chip on={config.headerTextColor === 'dark'} onClick={() => set('headerTextColor', 'dark')}>Black text (light header)</Chip>
                </div>
              </div>
              <div className="md:col-span-2">
                <ImageUploadField label="Header background picture (optional — pattern or festive photo, wide)" value={config.headerImage ?? ''}
                  onChange={v => set('headerImage', v || null)} purpose="banner" previewClassName="h-24" />
              </div>
              <div className="md:col-span-2">
                <ImageUploadField label="Hanging decoration (optional — transparent PNG: lights, diyas, toran)" value={config.decorationImage ?? ''}
                  onChange={v => set('decorationImage', v || null)} purpose="banner" previewClassName="h-20" />
              </div>
            </div>
          </Card>

          {/* Page under the header */}
          <Card title="Page under the header" sub="Carries the festival feel below the header — page top, category tiles, Food tab">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <ColorField label="Light page colour" value={config.pageTint ?? '#FFFBF7'} onChange={v => set('pageTint', v)} />
                <p className="text-[11px] text-slate-400 mt-1">Keep it very light (like #DCFCE7) so products stay easy to read.</p>
                {config.pageTint && <button type="button" onClick={() => set('pageTint', null)} className="text-xs text-slate-500 hover:text-red-500 mt-1">Use normal page colour</button>}
              </div>
              <div>
                <ImageUploadField label="Faint page pattern (optional)" value={config.pageImage ?? ''}
                  onChange={v => set('pageImage', v || null)} purpose="banner" previewClassName="h-16" />
              </div>
            </div>
          </Card>

          {/* Animation */}
          <Card title="Animation" sub="Lottie animation — fireworks, snow, flowers. Free ones on lottiefiles.com (download “Lottie JSON”)">
            <AnimationField url={config.animationUrl} onChange={v => set('animationUrl', v)} />
            {config.animationUrl && (
              <div className="mt-3">
                <label className={LABEL}>How it plays</label>
                <div className="flex flex-wrap gap-2">
                  <Chip on={config.animationMode === 'header'} onClick={() => set('animationMode', 'header')}>Keeps playing in the header</Chip>
                  <Chip on={config.animationMode === 'once'} onClick={() => set('animationMode', 'once')}>Full screen, once when the app opens</Chip>
                </div>
              </div>
            )}
          </Card>

          {/* Words */}
          <Card title="Words">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Greeting on the header</label>
                <Input value={config.greeting ?? ''} onChange={e => set('greeting', e.target.value || null)} placeholder="Happy Diwali 🪔" maxLength={60} />
              </div>
              <div>
                <label className={LABEL}>Search bar text</label>
                <Input value={config.searchPlaceholder ?? ''} onChange={e => set('searchPlaceholder', e.target.value || null)} placeholder="Search for diyas, sweets…" maxLength={60} />
              </div>
            </div>
          </Card>

          {/* Festival section */}
          <Card title="Festival store on Home" sub="Banner, “Shop by” tiles and hand-picked products at the top of the home page"
            right={<Chip on={config.section.enabled} onClick={() => setSection({ enabled: !config.section.enabled })}>{config.section.enabled ? 'Shown' : 'Hidden'}</Chip>}>
            {config.section.enabled ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Title</label>
                  <Input value={config.section.title ?? ''} onChange={e => setSection({ title: e.target.value || null })} placeholder="Diwali Sweets & Gifts" maxLength={60} />
                </div>
                <div>
                  <label className={LABEL}>Subtitle</label>
                  <Input value={config.section.subtitle ?? ''} onChange={e => setSection({ subtitle: e.target.value || null })} placeholder="Mithai, dry fruits and pooja essentials" maxLength={120} />
                </div>
                <ColorField label="Section background colour" value={config.section.bgColor} onChange={v => setSection({ bgColor: v })} />
                <div>
                  <ImageUploadField label="Section background picture (optional)" value={config.section.bgImage ?? ''}
                    onChange={v => setSection({ bgImage: v || null })} purpose="banner" previewClassName="h-16" />
                </div>
                <div className="md:col-span-2">
                  <ImageUploadField label="Store banner (wide picture — art on the right, the title sits on its left)" value={config.section.bannerImage ?? ''}
                    onChange={v => setSection({ bannerImage: v || null })} purpose="banner" previewClassName="h-24" />
                </div>
                <div className="md:col-span-2">
                  <TilesEditor tiles={config.section.tiles} onChange={tiles => setSection({ tiles })} />
                </div>
                <div className="md:col-span-2">
                  <ProductPicker picked={picked} onChange={setPicked} />
                </div>
              </div>
            ) : <p className="text-sm text-slate-500">Turn on to add a festival product row (up to 30 products).</p>}
          </Card>
        </div>

        {/* Live preview */}
        <div className="xl:sticky xl:top-4">
          <div className="text-xs font-semibold text-slate-500 mb-2 text-center">Live preview — app home</div>
          <PhonePreview config={config} products={picked} />
        </div>
      </div>
    </div>
  );
}

// ── Pieces ────────────────────────────────────────────────────

function Card({ title, sub, right, children }: { title: string; sub?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-slate-900">{title}</h3>
          {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${on ? 'bg-[#0F1923] border-[#0F1923] text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
      {children}
    </button>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value.toUpperCase())}
          className="w-11 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white" />
        <Input value={text} maxLength={7} className="font-mono uppercase"
          onChange={e => { const v = e.target.value; setText(v); if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v.toUpperCase()); }} />
      </div>
    </div>
  );
}

function useLottieData(url: string | null) {
  const [data, setData] = useState<object | null>(null);
  useEffect(() => {
    if (!url) { setData(null); return; }
    let alive = true;
    fetch(url).then(r => r.json()).then(j => alive && setData(j)).catch(() => alive && setData(null));
    return () => { alive = false; };
  }, [url]);
  return data;
}

function AnimationField({ url, onChange }: { url: string | null; onChange: (v: string | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const data = useLottieData(url);
  const upload = async (f: File) => {
    setBusy(true); setErr('');
    try { onChange(await themeApi.uploadAnimation(f)); }
    catch (e: any) { setErr(e?.response?.data?.message ?? 'Upload failed'); }
    finally { setBusy(false); if (ref.current) ref.current.value = ''; }
  };
  return (
    <div>
      <input ref={ref} type="file" accept=".json,application/json" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }} />
      {url ? (
        <div className="flex items-center gap-4">
          <div className="w-28 h-28 rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden">
            {data ? <Lottie animationData={data} loop className="w-full h-full" /> : <Loader2 size={18} className="animate-spin text-slate-500" />}
          </div>
          <div className="flex flex-col gap-2">
            <Button size="sm" variant="outline" onClick={() => ref.current?.click()} disabled={busy}><Upload size={13} /> Replace</Button>
            <Button size="sm" variant="ghost" className="text-red-500" onClick={() => onChange(null)}><Trash2 size={13} /> Remove</Button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()} disabled={busy}
          className="w-full border-2 border-dashed border-slate-200 rounded-xl py-6 flex flex-col items-center gap-1 text-slate-500 hover:border-[#EA580C] hover:bg-orange-50/40">
          {busy ? <Loader2 size={20} className="animate-spin" /> : <Film size={22} className="text-slate-300" />}
          <span className="text-sm font-semibold">{busy ? 'Uploading…' : 'Upload Lottie animation (.json)'}</span>
          <span className="text-[11px] text-slate-400">Max 2 MB · keep it light so phones stay fast</span>
        </button>
      )}
      {err && <p className="text-xs text-red-500 mt-2">{err}</p>}
    </div>
  );
}

function TilesEditor({ tiles, onChange }: { tiles: ThemeConfig['section']['tiles']; onChange: (t: ThemeConfig['section']['tiles']) => void }) {
  const update = (i: number, p: Partial<ThemeConfig['section']['tiles'][number]>) => onChange(tiles.map((t, j) => (j === i ? { ...t, ...p } : t)));
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className={LABEL + ' mb-0'}>“Shop by” tiles ({tiles.length}/8) — tapping one searches the word you set</label>
        <Button size="sm" variant="outline" disabled={tiles.length >= 8}
          onClick={() => onChange([...tiles, { label: '', image: '', query: null }])}><Plus size={13} /> Add tile</Button>
      </div>
      {tiles.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center text-xs text-slate-400">No tiles — pick a festival above to get a ready-made set</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {tiles.map((t, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-xl border border-slate-200">
              <div className="w-24 shrink-0">
                <ImageUploadField label="" value={t.image} onChange={v => update(i, { image: v })} aspectRatio={1} previewClassName="h-20" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <Input value={t.label} maxLength={24} placeholder="Label, e.g. Diyas & Candles" onChange={e => update(i, { label: e.target.value })} />
                <Input value={t.query ?? ''} maxLength={40} placeholder="Search word, e.g. diya" onChange={e => update(i, { query: e.target.value || null })} />
                <div className="flex gap-1">
                  <button type="button" className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30" disabled={i === 0}
                    onClick={() => { const n = [...tiles]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; onChange(n); }}><ChevronUp size={15} /></button>
                  <button type="button" className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30" disabled={i === tiles.length - 1}
                    onClick={() => { const n = [...tiles]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; onChange(n); }}><ChevronDown size={15} /></button>
                  <button type="button" className="ml-auto p-1 text-slate-400 hover:text-red-500" onClick={() => onChange(tiles.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductPicker({ picked, onChange }: { picked: ThemeProduct[]; onChange: (p: ThemeProduct[]) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<ThemeProduct[]>([]);
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setSearching(true);
      themeApi.searchProducts(q).then(setResults).catch(() => setResults([])).finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);
  const ids = new Set(picked.map(p => p.id));
  const move = (i: number, d: -1 | 1) => {
    const next = [...picked];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div>
        <label className={LABEL}>Find products</label>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name…" className="pl-8" />
        </div>
        <div className="mt-2 border border-slate-100 rounded-xl max-h-72 overflow-y-auto divide-y divide-slate-100">
          {searching && <div className="p-3 text-xs text-slate-400 flex items-center gap-2"><Loader2 size={13} className="animate-spin" /> Searching…</div>}
          {!searching && results.length === 0 && <div className="p-3 text-xs text-slate-400">No products found</div>}
          {results.map(p => (
            <div key={p.id} className="flex items-center gap-2 p-2">
              <ProductThumb p={p} />
              <div className="flex-1 min-w-0 text-sm">
                <div className="truncate font-medium text-slate-800">{p.name}</div>
                <div className="text-xs text-slate-400">₹{p.price}{p.unit ? ` · ${p.unit}` : ''}</div>
              </div>
              <Button size="sm" variant={ids.has(p.id) ? 'ghost' : 'outline'} disabled={ids.has(p.id) || picked.length >= 30}
                onClick={() => onChange([...picked, p])}>
                {ids.has(p.id) ? 'Added' : <><Plus size={13} /> Add</>}
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div>
        <label className={LABEL}>In the section ({picked.length}/30) — shown in this order</label>
        {picked.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400">Add products from the left</div>
        ) : (
          <div className="border border-slate-100 rounded-xl max-h-80 overflow-y-auto divide-y divide-slate-100">
            {picked.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2 p-2">
                <span className="w-5 text-xs text-slate-400 text-center">{i + 1}</span>
                <ProductThumb p={p} />
                <div className="flex-1 min-w-0 text-sm truncate text-slate-800">{p.name}</div>
                <button type="button" onClick={() => move(i, -1)} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30" disabled={i === 0}><ChevronUp size={15} /></button>
                <button type="button" onClick={() => move(i, 1)} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30" disabled={i === picked.length - 1}><ChevronDown size={15} /></button>
                <button type="button" onClick={() => onChange(picked.filter(x => x.id !== p.id))} className="p-1 text-slate-400 hover:text-red-500"><X size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductThumb({ p }: { p: ThemeProduct }) {
  return (
    <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
      {p.imageUrl && <img src={p.imageUrl} alt="" className="w-full h-full object-contain" />}
    </div>
  );
}

/** Rough phone mock of the app home with the theme applied. */
function PhonePreview({ config, products }: { config: ThemeConfig; products: ThemeProduct[] }) {
  const lottie = useLottieData(config.animationUrl);
  const light = config.headerTextColor === 'light';
  const fg = light ? 'text-white' : 'text-slate-900';
  const tabs = useMemo(() => ['All', 'Fruits', 'Dairy', 'Snacks', 'Sweets'], []);
  return (
    <div className="mx-auto w-[320px] rounded-[2.2rem] border-[10px] border-slate-900 bg-white shadow-2xl overflow-hidden">
      <div className="h-[600px] overflow-y-auto bg-[#FFFBF7] relative">
        {/* Header */}
        <div className="relative overflow-hidden" style={{ background: config.headerColor }}>
          {config.headerImage && <img src={config.headerImage} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          {config.animationUrl && config.animationMode === 'header' && lottie && (
            <div className="absolute inset-0 pointer-events-none"><Lottie animationData={lottie} loop className="w-full h-full" /></div>
          )}
          {config.decorationImage && <img src={config.decorationImage} alt="" className="absolute top-0 inset-x-0 w-full h-16 object-cover object-top pointer-events-none" />}
          <div className="relative px-4 pt-8 pb-3">
            {config.greeting && (
              <div className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mb-1 ${light ? 'bg-white/20 text-white' : 'bg-black/10 text-slate-900'}`}>{config.greeting}</div>
            )}
            <div className={`text-[11px] font-semibold opacity-90 ${fg}`}>Jhatpats in</div>
            <div className={`text-xl font-extrabold leading-tight ${fg}`}>10 minutes</div>
            <div className={`text-[11px] opacity-90 truncate ${fg}`}>Home · Sector 45, Faridabad ▾</div>
            <div className="mt-3 h-10 rounded-full bg-white flex items-center gap-2 px-3 text-xs text-slate-400 shadow-sm">
              <Search size={14} /> <span className="flex-1 truncate">{config.searchPlaceholder || 'Search "milk"'}</span> <Mic size={14} />
            </div>
          </div>
        </div>
        {/* Page tint + pattern under the header */}
        {(config.pageTint || config.pageImage) && (
          <div className="absolute inset-x-0 top-[190px] h-[360px] pointer-events-none"
            style={{ background: `linear-gradient(${config.pageTint ?? '#FFFBF7'}, #FFFBF7)` }}>
            {config.pageImage && <img src={config.pageImage} alt="" className="w-full h-full object-cover opacity-60 [mask-image:linear-gradient(black,transparent)]" />}
          </div>
        )}
        {/* Tabs */}
        <div className="relative flex gap-4 px-4 py-2 border-b border-slate-200 text-[11px] font-semibold" style={{ background: config.pageTint ?? '#FFFFFF' }}>
          {tabs.map((t, i) => (
            <div key={t} className="flex flex-col items-center gap-1" style={{ color: i === 0 ? config.accentColor : '#A8A29E' }}>
              <span className="w-5 h-5 rounded-md" style={{ background: i === 0 ? config.accentColor : '#E7E5E4', opacity: i === 0 ? 0.9 : 1 }} />
              {t}
              <span className="h-0.5 w-full rounded" style={{ background: i === 0 ? config.accentColor : 'transparent' }} />
            </div>
          ))}
        </div>
        {/* Festival store */}
        {config.section.enabled && (
          <div className="m-3 rounded-2xl overflow-hidden relative z-[1] border shadow-sm" style={{ background: config.section.bgColor, borderColor: `${config.accentColor}33` }}>
            {config.section.bgImage && <img src={config.section.bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />}
            <div className="relative">
              {config.section.bannerImage ? (
                <div className="relative aspect-[1200/420]">
                  <img src={config.section.bannerImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-y-0 left-0 w-[60%] p-3 flex flex-col justify-center">
                    <span className="self-start text-[7px] font-extrabold tracking-wider text-white px-1.5 py-0.5 rounded" style={{ background: config.accentColor }}>FESTIVE STORE</span>
                    <div className="font-black text-[13px] leading-tight text-slate-900 mt-1">{config.section.title || 'Festival store'}</div>
                    {config.section.subtitle && <div className="text-[9px] text-slate-600 leading-snug line-clamp-2">{config.section.subtitle}</div>}
                  </div>
                </div>
              ) : (
                <div className="p-3">
                  <div className="font-extrabold text-sm text-slate-900">{config.section.title || 'Festival picks'}</div>
                  {config.section.subtitle && <div className="text-[11px] text-slate-600">{config.section.subtitle}</div>}
                </div>
              )}
              {config.section.tiles.length > 0 && (
                <div className="px-2.5 pt-2">
                  <div className="text-[8px] font-extrabold text-slate-500 tracking-wide mb-1">SHOP BY NEED</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {config.section.tiles.map((t, i) => (
                      <div key={i} className="text-center">
                        <img src={t.image} alt="" className="w-full aspect-square object-cover rounded-lg border-2 border-white shadow-sm" />
                        <div className="text-[8px] font-bold text-slate-800 leading-tight mt-0.5 line-clamp-2">{t.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 p-2.5 overflow-hidden">
                {(products.length ? products : Array.from({ length: 3 }, (_, i) => ({ id: -i, name: 'Product', imageUrl: null, price: 0, unit: null }))).slice(0, 4).map(p => (
                  <div key={p.id} className="w-[86px] shrink-0 bg-white rounded-xl p-1.5 shadow-sm">
                    <div className="h-14 rounded-lg bg-slate-50 overflow-hidden">{p.imageUrl && <img src={p.imageUrl} alt="" className="w-full h-full object-contain" />}</div>
                    <div className="text-[10px] font-semibold text-slate-800 truncate mt-1">{p.name}</div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] font-bold">{p.price ? `₹${p.price}` : ''}</span>
                      <span className="text-[9px] font-bold border rounded px-1.5" style={{ color: '#16A34A', borderColor: '#16A34A' }}>ADD</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Rest of home (placeholder) */}
        <div className="relative px-3 space-y-3 pb-6 mt-3">
          <div className="h-24 rounded-2xl bg-slate-200/70" />
          <div className="grid grid-cols-4 gap-2">{Array.from({ length: 8 }, (_, i) => <div key={i} className="h-14 rounded-xl" style={{ background: config.pageTint ?? '#FFEDD5' }} />)}</div>
          <div className="h-32 rounded-2xl bg-slate-200/50" />
        </div>
        {config.animationUrl && config.animationMode === 'once' && lottie && (
          <div className="absolute inset-0 pointer-events-none"><Lottie animationData={lottie} loop className="w-full h-full" /></div>
        )}
      </div>
    </div>
  );
}
