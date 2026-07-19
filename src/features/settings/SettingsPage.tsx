import React, { useState, useEffect } from 'react';
import {
  Save, Loader2, AlertCircle, CheckCircle2, Plus, Trash2,
  FileText, Phone, Truck, ShieldCheck, Smartphone, Sparkles,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { settingsApi, Settings } from './api';

interface WhyItem { icon: string; title: string; desc: string }

const DEFAULT_WHY: WhyItem[] = [
  { icon: '⚡', title: '10 Min Delivery',  desc: 'Get your order delivered to your doorstep in minutes from nearby dark stores.' },
  { icon: '🛡️', title: 'Best Prices',      desc: 'Best price destination with offers directly from the manufacturers.' },
  { icon: '🎁', title: 'Wide Assortment', desc: 'Choose from thousands of products across all categories.' },
];

// ── Tab definitions ─────────────────────────────────────────────────────────
const TABS = [
  { id: 'branding',  label: 'Branding',          Icon: FileText    },
  { id: 'contact',   label: 'Contact & Support',  Icon: Phone       },
  { id: 'delivery',  label: 'Delivery',            Icon: Truck       },
  { id: 'auth',      label: 'Auth & OTP',          Icon: ShieldCheck },
  { id: 'app',       label: 'App Config',          Icon: Smartphone  },
  { id: 'why',       label: 'Why Choose Us',       Icon: Sparkles    },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ── Field groups per tab ─────────────────────────────────────────────────────
const GROUPS: Record<TabId, { label: string; key: string; type: string; hint: string }[]> = {
  branding: [
    { key: 'footer_tagline',  label: 'Brand Tagline',        type: 'text',  hint: 'Shown below the logo in footer' },
    { key: 'company_address', label: 'Company Address',       type: 'text',  hint: 'City, State shown in footer contact block' },
    { key: 'copyright_text',  label: 'Copyright Text',        type: 'text',  hint: 'Bottom bar left side (include the © symbol)' },
    { key: 'footer_badge',    label: 'Footer Badge Text',     type: 'text',  hint: 'Bottom bar right side e.g. "10-minute delivery · 30,000+ products"' },
  ],
  contact: [
    { key: 'support_email', label: 'Support Email', type: 'email', hint: 'Customer support email shown in footer' },
    { key: 'support_phone', label: 'Support Phone', type: 'tel',   hint: 'Toll-free number shown in footer' },
  ],
  delivery: [
    { key: 'delivery_fee',            label: 'Delivery Fee (₹)',         type: 'number', hint: 'Base delivery charge per order' },
    { key: 'free_delivery_threshold', label: 'Free Delivery Above (₹)',  type: 'number', hint: 'Orders above this amount get free delivery' },
    { key: 'handling_charge',         label: 'Handling Charge (₹)',      type: 'number', hint: 'Platform handling fee per order' },
    { key: 'max_delivery_radius',     label: 'Max Delivery Radius (km)', type: 'number', hint: 'Maximum distance for delivery' },
  ],
  auth: [
    { key: 'otp_length',       label: 'OTP Length',            type: 'number', hint: '4 or 6 digit OTP' },
    { key: 'otp_expiry',       label: 'OTP Expiry (seconds)',  type: 'number', hint: 'Time before OTP expires' },
    { key: 'max_otp_attempts', label: 'Max OTP Attempts',      type: 'number', hint: 'Block after this many failed attempts' },
  ],
  app: [
    { key: 'app_version_min', label: 'Min App Version', type: 'text', hint: 'Force update below this version' },
  ],
  why: [],   // handled separately
};

// ── FieldRow ─────────────────────────────────────────────────────────────────
function FieldRow({
  field,
  value,
  onChange,
}: {
  field: { label: string; key: string; type: string; hint: string };
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
      <Input
        type={field.type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="—"
      />
      <p className="text-xs text-slate-400 mt-1">{field.hint}</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('branding');
  const [values, setValues]       = useState<Settings>({});
  const [whyItems, setWhyItems]   = useState<WhyItem[]>(DEFAULT_WHY);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [status, setStatus]       = useState<'idle' | 'saved' | 'error'>('idle');
  const [error, setError]         = useState('');

  useEffect(() => {
    settingsApi.getAll()
      .then(data => {
        setValues(data);
        if (data.why_choose_us) {
          try { setWhyItems(JSON.parse(data.why_choose_us)); } catch {}
        }
      })
      .catch(() => setError('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: string, val: string) => setValues(prev => ({ ...prev, [key]: val }));

  const updateWhy = (i: number, key: keyof WhyItem, val: string) =>
    setWhyItems(prev => prev.map((item, idx) => idx === i ? { ...item, [key]: val } : item));

  const handleSave = async () => {
    setSaving(true); setStatus('idle'); setError('');
    try {
      await settingsApi.save({ ...values, why_choose_us: JSON.stringify(whyItems) });
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to save settings');
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const fields = GROUPS[activeTab];

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Settings"
        subtitle="Platform configuration"
        breadcrumbs={[{ label: 'Home' }, { label: 'Settings' }]}
        action={
          <Button size="sm" onClick={handleSave} disabled={saving || loading} variant={status === 'saved' ? 'teal' : 'default'}>
            {saving
              ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
              : status === 'saved'
              ? <><CheckCircle2 size={14} /> Saved!</>
              : <><Save size={14} /> Save Changes</>
            }
          </Button>
        }
      />

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading settings…
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">

          {/* ── Tab Bar ── */}
          <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50/60">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-indigo-600 text-indigo-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/60'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* ── Tab Content ── */}
          <div className="p-6">

            {/* All tabs except Why Choose Us */}
            {activeTab !== 'why' && (
              <div className="space-y-5">
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

            {/* Why Choose Us tab */}
            {activeTab === 'why' && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-sm text-slate-500">
                      These features appear on every product page to build customer trust.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setWhyItems(p => [...p, { icon: '✨', title: '', desc: '' }])}
                  >
                    <Plus size={14} /> Add Feature
                  </Button>
                </div>

                {whyItems.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">
                    No features added yet. Click "Add Feature" to start.
                  </p>
                )}

                <div className="space-y-3">
                  {whyItems.map((item, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[52px_1fr_2fr_36px] gap-3 items-start bg-slate-50 border border-slate-100 rounded-xl p-4"
                    >
                      {/* Icon */}
                      <div>
                        <label className="text-xs text-slate-400 block mb-1.5">Icon</label>
                        <Input
                          value={item.icon}
                          onChange={e => updateWhy(i, 'icon', e.target.value)}
                          className="text-center text-xl h-9 px-1"
                          maxLength={4}
                        />
                      </div>
                      {/* Title */}
                      <div>
                        <label className="text-xs text-slate-400 block mb-1.5">Title</label>
                        <Input
                          value={item.title}
                          onChange={e => updateWhy(i, 'title', e.target.value)}
                          placeholder="e.g. Fast Delivery"
                          className="h-9"
                        />
                      </div>
                      {/* Description */}
                      <div>
                        <label className="text-xs text-slate-400 block mb-1.5">Description</label>
                        <Input
                          value={item.desc}
                          onChange={e => updateWhy(i, 'desc', e.target.value)}
                          placeholder="Short explanation..."
                          className="h-9"
                        />
                      </div>
                      {/* Delete */}
                      <button
                        onClick={() => setWhyItems(p => p.filter((_, idx) => idx !== i))}
                        className="mt-7 p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
