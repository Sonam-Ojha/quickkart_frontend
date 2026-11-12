import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Edit2, Trash2, Loader2, AlertCircle, X, ArrowLeft, UtensilsCrossed, Check } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import ImageUploadField from '../../components/common/ImageUploadField';
import { usePermission } from '../../hooks/usePermission';
import { foodApi, Restaurant, MenuCategory, MenuItem, MenuItemPayload } from './api';
import { Switch } from './RestaurantListPage';

const LABEL = 'text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block';

// Indian veg / non-veg mark
function VegMark({ veg }: { veg: boolean }) {
  const c = veg ? '#16A34A' : '#B91C1C';
  return (
    <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-[3px] border-[1.5px] shrink-0" style={{ borderColor: c }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
    </span>
  );
}

function ItemModal({ restaurantId, item, categories, defaultCategoryId, onClose, onSave }: {
  restaurantId: number; item?: MenuItem | null; categories: MenuCategory[];
  defaultCategoryId: number | null; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState<MenuItemPayload>({
    name:           item?.name           ?? '',
    menuCategoryId: item ? item.menuCategoryId : defaultCategoryId,
    price:          item?.price          ?? undefined,
    mrp:            item?.mrp            ?? null,
    unit:           item?.unit           ?? '',
    description:    item?.description    ?? '',
    imageUrl:       item?.imageUrl       ?? '',
    isVeg:          item?.isVeg          ?? true,
    isAvailable:    item?.isAvailable    ?? true,
    sortOrder:      item?.sortOrder      ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const set = (k: keyof MenuItemPayload, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) { setError('Name is required'); return; }
    if (form.price == null || !Number.isInteger(Number(form.price)) || Number(form.price) < 0) { setError('Price must be a whole number of rupees'); return; }
    if (form.mrp != null && Number(form.mrp) < Number(form.price)) { setError('MRP should be more than the price (or leave it empty)'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, imageUrl: form.imageUrl || null, unit: form.unit || null, description: form.description || null };
      item ? await foodApi.updateItem(restaurantId, item.id, payload) : await foodApi.createItem(restaurantId, payload);
      onSave();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Something went wrong');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-4 sm:px-6 py-4 shrink-0 bg-gradient-to-r from-red-50 to-amber-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-lg">{item ? 'Edit' : 'Add'} Menu Item</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/70 text-slate-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
            {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600"><AlertCircle size={14} />{error}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              <div className="sm:col-span-3 space-y-4">
                <div>
                  <label className={LABEL}>Name *</label>
                  <Input value={form.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Kaju Katli" className="h-11" autoFocus />
                </div>
                <div>
                  <label className={LABEL}>Menu section</label>
                  <select
                    value={form.menuCategoryId ?? ''}
                    onChange={e => set('menuCategoryId', e.target.value === '' ? null : Number(e.target.value))}
                    className="w-full h-11 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-700 bg-white outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
                  >
                    <option value="">Other (no section)</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={LABEL}>Price ₹ *</label>
                    <Input type="number" min={0} step={1} value={form.price ?? ''} onChange={e => set('price', e.target.value === '' ? undefined : Number(e.target.value))} className="h-11" />
                  </div>
                  <div>
                    <label className={LABEL}>MRP ₹</label>
                    <Input type="number" min={0} step={1} value={form.mrp ?? ''} onChange={e => set('mrp', e.target.value === '' ? null : Number(e.target.value))} placeholder="optional" className="h-11" />
                  </div>
                  <div>
                    <label className={LABEL}>Qty / unit</label>
                    <Input value={form.unit ?? ''} onChange={e => set('unit', e.target.value)} placeholder="250 g" className="h-11" />
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Description <span className="text-slate-400 normal-case">(optional)</span></label>
                  <Input value={form.description ?? ''} onChange={e => set('description', e.target.value)} maxLength={255} placeholder="e.g. made in pure desi ghee" className="h-11" />
                </div>
                <div className="flex gap-2">
                  {[true, false].map(v => (
                    <button key={String(v)} type="button" onClick={() => set('isVeg', v)}
                      className={`flex-1 h-11 rounded-xl text-sm font-medium border flex items-center justify-center gap-2 transition-colors ${form.isVeg === v ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>
                      <span className="bg-white rounded-[3px] p-px"><VegMark veg={v} /></span>{v ? 'Veg' : 'Non-veg'}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={!!form.isAvailable} onChange={e => set('isAvailable', e.target.checked)} className="accent-[#DC2626] w-4 h-4" />
                  Available to order (untick when sold out)
                </label>
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>Photo</label>
                <ImageUploadField label="Item photo" value={form.imageUrl ?? ''} onChange={url => set('imageUrl', url)} aspectRatio={1} previewClassName="h-40" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 px-4 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/60 shrink-0">
            <Button type="button" variant="outline" className="h-10 px-5" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="h-10 px-6" disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}{item ? 'Save Changes' : 'Add Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RestaurantMenuPage() {
  const { id } = useParams<{ id: string }>();
  const restaurantId = Number(id);
  const navigate = useNavigate();
  const { can } = usePermission();
  const canEdit = can('catalog.edit');

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems]           = useState<MenuItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [newSection, setNewSection] = useState('');
  const [renaming, setRenaming]     = useState<{ id: number; name: string } | null>(null);
  const [modal, setModal]           = useState<{ open: boolean; item?: MenuItem | null; categoryId?: number | null }>({ open: false });
  const [busy, setBusy]             = useState<number | null>(null);

  const loadMenu = async () => {
    const m = await foodApi.menu(restaurantId);
    setCategories(m.categories); setItems(m.items);
  };
  const load = async () => {
    setLoading(true); setError('');
    try { setRestaurant(await foodApi.get(restaurantId)); await loadMenu(); }
    catch (err: any) { setError(err?.response?.data?.message ?? 'Failed to load menu'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [restaurantId]);

  const run = async (fn: () => Promise<unknown>) => {
    setError('');
    try { await fn(); await loadMenu(); }
    catch (err: any) { setError(err?.response?.data?.message ?? 'Something went wrong'); }
  };

  const addSection = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newSection.trim();
    if (!name) return;
    run(async () => { await foodApi.createCategory(restaurantId, { name, sortOrder: categories.length }); setNewSection(''); });
  };

  const saveRename = () => {
    if (!renaming?.name.trim()) { setRenaming(null); return; }
    const { id: catId, name } = renaming;
    run(async () => { await foodApi.updateCategory(restaurantId, catId, { name: name.trim() }); setRenaming(null); });
  };

  const removeSection = (c: MenuCategory) => {
    const n = items.filter(i => i.menuCategoryId === c.id).length;
    if (!window.confirm(n ? `Delete section "${c.name}"? Its ${n} item(s) will move to "Other" (not deleted).` : `Delete section "${c.name}"?`)) return;
    run(() => foodApi.removeCategory(restaurantId, c.id));
  };

  const toggleItem = async (it: MenuItem) => {
    setBusy(it.id);
    await run(() => foodApi.toggleItem(restaurantId, it.id));
    setBusy(null);
  };

  const removeItem = (it: MenuItem) => {
    if (!window.confirm(`Delete "${it.name}" from the menu?`)) return;
    run(() => foodApi.removeItem(restaurantId, it.id));
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 size={24} className="animate-spin mr-2" /> Loading menu...</div>;
  }

  // Sections in order, then items that have no section under "Other"
  const groups: { cat: MenuCategory | null; items: MenuItem[] }[] = [
    ...categories.map(c => ({ cat: c, items: items.filter(i => i.menuCategoryId === c.id) })),
    ...(items.some(i => i.menuCategoryId == null) ? [{ cat: null, items: items.filter(i => i.menuCategoryId == null) }] : []),
  ];
  const soldOut = items.filter(i => !i.isAvailable).length;

  const itemRow = (it: MenuItem) => (
    <div key={it.id} className={`flex items-center gap-3 px-4 py-3 ${it.isAvailable ? '' : 'bg-slate-50'}`}>
      <div className="w-14 h-14 rounded-xl bg-amber-50 overflow-hidden flex items-center justify-center shrink-0">
        {it.imageUrl ? <img src={it.imageUrl} alt="" className={`w-full h-full object-cover ${it.isAvailable ? '' : 'grayscale opacity-60'}`} /> : <UtensilsCrossed size={18} className="text-amber-300" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <VegMark veg={it.isVeg} />
          <span className={`text-sm font-semibold truncate ${it.isAvailable ? 'text-slate-800' : 'text-slate-400'}`}>{it.name}</span>
        </div>
        <div className="text-sm mt-0.5">
          <span className="font-bold text-slate-800">₹{it.price}</span>
          {it.mrp && it.mrp > it.price ? <span className="line-through text-slate-400 ml-1.5 text-xs">₹{it.mrp}</span> : null}
          {it.unit ? <span className="text-slate-500 text-xs"> · {it.unit}</span> : null}
        </div>
        {it.description && <p className="text-xs text-slate-400 truncate mt-0.5">{it.description}</p>}
      </div>
      {/* Stock switch with a plain-word label */}
      <div
        className={`shrink-0 flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${
          it.isAvailable ? 'border-green-200 bg-green-50 text-green-700' : 'border-slate-200 bg-white text-slate-500'
        }`}
      >
        <Switch on={it.isAvailable} label="Available to order" disabled={!canEdit} busy={busy === it.id} onClick={() => toggleItem(it)} />
        <span className="w-14">{it.isAvailable ? 'In stock' : 'Sold out'}</span>
      </div>
      {canEdit && (
        <span className="flex shrink-0">
          <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100" title="Edit" onClick={() => setModal({ open: true, item: it })}><Edit2 size={15} /></Button>
          <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" title="Delete" onClick={() => removeItem(it)}><Trash2 size={15} /></Button>
        </span>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={restaurant ? restaurant.name : 'Menu'}
        subtitle={`Menu · ${items.length} items${soldOut ? ` · ${soldOut} sold out` : ''}`}
        breadcrumbs={[{ label: 'Home' }, { label: 'Food' }, { label: 'Restaurants', href: '/food/restaurants' }, { label: 'Menu' }]}
        action={<Button size="sm" variant="outline" onClick={() => navigate('/food/restaurants')}><ArrowLeft size={14} /> All restaurants</Button>}
      />

      {error && <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600"><AlertCircle size={14} />{error}</div>}

      {/* Step 1 — add a section */}
      {canEdit && (
        <form onSubmit={addSection} className="flex flex-col sm:flex-row sm:items-center gap-2 mb-5 p-4 bg-white rounded-2xl border border-slate-100">
          <div className="sm:w-48 shrink-0">
            <div className="text-sm font-semibold text-slate-800">Add a menu section</div>
            <div className="text-xs text-slate-400">e.g. Mithai, Thali, Snacks</div>
          </div>
          <Input value={newSection} onChange={e => setNewSection(e.target.value)} placeholder="Section name" className="h-10 flex-1" />
          <Button type="submit" className="h-10 px-5" disabled={!newSection.trim()}><Plus size={14} /> Add section</Button>
        </form>
      )}

      {groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 text-center py-14 px-6 text-slate-500">
          <UtensilsCrossed size={36} className="mx-auto mb-3 text-slate-200" />
          <p className="font-semibold text-slate-700">The menu is empty</p>
          <p className="text-sm mt-1">1. Add a section above (like "Mithai") &nbsp;·&nbsp; 2. Tap "Add item" inside it</p>
          {canEdit && (
            <Button size="sm" variant="outline" className="mt-4" onClick={() => setModal({ open: true, item: null, categoryId: null })}>
              <Plus size={14} /> Add an item without a section
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(({ cat, items: list }) => (
            <section key={cat?.id ?? 'other'} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              {/* Section header — every action visible, no hover needed */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50/80 border-b border-slate-100">
                {cat && renaming?.id === cat.id ? (
                  <form className="flex-1 flex items-center gap-2" onSubmit={e => { e.preventDefault(); saveRename(); }}>
                    <Input value={renaming.name} onChange={e => setRenaming({ id: cat.id, name: e.target.value })} className="h-9 max-w-xs" autoFocus />
                    <Button type="submit" size="sm"><Check size={14} /> Save</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setRenaming(null)}>Cancel</Button>
                  </form>
                ) : (
                  <>
                    <h3 className="flex-1 font-semibold text-slate-800">
                      {cat ? cat.name : 'Other'} <span className="text-xs font-normal text-slate-400 ml-1">{list.length} items</span>
                    </h3>
                    {canEdit && (
                      <>
                        <Button size="sm" onClick={() => setModal({ open: true, item: null, categoryId: cat?.id ?? null })}><Plus size={14} /> Add item</Button>
                        {cat && <Button size="sm" variant="ghost" className="text-slate-500" onClick={() => setRenaming({ id: cat.id, name: cat.name })}><Edit2 size={13} /> Rename</Button>}
                        {cat && <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" title="Delete section" onClick={() => removeSection(cat)}><Trash2 size={14} /></Button>}
                      </>
                    )}
                  </>
                )}
              </div>
              {list.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-400">
                  No items yet{canEdit && <> — <button className="text-[#DC2626] font-semibold hover:underline" onClick={() => setModal({ open: true, item: null, categoryId: cat?.id ?? null })}>add the first one</button></>}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">{list.map(itemRow)}</div>
              )}
            </section>
          ))}
        </div>
      )}

      {modal.open && (
        <ItemModal
          restaurantId={restaurantId}
          item={modal.item}
          categories={categories}
          defaultCategoryId={modal.categoryId ?? null}
          onClose={() => setModal({ open: false })}
          onSave={() => { setModal({ open: false }); loadMenu(); }}
        />
      )}
    </div>
  );
}
