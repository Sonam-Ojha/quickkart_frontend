import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Calendar, Shield, Wallet,
  Gift, Edit2, Save, X, Eye, EyeOff, Loader2,
  AlertCircle, CheckCircle, Copy, Check, Lock,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuthStore } from '../../store/auth.store';
import { profileApi, ProfileData, UpdateProfilePayload } from './api';
import ImageUploadField from '../../components/common/ImageUploadField';

// ── Helpers ───────────────────────────────────────────────

const ROLE_META: Record<string, { label: string; color: string }> = {
  super_admin: { label: 'Super Admin',      color: 'bg-purple-100 text-purple-700' },
  ops_manager: { label: 'Ops Manager',      color: 'bg-blue-100 text-blue-700' },
  catalog_mgr: { label: 'Catalog Manager',  color: 'bg-orange-100 text-orange-700' },
  marketing:   { label: 'Marketing',        color: 'bg-pink-100 text-pink-700' },
  support:     { label: 'Support',          color: 'bg-teal-100 text-teal-700' },
  finance:     { label: 'Finance',          color: 'bg-green-100 text-green-700' },
  user:        { label: 'User',             color: 'bg-slate-100 text-slate-600' },
};

function money(paise: number) {
  return '₹' + (paise / 100).toFixed(2);
}

function Avatar({ name, avatar, size = 'lg' }: { name: string; avatar?: string | null; size?: 'sm' | 'lg' }) {
  const sz = size === 'lg' ? 'w-24 h-24 text-3xl' : 'w-10 h-10 text-base';
  if (avatar) return <img src={avatar} alt={name} className={`${sz} rounded-full object-cover`} />;
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-[#EA580C] to-[#0F766E] flex items-center justify-center text-white font-bold`}>
      {name?.[0]?.toUpperCase() ?? 'A'}
    </div>
  );
}

// ── Copy button ───────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handle} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
      {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
    </button>
  );
}

// ── Info Row ──────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-slate-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <div className="text-sm font-medium text-slate-800 break-all">{value}</div>
      </div>
    </div>
  );
}

// ── Tab: Edit Profile ─────────────────────────────────────

