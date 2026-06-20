import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

const SETTINGS_GROUPS = [
  {
    title: 'Delivery Settings',
    fields: [
      { key: 'delivery_fee',             label: 'Delivery Fee (₹)',          type: 'number', hint: 'Base delivery charge per order' },
      { key: 'free_delivery_threshold',  label: 'Free Delivery Above (₹)',   type: 'number', hint: 'Orders above this amount get free delivery' },
      { key: 'handling_charge',          label: 'Handling Charge (₹)',        type: 'number', hint: 'Platform handling fee per order' },
      { key: 'max_delivery_radius',      label: 'Max Delivery Radius (km)',   type: 'number', hint: 'Maximum distance for delivery' },
    ]
  },
  {
    title: 'Auth & OTP',
    fields: [
      { key: 'otp_length',       label: 'OTP Length',            type: 'number', hint: '4 or 6 digit OTP' },
      { key: 'otp_expiry',       label: 'OTP Expiry (seconds)',   type: 'number', hint: 'Time before OTP expires' },
      { key: 'max_otp_attempts', label: 'Max OTP Attempts',       type: 'number', hint: 'Block after this many failed attempts' },
    ]
  },
  {
    title: 'App Config',
    fields: [
      { key: 'support_email',   label: 'Support Email',    type: 'email', hint: 'Customer support email' },
      { key: 'support_phone',   label: 'Support Phone',    type: 'tel',   hint: 'Toll-free support number' },
      { key: 'app_version_min', label: 'Min App Version',  type: 'text',  hint: 'Force update below this version' },
    ]
  }
];

export function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Settings"
        subtitle="Platform configuration"
        breadcrumbs={[{ label: 'Home' }, { label: 'Settings' }]}
        action={
          <Button size="sm" onClick={handleSave} variant={saved ? 'teal' : 'default'}>
            <Save size={14} /> {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        }
      />
      <div className="space-y-4">
        {SETTINGS_GROUPS.map(group => (
          <div key={group.title} className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-800 mb-4">{group.title}</h3>
            <div className="space-y-4">
              {group.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
                  <Input type={field.type} placeholder="—" />
                  <p className="text-xs text-slate-400 mt-1">{field.hint}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
