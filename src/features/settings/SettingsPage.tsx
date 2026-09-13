import React, { useState, useEffect, useMemo } from 'react';
import {
  Save, Loader2, AlertCircle, CheckCircle2, Plus, Trash2,
  FileText, Phone, Truck, ShieldCheck, Smartphone, Sparkles, Clock,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { cn } from '../../lib/utils';
import { settingsApi, Settings } from './api';

// ── Why-Choose-Us item ──────────────────────────────────────────────────────
interface WhyItem { icon: string; title: string; desc: string }

const DEFAULT_WHY: WhyItem[] = [
  { icon: '⚡', title: '10 Min Delivery',  desc: 'Get your order delivered to your doorstep in minutes from nearby dark stores.' },
  { icon: '🛡️', title: 'Best Prices',      desc: 'Best price destination with offers directly from the manufacturers.' },
  { icon: '🎁', title: 'Wide Assortment', desc: 'Choose from thousands of products across all categories.' },
];

// ── Delivery Shift ───────────────────────────────────────────────────────────
interface Shift { name: string; open: string; close: string }

const DEFAULT_SHIFTS: Shift[] = [
  { name: 'Morning', open: '08:00', close: '14:00' },
  { name: 'Evening', open: '16:00', close: '23:00' },
];

// ── Tab definitions ─────────────────────────────────────────────────────────
const TABS = [
  { id: 'branding', label: 'Branding',         desc: 'Footer text, address & copyright',     Icon: FileText    },
  { id: 'contact',  label: 'Contact & Support', desc: 'Support email & phone number',         Icon: Phone       },
  { id: 'delivery', label: 'Delivery',          desc: 'Fees, thresholds & delivery radius',   Icon: Truck       },
  { id: 'auth',     label: 'Auth & OTP',        desc: 'OTP length, expiry & attempt limits',  Icon: ShieldCheck },
  { id: 'app',      label: 'App Config',        desc: 'Minimum supported app version',        Icon: Smartphone  },
  { id: 'why',      label: 'Why Choose Us',     desc: 'Trust badges shown on product pages',  Icon: Sparkles    },
  { id: 'service',  label: 'Service Hours',     desc: 'Operational hours & availability',     Icon: Clock       },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ── Field model ─────────────────────────────────────────────────────────────
interface Field {
  key: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'number';
  hint: string;
  suffix?: string;
  full?: boolean;
  options?: string[];
  computeHint?: (v: string) => string | null;
}

const GROUPS: Record<Exclude<TabId, 'why' | 'service'>, Field[]> = {
  branding: [
    { key: 'footer_tagline',  label: 'Brand Tagline',    type: 'text', full: true, hint: 'Shown below the logo in footer' },
    { key: 'company_address', label: 'Company Address',   type: 'text', full: true, hint: 'City, State shown in footer contact block' },
    { key: 'copyright_text',  label: 'Copyright Text',    type: 'text', full: true, hint: 'Bottom bar left side (include the © symbol)' },
    { key: 'footer_badge',    label: 'Footer Badge Text', type: 'text', full: true, hint: 'Bottom bar right side e.g. "10-minute delivery · 30,000+ products"' },
  ],
  contact: [
    { key: 'support_email', label: 'Support Email', type: 'email', hint: 'Customer support email shown in footer' },
    { key: 'support_phone', label: 'Support Phone', type: 'tel',   hint: 'Toll-free number shown in footer' },
  ],
  delivery: [
    { key: 'delivery_fee',            label: 'Delivery Fee',         type: 'number', suffix: '₹',  hint: 'Base delivery charge per order' },
    { key: 'free_delivery_threshold', label: 'Free Delivery Above',  type: 'number', suffix: '₹',  hint: 'Orders above this amount get free delivery' },
    { key: 'handling_charge',         label: 'Handling Charge',      type: 'number', suffix: '₹',  hint: 'Platform handling fee per order' },
    { key: 'max_delivery_radius',     label: 'Max Delivery Radius',  type: 'number', suffix: 'km', hint: 'Maximum distance for delivery' },
  ],
  auth: [
    { key: 'otp_length',       label: 'OTP Length',    type: 'number', options: ['4', '6'], hint: 'Number of digits customers enter to log in' },
    {
      key: 'otp_expiry', label: 'OTP Expiry', type: 'number', suffix: 'sec', hint: 'Time before a sent OTP stops working',
      computeHint: v => {
        const n = Number(v);
        if (!n || Number.isNaN(n)) return null;
        const m = Math.floor(n / 60), s = n % 60;
        return `≈ ${m ? `${m} min ` : ''}${s ? `${s} sec` : ''}`.trim();
      },
    },
    { key: 'max_otp_attempts', label: 'Max OTP Attempts', type: 'number', hint: 'Block further attempts after this many failures' },
  ],
  app: [
    { key: 'app_version_min', label: 'Minimum App Version', type: 'text', full: true, hint: 'Force an update on anything below this version (semver, e.g. 1.4.0)' },
  ],
};

// ── Segmented control ───────────────────────────────────────────────────────
function Segmented({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            'h-8 min-w-[64px] rounded-md px-3 text-sm font-medium transition-colors',
            value === opt ? 'bg-white text-[#EA580C] shadow-sm' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          {opt} digit
        </button>
      ))}
    </div>
  );
}

