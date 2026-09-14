import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Plus, Edit2, Trash2, Loader2, AlertCircle, X,
  Upload, FileSpreadsheet, Download, PlusCircle, CheckCircle2,
  FolderOpen, Folder, ChevronRight, Search, SlidersHorizontal,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { usePermission } from '../../hooks/usePermission';
import { catalogApi, Category, CategoryPayload } from './api';
import ImageUploadField from '../../components/common/ImageUploadField';

// ── Shared tiny components ────────────────────────────────────────────────────

function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
      <h2 className="font-semibold text-slate-800">{title}</h2>
      <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 mb-3">
      <AlertCircle size={14} className="mt-0.5 shrink-0" />{msg}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function CategoryThumb({ imageUrl, icon, name }: { imageUrl?: string | null; icon?: string | null; name: string }) {
  const [imgOk, setImgOk] = useState(!!imageUrl);
  useEffect(() => setImgOk(!!imageUrl), [imageUrl]);
  if (imageUrl && imgOk)
    return <img src={imageUrl} alt={name} onError={() => setImgOk(false)} className="w-8 h-8 rounded-lg object-cover border border-slate-100" />;
  if (icon) return <span className="w-8 h-8 flex items-center justify-center text-xl bg-slate-50 rounded-lg border border-slate-100">{icon}</span>;
  return <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">{name[0]?.toUpperCase()}</div>;
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
        <p className="text-sm text-slate-500 mb-5">
          Are you sure you want to delete <strong>{name}</strong>? This cannot be undone.
        </p>
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

// ── Category Modal (add/edit) ─────────────────────────────────────────────────
// mode: 'main' → no parent selector   |   mode: 'sub' → parent selector required

function CategoryModal({
  mode, category, mainCategories, onClose, onSave,
}: {
  mode: 'main' | 'sub';
  category?: Category | null;
  mainCategories: Category[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState<CategoryPayload>({
    name:      category?.name      ?? '',
    icon:      category?.icon      ?? '',
    imageUrl:  category?.imageUrl  ?? '',
    sortOrder: category?.sortOrder ?? 0,
    isActive:  category?.isActive  ?? true,
    parentId:  category?.parentId  ?? (mode === 'sub' ? (mainCategories[0]?.id ?? null) : null),
    showInFilter: category?.showInFilter ?? true,
    showInGrid:   category?.showInGrid   ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (mode === 'sub' && !form.parentId) { setError('Main category is required'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        parentId: mode === 'main' ? null : form.parentId,
      };
      category
        ? await catalogApi.updateCategory(category.id, payload)
        : await catalogApi.createCategory(payload);
      onSave();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Something went wrong');
    } finally { setSaving(false); }
  };

  const isMain = mode === 'main';
  const isEdit = !!category;

  return (
    <Backdrop onClose={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">

        {/* Coloured header strip */}
        <div className={`px-6 pt-6 pb-5 ${isMain ? 'bg-orange-50' : 'bg-indigo-50'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isMain ? 'bg-orange-100' : 'bg-indigo-100'}`}>
                {isMain ? <FolderOpen size={20} className="text-orange-600" /> : <Folder size={20} className="text-indigo-600" />}
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-base leading-tight">
                  {isEdit ? 'Edit' : 'Add'} {isMain ? 'Main' : 'Sub'} Category
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isMain ? 'Top-level category (e.g. Atta, Dairy)' : 'Belongs inside a main category'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/70 text-slate-400 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <ErrorBox msg={error} />}

          {/* Parent selector — only for sub categories */}
          {mode === 'sub' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Main Category *
              </label>
              <select
                value={form.parentId ?? ''}
                onChange={e => setForm(f => ({ ...f, parentId: Number(e.target.value) }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
              >
                <option value="">— Select main category —</option>
                {mainCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Name + Icon side by side */}
          <div className="grid grid-cols-[1fr_80px] gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Name *
              </label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder={isMain ? 'e.g. Grocery' : 'e.g. Besan'}
                className="h-10"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Icon
              </label>
              <Input
                value={form.icon ?? ''}
                onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                placeholder={isMain ? '🛒' : '🌾'}
                maxLength={4}
                className="h-10 text-center text-xl"
              />
            </div>
          </div>

          {/* Image upload */}
          <ImageUploadField
            label="Image (optional)"
            value={form.imageUrl ?? ''}
            onChange={url => setForm(f => ({ ...f, imageUrl: url }))}
          />

          {/* Sort order + Active toggle */}
          <div className="flex items-center gap-4 pt-1">
            <div className="w-28">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Sort Order
              </label>
              <Input
                type="number"
                value={form.sortOrder ?? 0}
                onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                className="h-10"
              />
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer mt-5">
              <div
                onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                className={`w-10 h-5 rounded-full transition-colors relative ${form.isActive ? 'bg-orange-500' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm font-medium text-slate-600">Active</span>
            </label>
          </div>

          {/* Home screen visibility — only meaningful for main categories, since
              only root categories render in either Home section */}
          {isMain && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Show On Home Screen
              </label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.showInFilter}
                    onChange={e => setForm(f => ({ ...f, showInFilter: e.target.checked }))}
                    className="accent-[#EA580C] w-4 h-4"
                  />
                  <span className="text-sm text-slate-600">Category filter tabs (top of Home)</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.showInGrid}
                    onChange={e => setForm(f => ({ ...f, showInGrid: e.target.checked }))}
                    className="accent-[#EA580C] w-4 h-4"
                  />
                  <span className="text-sm text-slate-600">"Shop by Category" grid</span>
                </label>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 h-10" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className={`flex-1 h-10 ${!isMain ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
              disabled={saving}
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Save Changes' : `Add ${isMain ? 'Main' : 'Sub'} Category`}
            </Button>
          </div>
        </form>
      </div>
    </Backdrop>
  );
}

// ── Category Table (shared for both tabs) ─────────────────────────────────────

function CategoryTable({
  rows,
  showParent,
  parentMap,
  canEdit,
  onEdit,
  onDelete,
  onToggle,
  isFiltered,
}: {
  rows: Category[];
  showParent: boolean;
  parentMap: Record<number, string>;
  canEdit: boolean;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  onToggle: (c: Category) => void;
  isFiltered?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <Search size={28} className="mx-auto mb-3 text-slate-300" />
        <p className="font-medium">{isFiltered ? 'No results match your filters' : 'Nothing here yet'}</p>
        <p className="text-sm mt-1">{isFiltered ? 'Try clearing filters' : 'Use the button above to add one'}</p>
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-100 bg-slate-50/50">
          <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
          {showParent && (
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
              Main Category
            </th>
          )}
          <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Sort</th>
          <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
          {canEdit && <th className="px-5 py-3" />}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {rows.map(cat => (
          <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
            <td className="px-5 py-3.5">
              <div className="flex items-center gap-3">
                <CategoryThumb imageUrl={cat.imageUrl} icon={cat.icon} name={cat.name} />
                <span className="font-medium text-slate-800">{cat.name}</span>
              </div>
            </td>
            {showParent && (
              <td className="px-5 py-3.5 hidden md:table-cell">
                <span className="text-slate-500 text-sm">
                  {cat.parentId ? (parentMap[cat.parentId] ?? '—') : '—'}
                </span>
              </td>
            )}
            <td className="px-5 py-3.5 hidden md:table-cell">
              <span className="text-slate-400">{cat.sortOrder}</span>
            </td>
            <td className="px-5 py-3.5">
              <button
                onClick={() => canEdit && onToggle(cat)}
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
            {canEdit && (
              <td className="px-5 py-3.5">
                <div className="flex gap-1 justify-end">
                  <button
                    onClick={() => onEdit(cat)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => onDelete(cat)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Filter Bar ────────────────────────────────────────────────────────────────

function FilterBar({
  search, onSearch,
  status, onStatus,
  parentId, onParentId,
  parentOptions,
  totalShown, totalAll,
  onClear,
}: {
  search: string;       onSearch: (v: string) => void;
  status: string;       onStatus: (v: string) => void;
  parentId: string;     onParentId: (v: string) => void;
  parentOptions: { id: number; name: string }[];
  totalShown: number;   totalAll: number;
  onClear: () => void;
}) {
  const hasFilter = search || status || parentId;
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/40">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search by name…"
          className="w-full h-8 pl-8 pr-3 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
        />
      </div>

      {/* Status filter */}
      <select
        value={status}
        onChange={e => onStatus(e.target.value)}
        className="h-8 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      {/* Parent category filter (sub tab only) */}
      {parentOptions.length > 0 && (
        <select
          value={parentId}
          onChange={e => onParentId(e.target.value)}
          className="h-8 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
        >
          <option value="">All Main Categories</option>
          {parentOptions.map(p => (
            <option key={p.id} value={String(p.id)}>{p.name}</option>
          ))}
        </select>
      )}

      {/* Count + clear */}
      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-slate-400">
          {hasFilter ? `${totalShown} of ${totalAll}` : `${totalAll} total`}
        </span>
        {hasFilter && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors border border-slate-200 rounded-lg px-2 h-7 bg-white"
          >
            <X size={11} /> Clear
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type ActiveTab = 'main' | 'sub';

type ModalState =
  | { type: 'none' }
  | { type: 'form'; mode: 'main' | 'sub'; category?: Category | null };

export function CategoryListPage() {
  const { can } = usePermission();
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading]  = useState(true);
  const [error, setError]      = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('main');
  const [modal, setModal]      = useState<ModalState>({ type: 'none' });
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filters
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [parentId, setParentId] = useState('');

  const clearFilters = () => { setSearch(''); setStatus(''); setParentId(''); };

  // Reset filters when switching tabs
  const handleTabChange = (tab: ActiveTab) => { setActiveTab(tab); clearFilters(); };

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setAllCategories(await catalogApi.getCategories()); }
    catch (err: any) { setError(err?.response?.data?.message ?? 'Failed to load categories'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const mainCategories = allCategories.filter(c => !c.parentId);
  const subCategories  = allCategories.filter(c =>  c.parentId);
  const parentMap      = Object.fromEntries(mainCategories.map(c => [c.id, c.name]));

  const handleToggle = async (cat: Category) => {
    try {
      const updated = await catalogApi.toggleCategory(cat.id);
      setAllCategories(prev => prev.map(c => c.id === cat.id ? updated : c));
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await catalogApi.deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Delete failed');
      setDeleteTarget(null);
    } finally { setDeleting(false); }
  };

  const closeModal = () => setModal({ type: 'none' });
  const afterSave  = () => { closeModal(); load(); };

  const baseRows = activeTab === 'main' ? mainCategories : subCategories;

  const filteredRows = useMemo(() => {
    let rows = baseRows;
    if (search.trim())
      rows = rows.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    if (status === 'active')   rows = rows.filter(c =>  c.isActive);
    if (status === 'inactive') rows = rows.filter(c => !c.isActive);
    if (parentId) rows = rows.filter(c => String(c.parentId) === parentId);
    return rows;
  }, [baseRows, search, status, parentId]);

  const tabs: { id: ActiveTab; label: string; Icon: React.ElementType; count: number }[] = [
    { id: 'main', label: 'Main Categories', Icon: FolderOpen, count: mainCategories.length },
    { id: 'sub',  label: 'Sub Categories',  Icon: Folder,     count: subCategories.length  },
  ];

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle={loading ? 'Loading...' : `${mainCategories.length} main · ${subCategories.length} sub`}
        breadcrumbs={[{ label: 'Home' }, { label: 'Catalog' }, { label: 'Categories' }]}
        action={
          can('catalog.edit') && (
            <div className="flex items-center gap-2">
              {activeTab === 'main' ? (
                <Button size="sm" onClick={() => setModal({ type: 'form', mode: 'main', category: null })}>
                  <Plus size={14} /> Add Main Category
                </Button>
              ) : (
                <Button size="sm" onClick={() => setModal({ type: 'form', mode: 'sub', category: null })}>
                  <Plus size={14} /> Add Sub Category
                </Button>
              )}
            </div>
          )
        }
      />

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          <AlertCircle size={14} />{error}
        </div>
      )}

      {/* ── Info banner explaining hierarchy ── */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700 flex items-start gap-3">
        <div className="shrink-0 mt-0.5 text-blue-500">
          <FolderOpen size={16} />
        </div>
        <div>
          <span className="font-semibold">3-Level Hierarchy: </span>
          <span className="font-medium">Main Category</span>
          <ChevronRight size={12} className="inline mx-1" />
          <span className="font-medium">Sub Category</span>
          <ChevronRight size={12} className="inline mx-1" />
          <span className="font-medium">Products</span>
          <span className="text-blue-600 ml-2">
            — First add Main Category (e.g. Atta), then Sub Categories under it (e.g. Besan, Maida), then assign products to sub categories.
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {/* Tab Bar */}
        <div className="flex border-b border-slate-100 bg-slate-50/60">
          {tabs.map(({ id, label, Icon, count }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-[#EA580C] text-[#EA580C] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/60'
              }`}
            >
              <Icon size={15} />
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === id ? 'bg-orange-50 text-[#EA580C]' : 'bg-slate-100 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter Bar */}
        {!loading && (
          <FilterBar
            search={search}   onSearch={setSearch}
            status={status}   onStatus={setStatus}
            parentId={parentId} onParentId={setParentId}
            parentOptions={activeTab === 'sub' ? mainCategories.map(c => ({ id: c.id, name: c.name })) : []}
            totalShown={filteredRows.length}
            totalAll={baseRows.length}
            onClear={clearFilters}
          />
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 size={24} className="animate-spin mr-2" /> Loading...
          </div>
        ) : (
          <CategoryTable
            rows={filteredRows}
            showParent={activeTab === 'sub'}
            parentMap={parentMap}
            canEdit={can('catalog.edit')}
            onEdit={cat => setModal({ type: 'form', mode: activeTab, category: cat })}
            onDelete={setDeleteTarget}
            onToggle={handleToggle}
            isFiltered={!!(search || status || parentId)}
          />
        )}
      </div>

      {/* Modals */}
      {modal.type === 'form' && (
        <CategoryModal
          mode={modal.mode}
          category={modal.category}
          mainCategories={mainCategories}
          onClose={closeModal}
          onSave={afterSave}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
