import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Plus, Search, Package, Edit2, Trash2, Loader2, AlertCircle, X,
  FileSpreadsheet, Upload, Download, PlusCircle, CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { money } from '../../lib/utils';
import { usePermission } from '../../hooks/usePermission';
import { catalogApi, Product, ProductPayload, Category } from './api';
import ImageUploadField from '../../components/common/ImageUploadField';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RowDraft extends ProductPayload { _id: string }

const TAGS = [
  { value: '',           label: '— None —' },
  { value: 'deal',       label: '🔥 Deal' },
  { value: 'bestseller', label: '⭐ Bestseller' },
  { value: 'new',        label: '🆕 New' },
  { value: 'fresh',      label: '🌿 Fresh' },
] as const;

const newRow = (defaultCatId: number): RowDraft => ({
  _id: Math.random().toString(36).slice(2),
  name: '', categoryId: defaultCatId, brand: '', unit: '',
  mrp: 0, price: 0, imageUrl: '', tag: null, isActive: true,
});

// ── Shared UI ─────────────────────────────────────────────────────────────────

function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-8 p-4 overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full flex justify-center">{children}</div>
    </div>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-2xl">
      <h2 className="font-semibold text-slate-800">{title}</h2>
      <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 p-3 mb-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
      <AlertCircle size={14} className="shrink-0" />{msg}
    </div>
  );
}

// Shows sub-categories grouped by main category (optgroup).
// Falls back to flat list if no hierarchy exists.
function CatSelect({ value, categories, onChange, className }: {
  value: number; categories: Category[]; onChange: (v: number) => void; className?: string;
}) {
  const mains = categories.filter(c => !c.parentId);
  const subs  = categories.filter(c =>  c.parentId);
  const hasHierarchy = mains.length > 0 && subs.length > 0;

  return (
    <select
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className={`border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 ${className}`}
    >
      <option value={0}>Select sub-category…</option>
      {hasHierarchy
        ? mains.map(main => {
            const children = subs.filter(s => s.parentId === main.id);
            if (!children.length) return null;
            return (
              <optgroup key={main.id} label={`── ${main.name} ──`}>
                {children.map(c => (
                  <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>
                ))}
              </optgroup>
            );
          })
        : categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
      }
    </select>
  );
}

// ── Product Image thumbnail with fallback ──────────────────────────────────────

function ProductThumb({ imageUrl, name }: { imageUrl?: string | null; name: string }) {
  const [ok, setOk] = useState(!!imageUrl);
  useEffect(() => { setOk(!!imageUrl); }, [imageUrl]);
  return (
    <div className="h-36 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center relative overflow-hidden">
      {imageUrl && ok
        ? <img src={imageUrl} alt={name} className="h-full w-full object-cover" onError={() => setOk(false)} />
        : <Package size={40} className="text-slate-200" />
      }
    </div>
  );
}

// ── Single Add/Edit Modal ─────────────────────────────────────────────────────

