import React, { useState, useEffect } from 'react';
import { Save, Loader2, AlertCircle, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { settingsApi, Settings } from './api';

interface WhyItem { icon: string; title: string; desc: string }

const DEFAULT_WHY: WhyItem[] = [
  { icon: '⚡', title: '10 Min Delivery',   desc: 'Get your order delivered to your doorstep in minutes from nearby dark stores.' },
  { icon: '🛡️', title: 'Best Prices',        desc: 'Best price destination with offers directly from the manufacturers.' },
  { icon: '🎁', title: 'Wide Assortment',   desc: 'Choose from thousands of products across all categories.' },
];

const SETTINGS_GROUPS = [
  {
    title: 'Footer Content',
    fields: [
      { key: 'footer_tagline',  label: 'Brand Tagline',          type: 'text',   hint: 'Shown below the logo in footer' },
      { key: 'company_address', label: 'Company Address',         type: 'text',   hint: 'City, State shown in footer contact block' },
      { key: 'copyright_text',  label: 'Copyright Text',          type: 'text',   hint: 'Bottom bar left side (include the © symbol)' },
      { key: 'footer_badge',    label: 'Footer Badge Text',       type: 'text',   hint: 'Bottom bar right side (e.g. "10-minute delivery · 30,000+ products")' },
    ]
  },
  {
    title: 'Contact & Support',
    fields: [
      { key: 'support_email', label: 'Support Email', type: 'email', hint: 'Customer support email shown in footer' },
      { key: 'support_phone', label: 'Support Phone', type: 'tel',   hint: 'Toll-free number shown in footer' },
    ]
  },
  {
    title: 'Delivery Settings',
    fields: [
      { key: 'delivery_fee',            label: 'Delivery Fee (₹)',         type: 'number', hint: 'Base delivery charge per order' },
      { key: 'free_delivery_threshold', label: 'Free Delivery Above (₹)',  type: 'number', hint: 'Orders above this amount get free delivery' },
      { key: 'handling_charge',         label: 'Handling Charge (₹)',       type: 'number', hint: 'Platform handling fee per order' },
      { key: 'max_delivery_radius',     label: 'Max Delivery Radius (km)',  type: 'number', hint: 'Maximum distance for delivery' },
    ]
  },
  {
    title: 'Auth & OTP',
    fields: [
      { key: 'otp_length',       label: 'OTP Length',           type: 'number', hint: '4 or 6 digit OTP' },
      { key: 'otp_expiry',       label: 'OTP Expiry (seconds)',  type: 'number', hint: 'Time before OTP expires' },
      { key: 'max_otp_attempts', label: 'Max OTP Attempts',      type: 'number', hint: 'Block after this many failed attempts' },
    ]
  },
  {
    title: 'App Config',
    fields: [
      { key: 'app_version_min', label: 'Min App Version', type: 'text', hint: 'Force update below this version' },
    ]
  },
];

export function SettingsPage() {
  const [values, setValues]   = useState<Settings>({});
  const [whyItems, setWhyItems] = useState<WhyItem[]>(DEFAULT_WHY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [status, setStatus]   = useState<'idle' | 'saved' | 'error'>('idle');
  const [error, setError]     = useState('');

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

  return (
    <div className="max-w-2xl">
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
          <AlertCircle size={14} />{error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading settings…
        </div>
      ) : (
        <div className="space-y-4">
          {SETTINGS_GROUPS.map(group => (
            <div key={group.title} className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="font-semibold text-slate-800 mb-4">{group.title}</h3>
              <div className="space-y-4">
                {group.fields.map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
                    <Input
                      type={field.type}
                      value={values[field.key] ?? ''}
                      onChange={e => set(field.key, e.target.value)}
                      placeholder="—"
                    />
                    <p className="text-xs text-slate-400 mt-1">{field.hint}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* ── Why Choose Us ── */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-800">Why Choose Us</h3>
                <p className="text-xs text-slate-400 mt-0.5">Shown on every product page — add features that build trust</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setWhyItems(p => [...p, { icon: '✨', title: '', desc: '' }])}>
                <Plus size={14} /> Add Feature
              </Button>
            </div>
            <div className="space-y-3">
              {whyItems.map((item, i) => (
                <div key={i} className="grid grid-cols-[48px_1fr_2fr_32px] gap-2 items-start bg-slate-50 rounded-xl p-3">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Icon</label>
                    <Input value={item.icon} onChange={e => updateWhy(i, 'icon', e.target.value)}
                      className="text-center text-xl h-9" maxLength={4} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Title *</label>
                    <Input value={item.title} onChange={e => updateWhy(i, 'title', e.target.value)}
                      placeholder="e.g. Fast Delivery" className="h-9" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Description</label>
                    <Input value={item.desc} onChange={e => updateWhy(i, 'desc', e.target.value)}
                      placeholder="Short explanation..." className="h-9" />
                  </div>
                  <button onClick={() => setWhyItems(p => p.filter((_, idx) => idx !== i))}
                    className="mt-6 p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