// ── FieldRow ────────────────────────────────────────────────────────────────
function FieldRow({ field, value, onChange }: { field: Field; value: string; onChange: (v: string) => void }) {
  const extraHint = field.computeHint?.(value) ?? null;

  return (
    <div className={field.full ? 'sm:col-span-2' : undefined}>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{field.label}</label>

      {field.options ? (
        <Segmented options={field.options} value={value} onChange={onChange} />
      ) : (
        <div className="relative">
          <Input
            type={field.type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="—"
            className={field.suffix ? 'pr-11' : undefined}
          />
          {field.suffix && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
              {field.suffix}
            </span>
          )}
        </div>
      )}

      <p className="mt-1.5 text-xs text-slate-400">
        {field.hint}
        {extraHint && <span className="ml-1.5 font-medium text-slate-500">· {extraHint}</span>}
      </p>
    </div>
  );
}

// ── Toggle ──────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C]',
          checked ? 'bg-[#EA580C]' : 'bg-slate-200',
        )}
      >
        <span className={cn(
          'block h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[22px]' : 'translate-x-[2px]',
        )} />
      </button>
    </div>
  );
}

// ── ShiftEditor ─────────────────────────────────────────────────────────────
function ShiftEditor({ shifts, onChange }: { shifts: Shift[]; onChange: (s: Shift[]) => void }) {
  const update = (i: number, key: keyof Shift, val: string) =>
    onChange(shifts.map((s, idx) => idx === i ? { ...s, [key]: val } : s));
  const add    = () => onChange([...shifts, { name: '', open: '09:00', close: '21:00' }]);
  const remove = (i: number) => onChange(shifts.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Delivery Shifts</p>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Plus size={12} /> Add Shift
        </button>
      </div>

      {shifts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400">
          No shifts — service available 24 hours
        </div>
      ) : (
        <div className="space-y-2">
          {shifts.map((s, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <Input
                value={s.name}
                onChange={e => update(i, 'name', e.target.value)}
                placeholder="Shift name"
                className="h-8 flex-1 text-sm"
              />
              <div className="flex items-center gap-1">
                <input
                  type="time"
                  value={s.open}
                  onChange={e => update(i, 'open', e.target.value)}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                />
                <span className="text-xs text-slate-400">–</span>
                <input
                  type="time"
                  value={s.close}
                  onChange={e => update(i, 'close', e.target.value)}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                />
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="shrink-0 rounded-lg p-1 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="mt-2 text-xs text-slate-400">
        Leave empty for 24/7. Customers see "closed" outside these windows.
      </p>
    </div>
  );
}

// ── Loading skeleton ────────────────────────────────────────────────────────
function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-5 lg:flex-row">
      <div className="h-fit space-y-1.5 rounded-2xl border border-slate-100 bg-white p-2 lg:w-72">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="flex-1 space-y-5 rounded-2xl border border-slate-100 bg-white p-6">
        <div className="h-12 w-1/3 animate-pulse rounded-lg bg-slate-100" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('branding');
  const [values, setValues]       = useState<Settings>({});
  const [whyItems, setWhyItems]   = useState<WhyItem[]>(DEFAULT_WHY);
  const [shifts, setShifts]       = useState<Shift[]>(DEFAULT_SHIFTS);
  const [initial, setInitial]     = useState<{ values: Settings; why: WhyItem[]; shifts: Shift[] } | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [status, setStatus]       = useState<'idle' | 'saved' | 'error'>('idle');
  const [error, setError]         = useState('');

  useEffect(() => {
    settingsApi.getAll()
      .then(data => {
        // Parse why_choose_us
        let why = DEFAULT_WHY;
        if (data.why_choose_us) {
          try {
            const parsed = JSON.parse(data.why_choose_us);
            if (Array.isArray(parsed)) why = parsed;
          } catch { /* keep defaults */ }
        }

        // Parse operating_hours shifts
        let parsedShifts = DEFAULT_SHIFTS;
        if (data.operating_hours) {
          try {
            const parsed = JSON.parse(data.operating_hours);
            if (parsed?.shifts && Array.isArray(parsed.shifts)) parsedShifts = parsed.shifts;
          } catch { /* keep defaults */ }
        }

        const rest: Settings = { ...data };
        delete rest.why_choose_us;
        delete rest.operating_hours;
        setValues(rest);
        setWhyItems(why);
        setShifts(parsedShifts);
        setInitial({ values: rest, why, shifts: parsedShifts });
      })
      .catch(() => setError('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const isDirty = useMemo(() => {
    if (!initial) return false;
    return JSON.stringify(values) !== JSON.stringify(initial.values)
      || JSON.stringify(whyItems) !== JSON.stringify(initial.why)
      || JSON.stringify(shifts)   !== JSON.stringify(initial.shifts);
  }, [values, whyItems, shifts, initial]);

  // Warn before leaving with unsaved edits
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const set = (key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
    setStatus('idle');
  };

  const updateWhy = (i: number, key: keyof WhyItem, val: string) => {
    setWhyItems(prev => prev.map((item, idx) => (idx === i ? { ...item, [key]: val } : item)));
    setStatus('idle');
  };
  const addWhy    = () => { setWhyItems(p => [...p, { icon: '✨', title: '', desc: '' }]); setStatus('idle'); };
  const removeWhy = (i: number) => { setWhyItems(p => p.filter((_, idx) => idx !== i)); setStatus('idle'); };

  const discard = () => {
    if (!initial) return;
    setValues(initial.values);
    setWhyItems(initial.why);
    setShifts(initial.shifts);
    setStatus('idle');
    setError('');
  };

  const handleSave = async () => {
    setSaving(true); setStatus('idle'); setError('');
    try {
      await settingsApi.save({
        ...values,
        why_choose_us:   JSON.stringify(whyItems),
        operating_hours: JSON.stringify({ shifts }),
      });
      setInitial({ values: { ...values }, why: [...whyItems], shifts: [...shifts] });
      setStatus('saved');
      setTimeout(() => setStatus(s => (s === 'saved' ? 'idle' : s)), 3000);
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message ?? 'Failed to save settings');
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const activeMeta = TABS.find(t => t.id === activeTab)!;
  const fields = (activeTab === 'why' || activeTab === 'service') ? [] : GROUPS[activeTab];
  const visibleWhy = whyItems.filter(i => i.title.trim() || i.desc.trim());

  // Service Hours derived state
  const serviceEnabled = values.service_enabled !== 'false';
  const closedMessage  = values.closed_message ?? '';

  return (
    <div className="pb-24">
      <PageHeader
        title="Settings"
        subtitle="Platform configuration"
        breadcrumbs={[{ label: 'Home' }, { label: 'Settings' }]}
        action={
          <div className="flex items-center gap-3">
            {initial && !isDirty && status !== 'saved' && !loading && (
              <span className="hidden items-center gap-1.5 text-xs font-medium text-slate-400 sm:flex">
                <CheckCircle2 size={13} className="text-emerald-500" /> All changes saved
              </span>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || loading || !isDirty}
              variant={status === 'saved' ? 'teal' : 'default'}
            >
              {saving
                ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                : status === 'saved'
                ? <><CheckCircle2 size={14} /> Saved!</>
                : <><Save size={14} /> Save Changes</>}
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {loading ? (
        <SettingsSkeleton />
      ) : (
        <div className="flex flex-col gap-5 lg:flex-row">

          {/* ── Left nav rail ── */}
          <nav className="self-start lg:sticky lg:top-2 lg:w-72 lg:shrink-0">
            <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-100 bg-white p-2 lg:flex-col lg:overflow-visible">
              {TABS.map(({ id, label, desc, Icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={cn(
                      'flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors lg:w-full',
                      active ? 'bg-orange-50 text-[#EA580C]' : 'text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    <span className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                      active ? 'bg-[#EA580C] text-white' : 'bg-slate-100 text-slate-500',
                    )}>
                      <Icon size={15} />
                    </span>
                    <span className="hidden min-w-0 lg:block">
                      <span className="block text-sm font-semibold leading-tight">{label}</span>
                      <span className={cn('block truncate text-xs', active ? 'text-orange-400' : 'text-slate-400')}>{desc}</span>
                    </span>
                    <span className="whitespace-nowrap text-sm font-medium lg:hidden">{label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* ── Content panel ── */}
          <div className="min-w-0 flex-1">
            <div className="rounded-2xl border border-slate-100 bg-white">

              {/* Section header */}
              <div className="flex items-start gap-3 border-b border-slate-100 p-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#EA580C]">
                  <activeMeta.Icon size={18} />
                </span>
                <div>
                  <h2 className="font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {activeMeta.label}
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">{activeMeta.desc}</p>
                </div>
              </div>

              <div className="p-6">

                {/* Field grid */}
                {activeTab !== 'why' && activeTab !== 'service' && (
                  <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                    {fields.map(field => (
                      <FieldRow
                        key={field.key}
                        field={field}
                        value={values[field.key] ?? ''}
                        onChange={val => set(field.key, val)}
                      />
                    ))}
                  </div>
                )}

                {/* Why Choose Us */}
                {activeTab === 'why' && (
                  <div>
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                      <p className="max-w-md text-sm text-slate-500">
                        These badges appear on every product page to build customer trust. Add as many as you like.
                      </p>
                      <Button size="sm" variant="outline" onClick={addWhy}>
                        <Plus size={14} /> Add Feature
                      </Button>
                    </div>

                    {whyItems.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
                        No features yet. Use the <span className="font-medium text-slate-500">Add Feature</span> button to create one.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {whyItems.map((item, i) => (
                          <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Feature {i + 1}
                              </span>
                              <button
                                onClick={() => removeWhy(i)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 transition-colors hover:text-red-500"
                              >
                                <Trash2 size={13} /> Remove
                              </button>
                            </div>
                            <div className="grid gap-4 md:grid-cols-[76px_minmax(0,1fr)_minmax(0,1.6fr)]">
                              <div>
                                <label className="mb-1.5 block text-xs text-slate-400">Icon</label>
                                <Input
                                  value={item.icon}
                                  onChange={e => updateWhy(i, 'icon', e.target.value)}
                                  className="h-9 px-1 text-center text-xl"
                                  maxLength={4}
                                />
                              </div>
                              <div>
                                <label className="mb-1.5 block text-xs text-slate-400">Title</label>
                                <Input
                                  value={item.title}
                                  onChange={e => updateWhy(i, 'title', e.target.value)}
                                  placeholder="e.g. Fast Delivery"
                                  className="h-9"
                                />
                              </div>
                              <div>
                                <label className="mb-1.5 block text-xs text-slate-400">Description</label>
                                <Input
                                  value={item.desc}
                                  onChange={e => updateWhy(i, 'desc', e.target.value)}
                                  placeholder="Short explanation shown under the title…"
                                  className="h-9"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Live preview */}
                    {visibleWhy.length > 0 && (
                      <div className="mt-6 border-t border-slate-100 pt-6">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Preview</p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {visibleWhy.map((item, i) => (
                            <div key={i} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xl">
                                {item.icon}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800">{item.title || 'Untitled'}</p>
                                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{item.desc || 'No description'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Service Hours ── */}
                {activeTab === 'service' && (
                  <div className="space-y-6">

                    {/* Manual kill-switch */}
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Availability</p>
                      <Toggle
                        checked={serviceEnabled}
                        onChange={v => { set('service_enabled', v ? 'true' : 'false'); }}
                        label="Service Active"
                        hint={serviceEnabled
                          ? 'Service is live. Customers can place orders.'
                          : 'Service is paused. All customers see a closed message.'}
                      />
                      {!serviceEnabled && (
                        <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700">
                          ⚠️ Service is manually paused. This overrides operating hours. Toggle on to resume.
                        </div>
                      )}
                    </div>

                    {/* Closed message */}
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Closed Message</p>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Message shown when closed</label>
                        <Input
                          value={closedMessage}
                          onChange={e => set('closed_message', e.target.value)}
                          placeholder="We're closed right now. Back soon! 🙏"
                        />
                        <p className="mt-1.5 text-xs text-slate-400">Shown on app & web home screen when service is unavailable.</p>
                      </div>
                    </div>

                    {/* Delivery shifts */}
                    <div>
                      <ShiftEditor
                        shifts={shifts}
                        onChange={s => { setShifts(s); setStatus('idle'); }}
                      />
                    </div>

                    {/* Live status preview */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Current Status Preview</p>
                      {!serviceEnabled ? (
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                          <span className="text-sm font-semibold text-red-600">Closed (manually paused)</span>
                        </div>
                      ) : shifts.length === 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                          <span className="text-sm font-semibold text-emerald-600">Open 24/7</span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {shifts.map((s, i) => (
                            <div key={i} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs">
                              <Clock size={11} className="text-slate-400" />
                              <span className="font-medium text-slate-700">{s.name || `Shift ${i + 1}`}</span>
                              <span className="text-slate-400">{s.open} – {s.close}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating unsaved-changes bar ── */}
      {isDirty && !loading && (
        <div className="fixed bottom-6 left-4 right-4 z-30 flex justify-center lg:left-auto lg:right-8 lg:justify-end">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 shadow-xl">
            <span className="flex items-center gap-2 text-sm font-medium text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
              Unsaved changes
            </span>
            <button
              onClick={discard}
              disabled={saving}
              className="rounded-lg px-2 py-1 text-xs font-medium text-slate-300 transition-colors hover:text-white disabled:opacity-50"
            >
              Discard
            </button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save</>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
