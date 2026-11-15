import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, KeyRound, Trash2, UserPlus, Copy, Check, Smartphone } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { foodApi, Restaurant, RestaurantStaff } from './api';
import { Switch } from './RestaurantListPage';

const LABEL = 'text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block';

// Link the partner opens on their phone to log in.
const partnerLink = () => `${window.location.origin}/login`;

const lastSeen = (iso: string | null) =>
  iso ? `Last login ${new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Never logged in';

/** Super admin / ops: the restaurant's partner-panel logins (mobile + password). */
export function StaffLoginsModal({ restaurant, onClose }: { restaurant: Restaurant; onClose: () => void }) {
  const [staff, setStaff]     = useState<RestaurantStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [form, setForm]       = useState({ name: '', mobile: '', password: '' });
  const [saving, setSaving]   = useState(false);
  const [busy, setBusy]       = useState<number | null>(null);
  const [resetFor, setResetFor] = useState<{ id: number; password: string } | null>(null);
  const [copied, setCopied]   = useState(false);

  const load = async () => {
    setError('');
    try { setStaff(await foodApi.staff(restaurant.id)); }
    catch (err: any) { setError(err?.response?.data?.message ?? 'Failed to load logins'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [restaurant.id]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Enter the person’s name'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setSaving(true); setError('');
    try {
      await foodApi.createStaff(restaurant.id, form);
      setForm({ name: '', mobile: '', password: '' });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not create the login');
    } finally { setSaving(false); }
  };

  const act = async (id: number, fn: () => Promise<unknown>) => {
    setBusy(id); setError('');
    try { await fn(); await load(); }
    catch (err: any) { setError(err?.response?.data?.message ?? 'Something went wrong'); }
    finally { setBusy(null); }
  };

  const saveReset = (s: RestaurantStaff) => {
    if (!resetFor || resetFor.password.length < 6) { setError('New password must be at least 6 characters'); return; }
    act(s.id, async () => { await foodApi.updateStaff(restaurant.id, s.id, { password: resetFor.password }); setResetFor(null); });
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(partnerLink()); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-4 sm:px-6 py-4 shrink-0 bg-gradient-to-r from-red-50 to-amber-50 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Partner logins — {restaurant.name}</h2>
            <p className="text-sm text-slate-500 mt-0.5">These people can accept orders, manage the menu and see earnings for this restaurant only.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/70 text-slate-400"><X size={18} /></button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600"><AlertCircle size={14} />{error}</div>}

          {/* Where they log in */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Smartphone size={18} className="text-[#DC2626] shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xs text-slate-500">Partner login link (share on WhatsApp)</div>
              <div className="text-sm font-semibold text-slate-800 truncate">{partnerLink()}</div>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={copyLink}>
              {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
            </Button>
          </div>

          {/* Existing logins */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Logins ({staff.length})</h3>
            {loading ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-6 justify-center"><Loader2 size={16} className="animate-spin" /> Loading...</div>
            ) : staff.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-xl">
                No logins yet — until there is one, your team confirms this restaurant's orders by phone.
              </p>
            ) : (
              <div className="border border-slate-100 rounded-xl divide-y divide-slate-100">
                {staff.map(s => (
                  <div key={s.id} className={`p-3 ${s.isActive ? '' : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm font-semibold ${s.isActive ? 'text-slate-800' : 'text-slate-400'}`}>{s.name}</div>
                        <div className="text-xs text-slate-500">{s.mobile} · {lastSeen(s.lastLoginAt)}</div>
                      </div>
                      <span className="flex items-center gap-2 text-xs text-slate-500">
                        <Switch on={s.isActive} label={s.isActive ? 'Login on' : 'Login off'} busy={busy === s.id}
                          onClick={() => act(s.id, () => foodApi.updateStaff(restaurant.id, s.id, { isActive: !s.isActive }))} />
                        {s.isActive ? 'On' : 'Off'}
                      </span>
                      <Button variant="ghost" size="sm" className="text-slate-500" onClick={() => setResetFor({ id: s.id, password: '' })}>
                        <KeyRound size={13} /> Reset password
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" title="Delete login"
                        onClick={() => window.confirm(`Delete ${s.name}'s login?`) && act(s.id, () => foodApi.removeStaff(restaurant.id, s.id))}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    {resetFor?.id === s.id && (
                      <div className="flex gap-2 mt-2">
                        <Input type="text" value={resetFor.password} onChange={e => setResetFor({ id: s.id, password: e.target.value })}
                          placeholder="New password (min 6)" className="h-9" autoFocus />
                        <Button size="sm" className="h-9" disabled={busy === s.id} onClick={() => saveReset(s)}>Save</Button>
                        <Button size="sm" variant="ghost" className="h-9" onClick={() => setResetFor(null)}>Cancel</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* New login */}
          <form onSubmit={create} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><UserPlus size={15} /> Add a login</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={LABEL}>Name</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Ramesh (owner)" className="h-10 bg-white" />
              </div>
              <div>
                <label className={LABEL}>Mobile</label>
                <Input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} placeholder="98xxxxxxxx" inputMode="tel" className="h-10 bg-white" />
              </div>
              <div>
                <label className={LABEL}>Password</label>
                <Input type="text" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="min 6 characters" className="h-10 bg-white" />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400">Send them the link above with this mobile and password.</p>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />} Create login
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
