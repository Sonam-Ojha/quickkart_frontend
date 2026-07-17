import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Plus, Edit2, Trash2, GripVertical, Loader2, AlertCircle, X,
  Upload, FileSpreadsheet, Download, PlusCircle, CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { usePermission } from '../../hooks/usePermission';
import { catalogApi, Category, CategoryPayload } from './api';
import ImageUploadField from '../../components/common/ImageUploadField';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RowDraft extends CategoryPayload { _id: string }

const newRow = (): RowDraft => ({
  _id: Math.random().toString(36).slice(2),
  name: '', icon: '', imageUrl: '', sortOrder: 0, isActive: true,
});

// ── Single Edit Modal (unchanged behaviour) ───────────────────────────────────

function CategoryModal({ category, onClose, onSave }: {
  category?: Category | null; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState<CategoryPayload>({
    name: category?.name ?? '',
    icon: category?.icon ?? '',
    imageUrl: category?.imageUrl ?? '',
    sortOrder: category?.sortOrder ?? 0,
    isActive: category?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true); setError('');
    try {
      category ? await catalogApi.updateCategory(category.id, form) : await catalogApi.createCategory(form);
      onSave();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Something went wrong');
    } finally { setSaving(false); }
  };

  return (
    <Backdrop onClose={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <ModalHeader title={category ? 'Edit Category' : 'Add Category'} onClose={onClose} />
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <ErrorBox msg={error} />}
          <Field label="Name *">
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Dairy & Eggs" />
          </Field>
          <Field label="Icon (emoji)">
            <Input value={form.icon ?? ''} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="e.g. 🥛" maxLength={4} />
          </Field>
          <ImageUploadField label="Category Image (optional)" value={form.imageUrl ?? ''} onChange={url => setForm(f => ({ ...f, imageUrl: url }))} />
          <Field label="Sort Order">
            <Input type="number" value={form.sortOrder ?? 0} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} />
          </Field>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive ?? true} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="accent-[#EA580C]" />
            <span className="text-sm text-slate-600">Active</span>
          </label>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />}
              {category ? 'Save Changes' : 'Add Category'}
            </Button>
          </div>
        </form>
      </div>
    </Backdrop>
  );
}

// ── Multi-Add Modal ───────────────────────────────────────────────────────────

function MultiAddModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [rows, setRows] = useState<RowDraft[]>([newRow()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (id: string, key: keyof CategoryPayload, val: any) =>
    setRows(prev => prev.map(r => r._id === id ? { ...r, [key]: val } : r));

  const removeRow = (id: string) =>
    setRows(prev => prev.length > 1 ? prev.filter(r => r._id !== id) : prev);

  const handleSave = async () => {
    const invalid = rows.findIndex(r => !r.name.trim());
    if (invalid !== -1) { setError(`Row ${invalid + 1}: Name is required`); return; }
    setSaving(true); setError('');
    try {
      await catalogApi.bulkCreateCategories(rows.map(({ _id, ...rest }) => rest));
      onSave();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Something went wrong');
    } finally { setSaving(false); }
  };

  return (
    <Backdrop onClose={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl max-h-[90vh] flex flex-col">
        <ModalHeader title={`Add Multiple Categories (${rows.length})`} onClose={onClose} />

        <div className="flex-1 overflow-auto p-5">
          {error && <ErrorBox msg={error} />}

          {/* Column headers */}
          <div className="grid grid-cols-[1fr_70px_40px_160px_60px_50px_32px] gap-2 mb-2 px-1">
            {['Name *', 'Icon', 'Img', 'Image URL', 'Sort', 'Active', ''].map(h => (
              <span key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</span>
            ))}
          </div>

          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={row._id} className="grid grid-cols-[1fr_70px_40px_160px_60px_50px_32px] gap-2 items-center bg-slate-50 rounded-xl px-3 py-2.5 group">
                <Input
                  value={row.name}
                  onChange={e => update(row._id, 'name', e.target.value)}
                  placeholder={`Category ${i + 1}`}
                  className="h-8 text-sm"
                />
                <Input
                  value={row.icon ?? ''}
                  onChange={e => update(row._id, 'icon', e.target.value)}
                  placeholder="🛒"
                  maxLength={4}
                  className="h-8 text-sm text-center"
                />
                {/* Live image preview */}
                <div className="w-8 h-8 rounded-lg bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {row.imageUrl
                    ? <img src={row.imageUrl} alt="" className="w-8 h-8 object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    : <span className="text-slate-400 text-xs">—</span>
                  }
                </div>
                <Input
                  value={row.imageUrl ?? ''}
                  onChange={e => update(row._id, 'imageUrl', e.target.value)}
                  placeholder="https://img.url/..."
                  className="h-8 text-sm"
                />
                <Input
                  type="number"
                  value={row.sortOrder ?? 0}
                  onChange={e => update(row._id, 'sortOrder', Number(e.target.value))}
                  className="h-8 text-sm"
                />
                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={row.isActive ?? true}
                    onChange={e => update(row._id, 'isActive', e.target.checked)}
                    className="accent-[#EA580C] w-4 h-4 cursor-pointer"
                  />
                </div>
                <button
                  onClick={() => removeRow(row._id)}
                  className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => setRows(prev => [...prev, newRow()])}
            className="mt-3 flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium px-1"
          >
            <PlusCircle size={16} /> Add another row
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 p-5 border-t border-slate-100">
          <span className="text-sm text-slate-500">{rows.length} {rows.length === 1 ? 'category' : 'categories'} to add</span>
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

const EXCEL_COLUMNS = ['name', 'icon', 'imageUrl', 'sortOrder', 'isActive'] as const;

function ExcelImportModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<RowDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'upload' | 'preview'>('upload');

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
          name: String(r['name'] ?? r['Name'] ?? '').trim(),
          icon: String(r['icon'] ?? r['Icon'] ?? '').trim(),
          imageUrl: String(r['imageUrl'] ?? r['image_url'] ?? r['Image URL'] ?? '').trim(),
          sortOrder: Number(r['sortOrder'] ?? r['sort_order'] ?? r['Sort Order'] ?? 0),
          isActive: String(r['isActive'] ?? r['is_active'] ?? r['Active'] ?? 'true').toLowerCase() !== 'false',
        })).filter(r => r.name);
        if (!parsed.length) { setError('No valid rows found. Make sure "name" column exists.'); return; }
        setRows(parsed);
        setStep('preview');
      } catch {
        setError('Could not parse file. Make sure it is a valid .xlsx or .csv file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['name', 'icon', 'imageUrl', 'sortOrder', 'isActive'],
      ['Dairy & Eggs', '🥛', 'https://example.com/dairy.jpg', 1, true],
      ['Fruits & Vegetables', '🍎', 'https://example.com/fruits.jpg', 2, true],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Categories');
    XLSX.writeFile(wb, 'categories_template.xlsx');
  };

  const handleImport = async () => {
    const invalid = rows.findIndex(r => !r.name.trim());
    if (invalid !== -1) { setError(`Row ${invalid + 1}: Name is required`); return; }
    setSaving(true); setError('');
    try {
      await catalogApi.bulkCreateCategories(rows.map(({ _id, ...rest }) => rest));
      onSave();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Import failed');
    } finally { setSaving(false); }
  };

  return (
    <Backdrop onClose={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl max-h-[90vh] flex flex-col">
        <ModalHeader title="Import Categories from Excel" onClose={onClose} />

        <div className="flex-1 overflow-auto p-5">
          {error && <ErrorBox msg={error} />}

          {step === 'upload' ? (
            <div className="space-y-5">
              {/* Download template */}
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-blue-800">Download Template First</p>
                  <p className="text-xs text-blue-600 mt-0.5">Fill in the template and upload it back</p>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate} className="border-blue-200 text-blue-700 hover:bg-blue-100">
                  <Download size={14} /> Template
                </Button>
              </div>

              {/* Required columns info */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-semibold text-slate-600 mb-2">EXCEL COLUMNS</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { col: 'name', req: true },
                    { col: 'icon', req: false },
                    { col: 'imageUrl', req: false },
                    { col: 'sortOrder', req: false },
                    { col: 'isActive', req: false },
                  ].map(({ col, req }) => (
                    <span key={col} className={`text-xs px-2 py-1 rounded-md font-mono ${req ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                      {col}{req ? ' *' : ''}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">* required · Image should be a URL (e.g. https://cdn.example.com/img.jpg)</p>
              </div>

              {/* File drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-orange-300 rounded-xl p-10 text-center cursor-pointer transition-colors group"
              >
                <FileSpreadsheet size={36} className="text-slate-300 group-hover:text-orange-400 mx-auto mb-3 transition-colors" />
                <p className="font-semibold text-slate-700">Click to upload Excel / CSV</p>
                <p className="text-sm text-slate-400 mt-1">.xlsx, .xls, .csv supported</p>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">{rows.length} categories ready to import</p>
                <button onClick={() => { setStep('upload'); setRows([]); if (fileRef.current) fileRef.current.value = ''; }} className="text-xs text-slate-500 hover:text-slate-700 underline">
                  Re-upload
                </button>
              </div>

              {/* Preview table */}
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">#</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Name</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Icon</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Image</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Sort</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.map((row, i) => (
                      <tr key={row._id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 text-slate-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-2 font-medium text-slate-800">{row.name || <span className="text-red-400 text-xs">missing!</span>}</td>
                        <td className="px-4 py-2 text-lg">{row.icon || '—'}</td>
                        <td className="px-4 py-2 text-xs text-slate-400 max-w-[160px] truncate">{row.imageUrl || '—'}</td>
                        <td className="px-4 py-2 text-slate-500">{row.sortOrder}</td>
                        <td className="px-4 py-2">
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
            <span className="text-sm text-slate-500">Importing {rows.length} categories</span>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleImport} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Import {rows.length} Categories
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
        <h3 className="font-semibold text-slate-800 mb-1">Delete Category?</h3>
        <p className="text-sm text-slate-500 mb-5">Are you sure you want to delete <strong>{name}</strong>? This cannot be undone.</p>
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
  | { type: 'single'; category?: Category | null }
  | { type: 'multi' }
  | { type: 'excel' };

export function CategoryListPage() {
  const { can } = usePermission();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setCategories(await catalogApi.getCategories()); }
    catch (err: any) { setError(err?.response?.data?.message ?? 'Failed to load categories'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (cat: Category) => {
    try {
      const updated = await catalogApi.toggleCategory(cat.id);
      setCategories(prev => prev.map(c => c.id === cat.id ? updated : c));
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await catalogApi.deleteCategory(deleteTarget.id);
      setDeleteTarget(null); load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Delete failed');
      setDeleteTarget(null);
    } finally { setDeleting(false); }
  };

  const closeModal = () => setModal({ type: 'none' });
  const afterSave = () => { closeModal(); load(); };

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle={loading ? 'Loading...' : `${categories.length} categories`}
        breadcrumbs={[{ label: 'Home' }, { label: 'Catalog' }, { label: 'Categories' }]}
        action={
          can('catalog.edit') && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setModal({ type: 'excel' })}>
                <FileSpreadsheet size={14} /> Import Excel
              </Button>
              <Button size="sm" variant="outline" onClick={() => setModal({ type: 'multi' })}>
                <Upload size={14} /> Add Multiple
              </Button>
              <Button size="sm" onClick={() => setModal({ type: 'single', category: null })}>
                <Plus size={14} /> Add Category
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

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 size={24} className="animate-spin mr-2" /> Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="font-medium">No categories yet</p>
            <p className="text-sm mt-1">Click "Add Category" or import from Excel</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3 w-8" />
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Sort</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                {can('catalog.edit') && <th className="px-5 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <GripVertical size={14} className="text-slate-300 cursor-grab" />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <CategoryThumb imageUrl={cat.imageUrl} icon={cat.icon} name={cat.name} />
                      <span className="font-medium text-slate-800">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="text-slate-400">{cat.sortOrder}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => can('catalog.edit') && handleToggle(cat)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        cat.isActive
                          ? 'bg-green-50 text-green-700 hover:bg-green-100'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cat.isActive ? 'bg-green-500' : 'bg-slate-400'}`} />
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  {can('catalog.edit') && (
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1">
                        <button onClick={() => setModal({ type: 'single', category: cat })} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => setDeleteTarget(cat)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal.type === 'single' && <CategoryModal category={modal.category} onClose={closeModal} onSave={afterSave} />}
      {modal.type === 'multi'  && <MultiAddModal onClose={closeModal} onSave={afterSave} />}
      {modal.type === 'excel'  && <ExcelImportModal onClose={closeModal} onSave={afterSave} />}

      {deleteTarget && (
        <DeleteConfirm name={deleteTarget.name} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} loading={deleting} />
      )}
    </div>
  );
}

// ── Shared UI helpers ─────────────────────────────────────────────────────────

function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-12 p-4 overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full flex justify-center">{children}</div>
    </div>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between p-5 border-b border-slate-100">
      <h2 className="font-semibold text-slate-800">{title}</h2>
      <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600 mb-1 block">{label}</label>
      {children}
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

// Shows image if URL valid, falls back to icon/emoji — no broken-image placeholder
function CategoryThumb({ imageUrl, icon, name }: { imageUrl?: string | null; icon?: string | null; name: string }) {
  const [imgOk, setImgOk] = useState(!!imageUrl);

  // reset when imageUrl changes
  useEffect(() => { setImgOk(!!imageUrl); }, [imageUrl]);

  return (
    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-xl shrink-0 overflow-hidden">
      {imageUrl && imgOk
        ? <img
            src={imageUrl}
            alt={name}
            className="w-10 h-10 object-cover"
            onError={() => setImgOk(false)}
          />
        : <span>{icon || '📦'}</span>
      }
    </div>
  );
}
