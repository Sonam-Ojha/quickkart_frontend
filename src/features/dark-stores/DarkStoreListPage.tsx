import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Package, Loader2, AlertCircle, Edit2, Trash2, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { usePermission } from '../../hooks/usePermission';
import { darkStoreApi, DarkStore, DarkStorePayload } from './api';

// ── Modal ─────────────────────────────────────────────────

function StoreModal({ store, onClose, onSave }: { store?: DarkStore | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState<DarkStorePayload>({
    name: store?.name ?? '',
    address: store?.address ?? '',
    city: store?.city ?? '',
    lat: store?.lat != null ? Number(store.lat) : undefined,
    lng: store?.lng != null ? Number(store.lng) : undefined,
    isActive: store?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof DarkStorePayload, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.address || !form.city) { setError('Name, address and city are required'); return; }
    setSaving(true); setError('');
    try {
      store ? await darkStoreApi.update(store.id, form) : await darkStoreApi.create(form);
      onSave();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Something went wrong');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">{store ? 'Edit Store' : 'Add Dark Store'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600"><AlertCircle size={14} />{error}</div>}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Store Name *</label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Sector-15 Faridabad" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Address *</label>
            <Input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">City *</label>
            <Input value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Faridabad" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Latitude</label>
              <Input type="number" step="any" value={form.lat ?? ''} onChange={e => set('lat', e.target.value ? Number(e.target.value) : undefined)} placeholder="28.4089" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Longitude</label>
              <Input type="number" step="any" value={form.lng ?? ''} onChange={e => set('lng', e.target.value ? Number(e.target.value) : undefined)} placeholder="77.3178" />
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
              {store ? 'Save Changes' : 'Add Store'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirm({ name, onConfirm, onClose, loading }: { name: string; onConfirm: () => void; onClose: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 text-center">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3"><Trash2 size={20} className="text-red-500" /></div>
        <h3 className="font-semibold text-slate-800 mb-1">Delete Store?</h3>
        <p className="text-sm text-slate-500 mb-5">Are you sure you want to delete <strong>{name}</strong>?</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-red-500 hover:bg-red-600" onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 size={14} className="animate-spin" />} Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────

export function DarkStoreListPage() {
  const { can } = usePermission();
  const [stores, setStores] = useState<DarkStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<{ open: boolean; store?: DarkStore | null }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<DarkStore | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try { setStores(await darkStoreApi.getAll()); }
    catch (err: any) { setError(err?.response?.data?.message ?? 'Failed to load stores'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (s: DarkStore) => {
    try {
      const updated = await darkStoreApi.toggle(s.id);
      setStores(prev => prev.map(x => x.id === s.id ? updated : x));
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await darkStoreApi.remove(deleteTarget.id); setDeleteTarget(null); load(); }
    catch (err: any) { setError(err?.response?.data?.message ?? 'Delete failed'); setDeleteTarget(null); }
    finally { setDeleting(false); }
  };

  const navigate = useNavigate();
  const activeCount = stores.filter(s => s.isActive).length;

  return (
    <div>
      <PageHeader
        title="Dark Stores"
        subtitle={loading ? 'Loading...' : `${activeCount} active / ${stores.length} total`}
        breadcrumbs={[{ label: 'Home' }, { label: 'Dark Stores' }]}
        action={can('dark_stores.edit') && (
          <Button size="sm" onClick={() => setModal({ open: true, store: null })}>
            <Plus size={14} /> Add Store
          </Button>
        )}
      />

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          <AlertCircle size={14} />{error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading stores...
        </div>
      ) : stores.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Package size={40} className="mx-auto mb-3 text-slate-200" />
          <p className="font-medium">No dark stores yet</p>
          <p className="text-sm mt-1">Click "Add Store" to create one</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map(store => (
            <div key={store.id} className={`bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-sm group ${store.isActive ? 'border-slate-100' : 'border-slate-100 opacity-70'}`}>
              <div className={`h-24 flex items-center justify-center ${store.isActive ? 'bg-gradient-to-br from-teal-50 to-emerald-50' : 'bg-slate-50'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${store.isActive ? 'bg-[#0F766E]' : 'bg-slate-300'}`}>
                  <Package size={22} className="text-white" />
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-800 text-sm">{store.name}</h3>
                  <button
                    onClick={() => can('dark_stores.edit') && handleToggle(store)}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${store.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {store.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                  <MapPin size={11} className="text-[#EA580C] shrink-0" />
                  <span className="truncate">{store.address}, {store.city}</span>
                </div>
                {(store.lat || store.lng) && (
                  <div className="text-xs text-slate-400 mb-3">
                    {Number(store.lat).toFixed(4)}, {Number(store.lng).toFixed(4)}
                  </div>
                )}
                <div className="flex gap-2 pt-3 border-t border-slate-50">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/dark-stores/${store.id}`)}>
                    <ArrowRight size={12} /> Manage
                  </Button>
                  {can('dark_stores.edit') && (
                    <>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:bg-slate-100" onClick={() => setModal({ open: true, store })}>
                        <Edit2 size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => setDeleteTarget(store)}>
                        <Trash2 size={14} />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <StoreModal store={modal.store} onClose={() => setModal({ open: false })} onSave={() => { setModal({ open: false }); load(); }} />
      )}
      {deleteTarget && (
        <DeleteConfirm name={deleteTarget.name} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} loading={deleting} />
      )}
    </div>
  );
}