function ProductModal({ product, categories, onClose, onSave }: {
  product?: Product | null; categories: Category[]; onClose: () => void; onSave: () => void;
}) {
  const mains = categories.filter(c => !c.parentId);
  const subs  = categories.filter(c =>  c.parentId);
  const hasHierarchy = mains.length > 0 && subs.length > 0;

  // Determine initial main category from product's sub-category
  const getInitialMainId = () => {
    if (!product?.categoryId) return mains[0]?.id ?? 0;
    const sub = subs.find(s => s.id === product.categoryId);
    return sub?.parentId ?? mains[0]?.id ?? 0;
  };

  const [mainId, setMainId] = useState<number>(getInitialMainId);
  const [form, setForm] = useState<ProductPayload>({
    name:       product?.name       ?? '',
    categoryId: product?.categoryId ?? 0,
    brand:      product?.brand      ?? '',
    unit:       product?.unit       ?? '',
    mrp:        product ? product.mrp   / 100 : 0,
    price:      product ? product.price / 100 : 0,
    imageUrl:   product?.imageUrl   ?? '',
    tag:        product?.tag        ?? null,
    isActive:   product?.isActive   ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const set = (key: keyof ProductPayload, val: any) => setForm(f => ({ ...f, [key]: val }));

  // Filtered sub-categories for the selected main category
  const filteredSubs = hasHierarchy
    ? subs.filter(s => s.parentId === mainId)
    : categories;

  // When main category changes, reset sub-category selection
  const handleMainChange = (id: number) => {
    setMainId(id);
    const firstSub = subs.find(s => s.parentId === id);
    set('categoryId', firstSub?.id ?? 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.categoryId)  { setError('Sub category is required'); return; }
    if (!form.mrp || !form.price) { setError('MRP and Price are required'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, mrp: Math.round(form.mrp * 100), price: Math.round(form.price * 100) };
      product ? await catalogApi.updateProduct(product.id, payload) : await catalogApi.createProduct(payload);
      onSave();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Something went wrong');
    } finally { setSaving(false); }
  };

  return (
    <Backdrop onClose={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <ModalHeader title={product ? 'Edit Product' : 'Add Product'} onClose={onClose} />
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <ErrorBox msg={error} />}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Product Name *</label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Amul Milk 500ml" />
          </div>

          {/* Category selection — Main → Sub */}
          {hasHierarchy ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Main Category *</label>
                <select
                  value={mainId}
                  onChange={e => handleMainChange(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                >
                  <option value={0}>Select…</option>
                  {mains.map(m => <option key={m.id} value={m.id}>{m.icon ? `${m.icon} ` : ''}{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Sub Category *</label>
                <select
                  value={form.categoryId}
                  onChange={e => set('categoryId', Number(e.target.value))}
                  disabled={!mainId}
                  className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 disabled:opacity-50"
                >
                  <option value={0}>Select…</option>
                  {filteredSubs.map(s => <option key={s.id} value={s.id}>{s.icon ? `${s.icon} ` : ''}{s.name}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Category *</label>
                <CatSelect value={form.categoryId} categories={categories} onChange={v => set('categoryId', v)} className="w-full" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Brand</label>
              <Input value={form.brand ?? ''} onChange={e => set('brand', e.target.value)} placeholder="e.g. Amul" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Unit</label>
              <Input value={form.unit ?? ''} onChange={e => set('unit', e.target.value)} placeholder="e.g. 500 ml" />
            </div>
            <ImageUploadField label="Image" value={form.imageUrl ?? ''} onChange={url => set('imageUrl', url)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">MRP (₹) *</label>
              <Input type="number" step="0.01" min="0" value={form.mrp} onChange={e => set('mrp', Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Selling Price (₹) *</label>
              <Input type="number" step="0.01" min="0" value={form.price} onChange={e => set('price', Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Homepage Tag</label>
            <select value={form.tag ?? ''} onChange={e => set('tag', e.target.value || null)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400">
              {TAGS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive ?? true} onChange={e => set('isActive', e.target.checked)} className="accent-[#EA580C]" />
            <span className="text-sm text-slate-600">Active</span>
          </label>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />}
              {product ? 'Save Changes' : 'Add Product'}
            </Button>
          </div>
        </form>
      </div>
    </Backdrop>
  );
}

// ── Multi-Add Modal ───────────────────────────────────────────────────────────

function MultiAddModal({ categories, onClose, onSave }: {
  categories: Category[]; onClose: () => void; onSave: () => void;
}) {
  const defaultCatId = categories[0]?.id ?? 0;
  const [rows, setRows] = useState<RowDraft[]>([newRow(defaultCatId)]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (id: string, key: keyof ProductPayload, val: any) =>
    setRows(prev => prev.map(r => r._id === id ? { ...r, [key]: val } : r));

  const removeRow = (id: string) =>
    setRows(prev => prev.length > 1 ? prev.filter(r => r._id !== id) : prev);

  const handleSave = async () => {
    const invalid = rows.findIndex(r => !r.name.trim() || !r.categoryId || !r.mrp || !r.price);
    if (invalid !== -1) { setError(`Row ${invalid + 1}: Name, Category, MRP and Price are required`); return; }
    setSaving(true); setError('');
    try {
      const payload = rows.map(({ _id, ...rest }) => ({
        ...rest,
        mrp: Math.round(Number(rest.mrp) * 100),
        price: Math.round(Number(rest.price) * 100),
      }));
      await catalogApi.bulkCreateProducts(payload);
      onSave();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Something went wrong');
    } finally { setSaving(false); }
  };

  return (
    <Backdrop onClose={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-6xl shadow-xl max-h-[90vh] flex flex-col">
        <ModalHeader title={`Add Multiple Products (${rows.length})`} onClose={onClose} />
        <div className="flex-1 overflow-auto p-5">
          {error && <ErrorBox msg={error} />}

          {/* Scrollable table */}
          <div className="overflow-x-auto">
            {/* Headers */}
            <div className="grid gap-2 mb-2 px-1 min-w-[900px]"
              style={{ gridTemplateColumns: '1.5fr 130px 100px 90px 70px 70px 40px 120px 90px 50px 32px' }}>
              {['Name *', 'Category *', 'Brand', 'Unit', 'MRP ₹*', 'Price ₹*', 'Img', 'Image URL', 'Tag', 'Active', ''].map(h => (
                <span key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</span>
              ))}
            </div>

            <div className="space-y-2 min-w-[900px]">
              {rows.map((row, i) => (
                <div key={row._id} className="grid gap-2 items-center bg-slate-50 rounded-xl px-3 py-2.5 group"
                  style={{ gridTemplateColumns: '1.5fr 130px 100px 90px 70px 70px 40px 120px 90px 50px 32px' }}>
                  <Input value={row.name} onChange={e => update(row._id, 'name', e.target.value)}
                    placeholder={`Product ${i + 1}`} className="h-8 text-sm" />
                  <CatSelect value={row.categoryId} categories={categories} onChange={v => update(row._id, 'categoryId', v)} className="h-8 w-full" />
                  <Input value={row.brand ?? ''} onChange={e => update(row._id, 'brand', e.target.value)}
                    placeholder="Brand" className="h-8 text-sm" />
                  <Input value={row.unit ?? ''} onChange={e => update(row._id, 'unit', e.target.value)}
                    placeholder="500ml" className="h-8 text-sm" />
                  <Input type="number" min="0" step="0.01" value={row.mrp || ''}
                    onChange={e => update(row._id, 'mrp', Number(e.target.value))}
                    placeholder="0" className="h-8 text-sm" />
                  <Input type="number" min="0" step="0.01" value={row.price || ''}
                    onChange={e => update(row._id, 'price', Number(e.target.value))}
                    placeholder="0" className="h-8 text-sm" />
                  {/* Live image preview */}
                  <div className="w-8 h-8 rounded-lg bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {row.imageUrl
                      ? <img src={row.imageUrl} alt="" className="w-8 h-8 object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      : <span className="text-slate-400 text-[10px]">img</span>
                    }
                  </div>
                  <Input value={row.imageUrl ?? ''} onChange={e => update(row._id, 'imageUrl', e.target.value)}
                    placeholder="https://..." className="h-8 text-sm" />
                  <select value={row.tag ?? ''} onChange={e => update(row._id, 'tag', e.target.value || null)}
                    className="h-8 border border-slate-200 rounded-lg px-1.5 text-xs text-slate-800 focus:outline-none focus:border-orange-400">
                    {TAGS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <div className="flex justify-center">
                    <input type="checkbox" checked={row.isActive ?? true}
                      onChange={e => update(row._id, 'isActive', e.target.checked)}
                      className="accent-[#EA580C] w-4 h-4 cursor-pointer" />
                  </div>
                  <button onClick={() => removeRow(row._id)}
                    className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => setRows(prev => [...prev, newRow(defaultCatId)])}
            className="mt-3 flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium px-1">
            <PlusCircle size={16} /> Add another row
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 p-5 border-t border-slate-100">
          <span className="text-sm text-slate-500">{rows.length} {rows.length === 1 ? 'product' : 'products'} to add</span>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Save All
            </Button>
          </div>
        </div>
      </div>
    </Backdrop>
  );
}

// ── Excel Import Modal ────────────────────────────────────────────────────────

function ExcelImportModal({ categories, onClose, onSave }: {
  categories: Category[]; onClose: () => void; onSave: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<RowDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'upload' | 'preview'>('upload');

  // Build a name→id map for Excel import (user writes category name, we resolve ID)
  const catMap = Object.fromEntries(categories.map(c => [c.name.toLowerCase().trim(), c.id]));

  const resolveCatId = (val: any): number => {
    if (typeof val === 'number') return val;
    const str = String(val ?? '').toLowerCase().trim();
    return catMap[str] ?? categories[0]?.id ?? 0;
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
        if (!raw.length) { setError('Excel file is empty'); return; }
        const parsed: RowDraft[] = raw.map(r => ({
          _id: Math.random().toString(36).slice(2),
          name:       String(r['name']       ?? r['Name']       ?? '').trim(),
          categoryId: resolveCatId(r['categoryId'] ?? r['categoryName'] ?? r['Category'] ?? r['category'] ?? ''),
          brand:      String(r['brand']      ?? r['Brand']      ?? '').trim() || undefined,
          unit:       String(r['unit']       ?? r['Unit']       ?? '').trim() || undefined,
          mrp:        Number(r['mrp']        ?? r['MRP']        ?? 0),
          price:      Number(r['price']      ?? r['Price']      ?? r['selling_price'] ?? 0),
          imageUrl:   String(r['imageUrl']   ?? r['image_url']  ?? r['Image URL'] ?? '').trim() || undefined,
          tag:        (String(r['tag'] ?? r['Tag'] ?? '').trim().toLowerCase() || null) as any,
          isActive:   String(r['isActive']   ?? r['is_active']  ?? r['Active'] ?? 'true').toLowerCase() !== 'false',
        })).filter(r => r.name);
        if (!parsed.length) { setError('No valid rows. Make sure "name" column exists.'); return; }
        setRows(parsed);
        setStep('preview');
      } catch {
        setError('Could not parse file. Please use .xlsx or .csv format.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['name', 'categoryName', 'brand', 'unit', 'mrp', 'price', 'imageUrl', 'tag', 'isActive'],
      ['Amul Milk 500ml', categories[0]?.name ?? 'Dairy', 'Amul', '500 ml', 60, 55, 'https://example.com/milk.jpg', 'bestseller', true],
      ['Lay\'s Classic Salted', categories[1]?.name ?? 'Snacks', 'Lay\'s', '26g', 20, 20, '', 'deal', true],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'products_template.xlsx');
  };

  const handleImport = async () => {
    const invalid = rows.findIndex(r => !r.name.trim() || !r.categoryId || !r.mrp || !r.price);
    if (invalid !== -1) { setError(`Row ${invalid + 1}: name, category, mrp, price required`); return; }
    setSaving(true); setError('');
    try {
      const payload = rows.map(({ _id, ...rest }) => ({
        ...rest,
        mrp: Math.round(Number(rest.mrp) * 100),
        price: Math.round(Number(rest.price) * 100),
      }));
      await catalogApi.bulkCreateProducts(payload);
      onSave();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Import failed');
    } finally { setSaving(false); }
  };

  const catName = (id: number) => categories.find(c => c.id === id)?.name ?? '—';

  return (
    <Backdrop onClose={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl max-h-[90vh] flex flex-col">
        <ModalHeader title="Import Products from Excel" onClose={onClose} />
        <div className="flex-1 overflow-auto p-5">
          {error && <ErrorBox msg={error} />}

          {step === 'upload' ? (
            <div className="space-y-5">
              {/* Download template */}
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-blue-800">Download Template First</p>
                  <p className="text-xs text-blue-600 mt-0.5">Fill categories by exact name — template auto-fills your current categories</p>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate} className="border-blue-200 text-blue-700 hover:bg-blue-100">
                  <Download size={14} /> Template
                </Button>
              </div>

              {/* Column info */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-semibold text-slate-600 mb-2">EXCEL COLUMNS</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { col: 'name', req: true }, { col: 'categoryName', req: true },
                    { col: 'mrp', req: true }, { col: 'price', req: true },
                    { col: 'brand', req: false }, { col: 'unit', req: false },
                    { col: 'imageUrl', req: false }, { col: 'tag', req: false }, { col: 'isActive', req: false },
                  ].map(({ col, req }) => (
                    <span key={col} className={`text-xs px-2 py-1 rounded-md font-mono ${req ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                      {col}{req ? ' *' : ''}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">tag values: deal · bestseller · new · fresh · (leave blank for none)</p>
              </div>

              {/* Available categories */}
              <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                <p className="text-xs font-semibold text-green-800 mb-2">YOUR CATEGORIES (use exact name in Excel)</p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map(c => (
                    <span key={c.id} className="text-xs bg-white border border-green-200 text-green-700 px-2 py-0.5 rounded-md font-medium">
                      {c.icon} {c.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Drop zone */}
              <div onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-orange-300 rounded-xl p-10 text-center cursor-pointer transition-colors group">
                <FileSpreadsheet size={36} className="text-slate-300 group-hover:text-orange-400 mx-auto mb-3 transition-colors" />
                <p className="font-semibold text-slate-700">Click to upload Excel / CSV</p>
                <p className="text-sm text-slate-400 mt-1">.xlsx, .xls, .csv supported</p>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">{rows.length} products ready to import</p>
                <button onClick={() => { setStep('upload'); setRows([]); if (fileRef.current) fileRef.current.value = ''; }}
                  className="text-xs text-slate-500 hover:text-slate-700 underline">Re-upload</button>
              </div>
              <div className="border border-slate-100 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['#', 'Name', 'Category', 'Brand', 'Unit', 'MRP', 'Price', 'Tag', 'Active'].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.map((row, i) => (
                      <tr key={row._id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 text-slate-400 text-xs">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-slate-800">
                          {row.name || <span className="text-red-400 text-xs">missing!</span>}
                        </td>
                        <td className="px-3 py-2 text-slate-600">{catName(row.categoryId)}</td>
                        <td className="px-3 py-2 text-slate-500">{row.brand || '—'}</td>
                        <td className="px-3 py-2 text-slate-500">{row.unit || '—'}</td>
                        <td className="px-3 py-2 text-slate-700">₹{row.mrp}</td>
                        <td className="px-3 py-2 text-slate-700">₹{row.price}</td>
                        <td className="px-3 py-2 text-xs text-slate-500">{row.tag || '—'}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${row.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            {row.isActive ? 'Yes' : 'No'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {step === 'preview' && (
          <div className="flex items-center justify-between gap-3 p-5 border-t border-slate-100">
            <span className="text-sm text-slate-500">Importing {rows.length} products</span>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleImport} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Import {rows.length} Products
              </Button>
            </div>
          </div>
        )}
      </div>
    </Backdrop>
  );
}

// ── Delete Confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ name, onConfirm, onClose, loading }: {
  name: string; onConfirm: () => void; onClose: () => void; loading: boolean;
}) {
  return (
    <Backdrop onClose={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 text-center">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <Trash2 size={20} className="text-red-500" />
        </div>
        <h3 className="font-semibold text-slate-800 mb-1">Delete Product?</h3>
        <p className="text-sm text-slate-500 mb-5">Are you sure you want to delete <strong>{name}</strong>?</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-red-500 hover:bg-red-600" onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 size={14} className="animate-spin" />} Delete
          </Button>
        </div>
      </div>
    </Backdrop>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type ModalState =
  | { type: 'none' }
  | { type: 'single'; product?: Product | null }
  | { type: 'multi' }
  | { type: 'excel' };

export function ProductListPage() {
  const { can } = usePermission();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>();
  const [activeOnly, setActiveOnly] = useState(false);
  const [page, setPage] = useState(1);
  const LIMIT = 20;
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCategories = useCallback(async () => {
    try { setCategories(await catalogApi.getCategories()); } catch {}
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await catalogApi.getProducts({ categoryId: categoryFilter, search: search || undefined, activeOnly: activeOnly || undefined, page, limit: LIMIT });
      setProducts(res.products); setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load products');
    } finally { setLoading(false); }
  }, [categoryFilter, search, activeOnly, page]);

  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleToggle = async (p: Product) => {
    try {
      const updated = await catalogApi.toggleProduct(p.id);
      setProducts(prev => prev.map(x => x.id === p.id ? updated : x));
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await catalogApi.deleteProduct(deleteTarget.id);
      setDeleteTarget(null); loadProducts();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Delete failed');
      setDeleteTarget(null);
    } finally { setDeleting(false); }
  };

  const closeModal = () => setModal({ type: 'none' });
  const afterSave  = () => { closeModal(); loadProducts(); };
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={loading ? 'Loading...' : `${total} products`}
        breadcrumbs={[{ label: 'Home' }, { label: 'Catalog' }, { label: 'Products' }]}
        action={
          can('catalog.edit') && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setModal({ type: 'excel' })}>
                <FileSpreadsheet size={14} /> Import Excel
              </Button>
              <Button size="sm" variant="outline" onClick={() => setModal({ type: 'multi' })}>
                <Upload size={14} /> Add Multiple
              </Button>
              <Button size="sm" onClick={() => setModal({ type: 'single', product: null })}>
                <Plus size={14} /> Add Product
              </Button>
            </div>
          )
        }
      />

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          <AlertCircle size={14} />{error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search products..." className="pl-9" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <label className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={activeOnly} onChange={e => { setActiveOnly(e.target.checked); setPage(1); }} className="accent-[#EA580C]" />
          Active only
        </label>
      </div>

      {/* Category filter tabs — Main → Sub hierarchy */}
      {(() => {
        const mains = categories.filter(c => !c.parentId);
        const subs  = categories.filter(c =>  c.parentId);
        const hasHierarchy = mains.length > 0 && subs.length > 0;

        return (
          <div className="mb-5 space-y-2">
            {/* All button */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              <button onClick={() => { setCategoryFilter(undefined); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${!categoryFilter ? 'bg-[#EA580C] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-200'}`}>
                All
              </button>
              {hasHierarchy
                ? mains.map(main => {
                    const children = subs.filter(s => s.parentId === main.id);
                    if (!children.length) return null;
                    return (
                      <React.Fragment key={main.id}>
                        {/* Main category label */}
                        <span className="px-2 py-1.5 text-xs font-bold text-slate-400 whitespace-nowrap flex items-center">
                          {main.icon} {main.name} ›
                        </span>
                        {children.map(sub => (
                          <button key={sub.id} onClick={() => { setCategoryFilter(sub.id); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${categoryFilter === sub.id ? 'bg-[#EA580C] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-200'}`}>
                            {sub.icon} {sub.name}
                          </button>
                        ))}
                      </React.Fragment>
                    );
                  })
                : categories.map(cat => (
                    <button key={cat.id} onClick={() => { setCategoryFilter(cat.id); setPage(1); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${categoryFilter === cat.id ? 'bg-[#EA580C] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-200'}`}>
                      {cat.icon} {cat.name}
                    </button>
                  ))
              }
            </div>
          </div>
        );
      })()}

      {/* Product grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading products...
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Package size={40} className="mx-auto mb-3 text-slate-200" />
          <p className="font-medium">No products found</p>
          <p className="text-sm mt-1">Try a different search or import from Excel</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-orange-200 hover:shadow-sm transition-all group">
              <ProductThumb imageUrl={product.imageUrl} name={product.name} />
              {!product.isActive && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                  <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-full">Inactive</span>
                </div>
              )}
              <div className="p-4">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">
                  {product.category?.name ?? 'Uncategorised'}
                </span>
                <h3 className="font-semibold text-slate-800 mt-2 mb-0.5 text-sm leading-snug">{product.name}</h3>
                <p className="text-xs text-slate-400">{product.brand}{product.brand && product.unit ? ' · ' : ''}{product.unit}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="font-bold text-slate-900 text-sm">{money(product.price)}</span>
                  {product.mrp !== product.price && (
                    <span className="text-xs text-slate-400 line-through">{money(product.mrp)}</span>
                  )}
                  <button onClick={() => can('catalog.edit') && handleToggle(product)}
                    className={`ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium ${product.isActive ? 'text-green-600 bg-green-50' : 'text-slate-500 bg-slate-100'}`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
                {can('catalog.edit') && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setModal({ type: 'single', product })}>
                      <Edit2 size={12} /> Edit
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => setDeleteTarget(product)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {modal.type === 'single' && <ProductModal product={modal.product} categories={categories} onClose={closeModal} onSave={afterSave} />}
      {modal.type === 'multi'  && <MultiAddModal categories={categories} onClose={closeModal} onSave={afterSave} />}
      {modal.type === 'excel'  && <ExcelImportModal categories={categories} onClose={closeModal} onSave={afterSave} />}

      {deleteTarget && <DeleteConfirm name={deleteTarget.name} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} loading={deleting} />}
    </div>
  );
}