function EditProfileTab({ profile, onSaved }: { profile: ProfileData; onSaved: (p: ProfileData) => void }) {
  const { updateUser } = useAuthStore();
  const [form, setForm] = useState<UpdateProfilePayload>({
    name: profile.name,
    email: profile.email,
    mobile: profile.mobile ?? '',
    avatar: profile.avatar ?? '',
    dob: profile.dob ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const set = (k: keyof UpdateProfilePayload, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) { setError('Name is required'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const updated = await profileApi.update(form);
      updateUser({ name: updated.name, email: updated.email, avatar: updated.avatar ?? undefined });
      onSaved({ ...profile, ...updated });
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to update profile');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          <AlertCircle size={14} />{error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl text-sm text-green-600">
          <CheckCircle size={14} />{success}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Full Name *</label>
          <Input value={form.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="Your name" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Email *</label>
          <Input type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Mobile</label>
          <Input type="tel" value={form.mobile ?? ''} onChange={e => set('mobile', e.target.value)} placeholder="+91 XXXXX XXXXX" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Date of Birth</label>
          <Input type="date" value={form.dob ?? ''} onChange={e => set('dob', e.target.value)} />
        </div>
      </div>
      <div>
        <ImageUploadField
          label="Avatar"
          value={form.avatar ?? ''}
          onChange={url => set('avatar', url)}
        />
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}

// ── Tab: Change Password ──────────────────────────────────

function ChangePasswordTab() {
  const [form, setForm] = useState({ old: '', new: '', confirm: '' });
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const set = (k: 'old' | 'new' | 'confirm', v: string) => setForm(f => ({ ...f, [k]: v }));
  const toggleShow = (k: 'old' | 'new' | 'confirm') => setShow(s => ({ ...s, [k]: !s[k] }));

  const strength = (() => {
    const p = form.new;
    let s = 0;
    if (p.length >= 6) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthColor = ['bg-slate-200', 'bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-green-500'][strength];
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.old) { setError('Enter your current password'); return; }
    if (form.new.length < 6) { setError('New password must be at least 6 characters'); return; }
    if (form.new !== form.confirm) { setError('Passwords do not match'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      await profileApi.changePassword(form.old, form.new);
      setSuccess('Password changed successfully');
      setForm({ old: '', new: '', confirm: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to change password');
    } finally { setSaving(false); }
  };

  const PasswordInput = ({ field, label, placeholder }: { field: 'old' | 'new' | 'confirm'; label: string; placeholder: string }) => (
    <div>
      <label className="text-xs font-medium text-slate-600 mb-1 block">{label}</label>
      <div className="relative">
        <Input
          type={show[field] ? 'text' : 'password'}
          value={form[field]}
          onChange={e => set(field, e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        <button type="button" onClick={() => toggleShow(field)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {show[field] ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          <AlertCircle size={14} />{error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl text-sm text-green-600">
          <CheckCircle size={14} />{success}
        </div>
      )}

      <PasswordInput field="old" label="Current Password" placeholder="Enter current password" />
      <PasswordInput field="new" label="New Password" placeholder="Min 6 characters" />

      {form.new && (
        <div>
          <div className="flex gap-1 mb-1">
            {[1,2,3,4].map(i => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? strengthColor : 'bg-slate-200'}`} />
            ))}
          </div>
          <p className="text-xs text-slate-400">{strengthLabel}</p>
        </div>
      )}

      <PasswordInput field="confirm" label="Confirm New Password" placeholder="Re-enter new password" />

      {form.confirm && form.new !== form.confirm && (
        <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} /> Passwords do not match</p>
      )}
      {form.confirm && form.new === form.confirm && form.confirm.length > 0 && (
        <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={11} /> Passwords match</p>
      )}

      <div className="pt-2">
        <Button type="submit" disabled={saving} className="w-full">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
          {saving ? 'Changing...' : 'Change Password'}
        </Button>
      </div>
    </form>
  );
}

// ── Main Page ─────────────────────────────────────────────

type Tab = 'profile' | 'password';

export function ProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('profile');

  useEffect(() => {
    profileApi.get()
      .then(setProfile)
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const roleMeta = ROLE_META[profile?.role ?? user?.role ?? ''] ?? { label: profile?.role ?? 'User', color: 'bg-slate-100 text-slate-600' };
  const joined = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="Manage your account information"
        breadcrumbs={[{ label: 'Home' }, { label: 'Profile' }]}
      />

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          <AlertCircle size={14} />{error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading profile...
        </div>
      ) : profile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left: Account card ── */}
          <div className="lg:col-span-1 space-y-4">
            {/* Avatar + identity */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center">
              <div className="flex justify-center mb-3">
                <Avatar name={profile.name} avatar={profile.avatar} size="lg" />
              </div>
              <h2 className="font-bold text-slate-800 text-lg leading-tight">{profile.name}</h2>
              <p className="text-sm text-slate-400 mb-3">{profile.email}</p>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${roleMeta.color}`}>
                <Shield size={11} /> {roleMeta.label}
              </span>
            </div>

            {/* Account info */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Account Info</h3>
              <InfoRow icon={Mail} label="Email" value={profile.email} />
              <InfoRow icon={Phone} label="Mobile" value={profile.mobile ?? <span className="text-slate-400 italic">Not set</span>} />
              <InfoRow icon={Calendar} label="Date of Birth" value={profile.dob ?? <span className="text-slate-400 italic">Not set</span>} />
              <InfoRow icon={Calendar} label="Member Since" value={joined} />
              <InfoRow
                icon={User}
                label="Status"
                value={
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${profile.isActive ? 'text-green-600' : 'text-slate-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${profile.isActive ? 'bg-green-500' : 'bg-slate-400'}`} />
                    {profile.isActive ? 'Active' : 'Inactive'}
                  </span>
                }
              />
            </div>

            {/* Wallet & Referral */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl">
                <div className="w-9 h-9 rounded-xl bg-[#0F766E] flex items-center justify-center shrink-0">
                  <Wallet size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-teal-600 font-medium">Wallet Balance</p>
                  <p className="text-lg font-bold text-teal-800">{money(profile.walletBalance)}</p>
                </div>
              </div>

              {profile.referralCode && (
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl">
                  <div className="w-9 h-9 rounded-xl bg-[#EA580C] flex items-center justify-center shrink-0">
                    <Gift size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-orange-600 font-medium">Referral Code</p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-orange-800 tracking-wider">{profile.referralCode}</p>
                      <CopyButton text={profile.referralCode} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Edit forms ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-slate-100">
                {([
                  { key: 'profile', label: 'Edit Profile', icon: Edit2 },
                  { key: 'password', label: 'Change Password', icon: Lock },
                ] as { key: Tab; label: string; icon: React.ElementType }[]).map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                      tab === t.key
                        ? 'border-[#EA580C] text-[#EA580C] bg-orange-50/50'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <t.icon size={14} /> {t.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {tab === 'profile' && (
                  <EditProfileTab profile={profile} onSaved={setProfile} />
                )}
                {tab === 'password' && (
                  <ChangePasswordTab />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
