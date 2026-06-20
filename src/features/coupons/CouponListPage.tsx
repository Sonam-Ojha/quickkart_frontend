import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Ticket, Edit2, Trash2, Loader2, AlertCircle, X, Search } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { money, formatDate } from '../../lib/utils';
import { usePermission } from '../../hooks/usePermission';
import { couponApi, Coupon, CouponPayload } from './api';

// ── Modal ─────────────────────────────────────────────────

const EMPTY: CouponPayload = {
  code: '', type: 'percent', value: 0,
  maxDiscount: undefined, minOrder: 0,
  usageLimit: undefined, perUserLimit: 1,
  validFrom: '', validTo: '', isActive: true,
};

function CouponModal({ coupon, onClose, onSave }: { coupon?: Coupon | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState<CouponPayload>(
    coupon ? {
      code:         coupon.code,
      type:         coupon.type,
      value:        coupon.value,
      maxDiscount:  coupon.maxDiscount ?? undefined,
      minOrder:     coupon.minOrder,
      usageLimit:   coupon.usageLimit ?? undefined,
      perUserLimit: coupon.perUserLimit,
      validFrom:    coupon.validFrom?.slice(0, 10),
      validTo:      coupon.validTo?.slice(0, 10),
      isActive:     coupon.isActive,
    } : { ...EMPTY }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (k: keyof CouponPayload, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code)      { setError('Code is required'); return; }
    if (!form.value)     { setError('Value is required'); return; }
    if (!form.validFrom) { setError('Valid from date is required'); return; }
    if (!form.validTo)   { setError('Valid to date is required'); return; }
    setSaving(true); setError('');
    try {
      coupon ? await couponApi.update(coupon.id, form) : await couponApi.create(form);
      onSave();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Something went wrong');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="font-semibold text-slate-800">{coupon ? 'Edit Coupon' : 'Add Coupon'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600"><AlertCircle size={14} />{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Code *</label>
              <Input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="SAVE50" className="font-mono uppercase" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Type *</label>
              <select value={form.type} onChange={e => set('type', e.target.value as any)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400">
                <option value="percent">Percentage %</option>
                <option value="flat">Flat ₹</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                {form.type === 'percent' ? 'Discount %' : 'Discount ₹'} *
              </label>
              <Input type="number" min="1" value={form.value || ''} onChange={e => set('value', Number(e.target.value))}
                placeholder={form.type === 'percent' ? '10–100' : 'in paise'} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Max Discount ₹</label>
              <Input type="number" min="0" value={form.maxDiscount ?? ''} onChange={e => set('maxDiscount', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="paise (optional)" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Min Order ₹</label>
              <Input type="number" min="0" value={form.minOrder ?? 0} onChange={e => set('minOrder', Number(e.target.value))} placeholder="paise" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Per User Limit</label>
              <Input type="number" min="1" value={form.perUserLimit ?? 1} onChange={e => set('perUserLimit', Number(e.target.value))} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Total Usage Limit</label>
            <Input type="number" min="1" value={form.usageLimit ?? ''} onChange={e => set('usageLimit', e.target.value ? Number(e.target.value) : undefined)} placeholder="Leave empty for unlimited" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Valid From *</label>
              <Input type="date" value={form.validFrom} onChange={e => set('validFrom', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Valid To *</label>
              <Input type="date" value={form.validTo} onChange={e => set('validTo', e.target.value)} />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive ?? true} onChange={e => set('isActive', e.target.checked)} className="accent-[#EA580C]" />
            <span className="text-sm text-slate-600">Active</span>
          </label>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />}
              {coupon ? 'Save Changes' : 'Add Coupon'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────

export function CouponListPage() {
  const { can } = usePermission();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('all');
  const [modal, setModal]     = useState<{ open: boolean; coupon?: Coupon | null }>({ open: false });
  const [toggling, setToggling] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      setCoupons(await couponApi.getAll({
        search: search || undefined,
        status: status !== 'all' ? status : undefined,
      }));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load coupons');
    } finally { setLoading(false); }
  }, [search, status]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (c: Coupon) => {
    setToggling(c.id);
    try {
      const updated = await couponApi.toggle(c.id);
      setCoupons(prev => prev.map(x => x.id === c.id ? updated : x));
    } catch {}
    finally { setToggling(null); }
  };

  const handleDelete = async (c: Coupon) => {
    if (!confirm(`Delete coupon "${c.code}"?`)) return;
    setDeleting(c.id);
    try { await couponApi.remove(c.id); setCoupons(prev => prev.filter(x => x.id !== c.id)); }
    catch (err: any) { setError(err?.response?.data?.message ?? 'Delete failed'); }
    finally { setDeleting(null); }
  };

  const activeCount = coupons.filter(c => c.isActive).length;

  return (
    <div>
      <PageHeader
        title="Coupons"
        subtitle={loading ? 'Loading...' : `${activeCount} active / ${coupons.length} total`}
        breadcrumbs={[{ label: 'Home' }, { label: 'Coupons' }]}
        action={can('coupons.edit') && (
          <Button size="sm" onClick={() => setModal({ open: true, coupon: null })}>
            <Plus size={14} /> Add Coupon
          </Button>
        )}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search code..." className="pl-9 font-mono uppercase" value={search}
            onChange={e => setSearch(e.target.value.toUpperCase())} />
        </div>
        <div className="flex gap-1.5">
          {[{ v: 'all', l: 'All' }, { v: 'active', l: 'Active' }, { v: 'inactive', l: 'Inactive' }].map(opt => (
            <button key={opt.v} onClick={() => setStatus(opt.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${status === opt.v ? 'bg-[#EA580C] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-200'}`}>
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          <AlertCircle size={14} />{error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading coupons...
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Ticket size={40} className="mx-auto mb-3 text-slate-200" />
          <p className="font-medium">No coupons found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coupons.map(c => (
            <div key={c.id} className={`bg-white rounded-2xl border overflow-hidden ${c.isActive ? 'border-slate-100' : 'border-slate-100 opacity-60'}`}>
              {/* Header */}
              <div className={`px-5 pt-5 pb-4 relative ${c.type === 'percent' ? 'bg-gradient-to-r from-orange-50 to-amber-50' : 'bg-gradient-to-r from-teal-50 to-emerald-50'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.type === 'percent' ? 'bg-orange-100 text-[#EA580C]' : 'bg-teal-100 text-[#0F766E]'}`}>
                      {c.type === 'percent' ? 'Percentage' : 'Flat Discount'}
                    </span>
                    <h3 className="font-bold text-2xl text-slate-800 mt-2 font-mono tracking-wider">{c.code}</h3>
                  </div>
                  <div className={`text-3xl font-bold ${c.type === 'percent' ? 'text-[#EA580C]' : 'text-[#0F766E]'}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {c.type === 'percent' ? `${c.value}%` : money(c.value)}
                  </div>
                </div>
                {/* Ticket notch decoration */}
                <div className="absolute -bottom-3 left-0 right-0 flex justify-between px-4">
                  <div className="w-6 h-6 rounded-full bg-white border border-slate-100" />
                  <div className="flex-1 mx-1 border-b-2 border-dashed border-slate-200 self-center" />
                  <div className="w-6 h-6 rounded-full bg-white border border-slate-100" />
                </div>
              </div>

              {/* Body */}
              <div className="px-5 pt-6 pb-4">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">Min Order</div>
                    <div className="text-sm font-semibold text-slate-700">{money(c.minOrder)}</div>
                  </div>
                  {c.maxDiscount && (
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wide">Max Discount</div>
                      <div className="text-sm font-semibold text-slate-700">{money(c.maxDiscount)}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">Usage</div>
                    <div className="text-sm font-semibold text-slate-700">
                      {c.usedCount} / {c.usageLimit ?? '∞'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">Valid Till</div>
                    <div className="text-sm font-semibold text-slate-700">{formatDate(c.validTo)}</div>
                  </div>
                </div>

                {/* Usage bar */}
                {c.usageLimit && (
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Usage</span>
                      <span>{Math.round((c.usedCount / c.usageLimit) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#EA580C] to-[#FB923C] transition-all"
                        style={{ width: `${Math.min(100, (c.usedCount / c.usageLimit) * 100)}%` }} />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <button onClick={() => handleToggle(c)} disabled={toggling === c.id}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors disabled:opacity-40 ${c.isActive ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                    {toggling === c.id ? <Loader2 size={11} className="animate-spin inline" /> : c.isActive ? 'Active' : 'Inactive'}
                  </button>
                  {can('coupons.edit') && (
                    <div className="flex gap-1">
                      <button onClick={() => setModal({ open: true, coupon: c })}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => handleDelete(c)} disabled={deleting === c.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40">
                        {deleting === c.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <CouponModal
          coupon={modal.coupon}
          onClose={() => setModal({ open: false })}
          onSave={() => { setModal({ open: false }); load(); }}
        />
      )}
    </div>
  );
}
