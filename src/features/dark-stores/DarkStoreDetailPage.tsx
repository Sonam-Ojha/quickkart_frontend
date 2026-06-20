import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Package, Users, Warehouse, MapPin, Plus,
  Edit2, Trash2, Loader2, AlertCircle, X, Star, Phone,
  ToggleLeft, ToggleRight, Search,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { usePermission } from '../../hooks/usePermission';
import { darkStoreApi, DarkStore, StoreStats } from './api';
import { riderApi, Rider, RiderPayload } from '../riders/api';
import { inventoryApi, InventoryRow } from '../inventory/api';
import { catalogApi, Product } from '../catalog/api';

type Tab = 'riders' | 'inventory';

// ── Stat Card ─────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </div>
  );
}

// ── Rider Modal ───────────────────────────────────────────

function RiderModal({ storeId, rider, onClose, onSave }: { storeId: number; rider?: Rider | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState<RiderPayload>({
    name: rider?.name ?? '',
    mobile: rider?.mobile ?? '',
    storeId,
    rating: rider?.rating ?? 5,
    status: rider?.status ?? 'active',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof RiderPayload, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.mobile) { setError('Name and mobile are required'); return; }
    setSaving(true); setError('');
    try {
      rider ? await riderApi.update(rider.id, form) : await riderApi.create(form);
      onSave();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Something went wrong');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">{rider ? 'Edit Rider' : 'Add Rider'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600"><AlertCircle size={14} />{error}</div>}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Name *</label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Rider name" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Mobile *</label>
            <Input type="tel" value={form.mobile} onChange={e => set('mobile', e.target.value)} placeholder="+91 XXXXX XXXXX" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Rating</label>
              <Input type="number" step="0.1" min="1" max="5" value={form.rating ?? 5} onChange={e => set('rating', Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Status</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />}
              {rider ? 'Save Changes' : 'Add Rider'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Set Stock Modal ───────────────────────────────────────

function StockModal({ storeId, row, products, onClose, onSave }: { storeId: number; row?: InventoryRow | null; products: Product[]; onClose: () => void; onSave: () => void }) {
  const [productId, setProductId] = useState(row?.productId ?? 0);
  const [qty, setQty] = useState(row?.stockQty ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) { setError('Select a product'); return; }
    setSaving(true); setError('');
    try {
      await inventoryApi.setStock(storeId, productId, qty);
      onSave();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">{row ? 'Edit Stock' : 'Add Product'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600"><AlertCircle size={14} />{error}</div>}
          {!row && (
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Product</label>
              <select value={productId} onChange={e => setProductId(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400">
                <option value="">Select product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          {row && <p className="text-sm font-medium text-slate-700">{row.product.name}</p>}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Stock Qty</label>
            <Input type="number" min="0" value={qty} onChange={e => setQty(Number(e.target.value))} />
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />} Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Riders Tab ────────────────────────────────────────────

function RidersTab({ storeId, canEdit }: { storeId: number; canEdit: boolean }) {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; rider?: Rider | null }>({ open: false });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setRiders(await riderApi.getAll({ storeId, search: search || undefined })); }
    catch { setError('Failed to load riders'); }
    finally { setLoading(false); }
  }, [storeId, search]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (r: Rider) => {
    try {
      const updated = await riderApi.toggle(r.id);
      setRiders(prev => prev.map(x => x.id === r.id ? updated : x));
    } catch {}
  };

  const handleDelete = async (r: Rider) => {
    if (!confirm(`Delete rider ${r.name}?`)) return;
    try { await riderApi.remove(r.id); load(); }
    catch (err: any) { setError(err?.response?.data?.message ?? 'Delete failed'); }
  };

  const statusColor: Record<string, string> = {
    active: 'bg-green-50 text-green-700',
    inactive: 'bg-slate-100 text-slate-500',
    suspended: 'bg-red-50 text-red-600',
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search riders..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => setModal({ open: true, rider: null })}>
            <Plus size={14} /> Add Rider
          </Button>
        )}
      </div>

      {error && <div className="flex items-center gap-2 p-3 mb-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600"><AlertCircle size={14} />{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 size={20} className="animate-spin mr-2" /> Loading...</div>
      ) : riders.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Users size={32} className="mx-auto mb-2 text-slate-200" />
          <p className="font-medium">No riders yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {riders.map(rider => (
            <div key={rider.id} className="bg-slate-50 rounded-xl p-4 flex items-center gap-3 group">
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#EA580C] to-[#0F766E] flex items-center justify-center text-white font-bold text-sm">
                  {rider.name[0]}
                </div>
                {rider.status === 'active' && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 text-sm truncate">{rider.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-0.5 text-xs text-amber-500"><Star size={10} fill="currentColor" />{Number(rider.rating).toFixed(1)}</span>
                  <span className="text-xs text-slate-400">{rider.totalDeliveries} deliveries</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
                  <Phone size={10} />{rider.mobile}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => canEdit && handleToggle(rider)}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[rider.status]}`}
                >
                  {rider.status}
                </button>
                {canEdit && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setModal({ open: true, rider })} className="w-6 h-6 rounded hover:bg-slate-200 flex items-center justify-center text-slate-400">
                      <Edit2 size={11} />
                    </button>
                    <button onClick={() => handleDelete(rider)} className="w-6 h-6 rounded hover:bg-red-100 flex items-center justify-center text-red-400">
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <RiderModal storeId={storeId} rider={modal.rider} onClose={() => setModal({ open: false })} onSave={() => { setModal({ open: false }); load(); }} />
      )}
    </div>
  );
}

// ── Inventory Tab ─────────────────────────────────────────

function InventoryTab({ storeId, canEdit }: { storeId: number; canEdit: boolean }) {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; row?: InventoryRow | null }>({ open: false });
  const [adjusting, setAdjusting] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await inventoryApi.getByStore(storeId, { search: search || undefined })); }
    catch {} finally { setLoading(false); }
  }, [storeId, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { catalogApi.getProducts({ limit: 500 }).then(r => setProducts(r.products)).catch(() => {}); }, [storeId]);

  const handleAdjust = async (row: InventoryRow, delta: number) => {
    setAdjusting(row.id);
    try {
      const res = await inventoryApi.adjustStock(storeId, row.productId, delta);
      setRows(prev => prev.map(r => r.id === row.id ? { ...r, stockQty: res.inventory.stockQty } : r));
    } catch {} finally { setAdjusting(null); }
  };

  const handleRemove = async (row: InventoryRow) => {
    if (!confirm(`Remove ${row.product.name} from inventory?`)) return;
    try { await inventoryApi.removeEntry(storeId, row.productId); load(); } catch {}
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search products..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => setModal({ open: true, row: null })}>
            <Plus size={14} /> Add Product
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 size={20} className="animate-spin mr-2" /> Loading...</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Package size={32} className="mx-auto mb-2 text-slate-200" />
          <p className="font-medium">No inventory entries</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Stock</th>
                {canEdit && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map(row => (
                <tr key={row.id} className="hover:bg-slate-50/40">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-800">{row.product.name}</p>
                      <p className="text-xs text-slate-400">{row.product.brand}{row.product.unit ? ` · ${row.product.unit}` : ''}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 font-medium">{row.product.category?.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${row.stockQty === 0 ? 'text-red-500' : row.stockQty < 10 ? 'text-amber-600' : 'text-slate-800'}`}>
                      {row.stockQty}
                    </span>
                    {row.stockQty === 0 && <span className="ml-2 text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">OOS</span>}
                    {row.stockQty > 0 && row.stockQty < 10 && <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Low</span>}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleAdjust(row, -1)} disabled={adjusting === row.id || row.stockQty === 0}
                          className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-500 disabled:opacity-40 text-xs font-bold">−</button>
                        <button onClick={() => handleAdjust(row, 1)} disabled={adjusting === row.id}
                          className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-500 disabled:opacity-40 text-xs font-bold">+</button>
                        <button onClick={() => setModal({ open: true, row })} className="w-6 h-6 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400 ml-1">
                          <Edit2 size={11} />
                        </button>
                        <button onClick={() => handleRemove(row)} className="w-6 h-6 rounded hover:bg-red-50 flex items-center justify-center text-red-400">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <StockModal storeId={storeId} row={modal.row} products={products}
          onClose={() => setModal({ open: false })} onSave={() => { setModal({ open: false }); load(); }} />
      )}
    </div>
  );
}

// ── Main Detail Page ──────────────────────────────────────

export function DarkStoreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermission();
  const storeId = Number(id);

  const [store, setStore] = useState<DarkStore | null>(null);
  const [stats, setStats] = useState<StoreStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('riders');

  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    Promise.all([
      darkStoreApi.getById(storeId),
      darkStoreApi.getStats(storeId),
    ]).then(([s, st]) => { setStore(s); setStats(st); })
      .catch(() => setError('Store not found'))
      .finally(() => setLoading(false));
  }, [storeId]);

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400">
      <Loader2 size={24} className="animate-spin mr-2" /> Loading...
    </div>
  );

  if (error || !store) return (
    <div className="text-center py-20">
      <p className="text-slate-500 mb-3">{error || 'Store not found'}</p>
      <Button variant="outline" onClick={() => navigate('/dark-stores')}>Back to Stores</Button>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={store.name}
        subtitle={`${store.address}, ${store.city}`}
        breadcrumbs={[{ label: 'Home' }, { label: 'Dark Stores', href: '/dark-stores' }, { label: store.name }]}
        action={
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${store.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
              {store.isActive ? 'Active' : 'Inactive'}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigate('/dark-stores')}>
              <ArrowLeft size={14} /> Back
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
        <StatCard icon={Users}     label="Active Riders" value={stats?.activeRiders ?? 0}  color="bg-[#0F766E]" />
        <StatCard icon={Package}   label="Total SKUs"    value={stats?.totalSKUs ?? 0}      color="bg-[#EA580C]" />
        {store.lat && store.lng && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 col-span-2 md:col-span-1">
            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <MapPin size={18} className="text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Coordinates</p>
              <p className="text-sm font-semibold text-slate-700">{Number(store.lat).toFixed(4)}, {Number(store.lng).toFixed(4)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100">
          {([
            { key: 'riders',    label: 'Riders',    icon: Users },
            { key: 'inventory', label: 'Inventory', icon: Warehouse },
          ] as { key: Tab; label: string; icon: React.ElementType }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                tab === t.key
                  ? 'border-[#EA580C] text-[#EA580C] bg-orange-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
        <div className="p-5">
          {tab === 'riders'    && <RidersTab    storeId={storeId} canEdit={can('riders.edit')} />}
          {tab === 'inventory' && <InventoryTab storeId={storeId} canEdit={can('catalog.edit')} />}
        </div>
      </div>
    </div>
  );
}
