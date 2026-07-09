import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Package, Edit2, Trash2, Loader2, AlertCircle, X } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { money } from '../../lib/utils';
import { usePermission } from '../../hooks/usePermission';
import { catalogApi, Product, ProductPayload, Category } from './api';
import ImageUploadField from '../../components/common/ImageUploadField';

// ── Product Modal ─────────────────────────────────────────

interface ProductModalProps {
  product?: Product | null;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
}

function ProductModal({ product, categories, onClose, onSave }: ProductModalProps) {
  const [form, setForm] = useState<ProductPayload>({
    name: product?.name ?? '',
    categoryId: product?.categoryId ?? (categories[0]?.id ?? 0),
    brand: product?.brand ?? '',
    unit: product?.unit ?? '',
    mrp: product ? product.mrp / 100 : 0,
    price: product ? product.price / 100 : 0,
    imageUrl: product?.imageUrl ?? '',
    tag: product?.tag ?? null,
    isActive: product?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof ProductPayload, val: any) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.categoryId) { setError('Category is required'); return; }
    if (!form.mrp || !form.price) { setError('MRP and Price are required'); return; }
    setSaving(true);
    setError('');
    try {
      // convert ₹ to paise before sending
      const payload = { ...form, mrp: Math.round(form.mrp * 100), price: Math.round(form.price * 100) };
      if (product) {
        await catalogApi.updateProduct(product.id, payload);
      } else {
        await catalogApi.createProduct(payload);
      }
      onSave();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="font-semibold text-slate-800">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              <AlertCircle size={14} />{error}
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Product Name *</label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Amul Milk 500ml" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Category *</label>
              <select
                value={form.categoryId}
                onChange={e => set('categoryId', Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
              >
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
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
            <div>
              <ImageUploadField
                label="Image"
                value={form.imageUrl ?? ''}
                onChange={url => set('imageUrl', url)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">MRP (₹) *</label>
              <Input type="number" step="0.01" min="0" value={form.mrp} onChange={e => set('mrp', Number(e.target.value))} placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Selling Price (₹) *</label>
              <Input type="number" step="0.01" min="0" value={form.price} onChange={e => set('price', Number(e.target.value))} placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Homepage Tag</label>
            <select
              value={form.tag ?? ''}
              onChange={e => set('tag', e.target.value || null)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
            >
              <option value="">— None —</option>
              <option value="deal">🔥 Deal of the Day</option>
              <option value="bestseller">⭐ Best Seller</option>
              <option value="new">🆕 New Arrival</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">Controls which homepage section this product appears in</p>
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
    </div>
  );
}

// ── Delete Confirm ────────────────────────────────────────

function DeleteConfirm({ name, onConfirm, onClose, loading }: { name: string; onConfirm: () => void; onClose: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────

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
  const [modal, setModal] = useState<{ open: boolean; product?: Product | null }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCategories = async () => {
    try {
      const data = await catalogApi.getCategories();
      setCategories(data);
    } catch {}
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await catalogApi.getProducts({
        categoryId: categoryFilter,
        search: search || undefined,
        activeOnly: activeOnly || undefined,
        page,
        limit: LIMIT,
      });
      setProducts(res.products);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, search, activeOnly, page]);

  useEffect(() => { loadCategories(); }, []);
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
      setDeleteTarget(null);
      loadProducts();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Delete failed');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={loading ? 'Loading...' : `${total} products`}
        breadcrumbs={[{ label: 'Home' }, { label: 'Catalog' }, { label: 'Products' }]}
        action={
          can('catalog.edit') && (
            <Button size="sm" onClick={() => setModal({ open: true, product: null })}>
              <Plus size={14} /> Add Product
            </Button>
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
          <Input
            placeholder="Search products..."
            className="pl-9"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <label className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={activeOnly} onChange={e => { setActiveOnly(e.target.checked); setPage(1); }} className="accent-[#EA580C]" />
          Active only
        </label>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
        <button
          onClick={() => { setCategoryFilter(undefined); setPage(1); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            !categoryFilter ? 'bg-[#EA580C] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-200'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setCategoryFilter(cat.id); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              categoryFilter === cat.id ? 'bg-[#EA580C] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-200'
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Product grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading products...
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Package size={40} className="mx-auto mb-3 text-slate-200" />
          <p className="font-medium">No products found</p>
          <p className="text-sm mt-1">Try a different search or add a product</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-orange-200 hover:shadow-sm transition-all group">
              {/* Image area */}
              <div className="h-36 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center relative">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <Package size={40} className="text-slate-200" />
                )}
                {!product.isActive && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-full">Inactive</span>
                  </div>
                )}
              </div>
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
                  <button
                    onClick={() => can('catalog.edit') && handleToggle(product)}
                    className={`ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      product.isActive ? 'text-green-600 bg-green-50' : 'text-slate-500 bg-slate-100'
                    }`}
                  >
                    {product.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
                {can('catalog.edit') && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setModal({ open: true, product })}>
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

      {modal.open && (
        <ProductModal
          product={modal.product}
          categories={categories}
          onClose={() => setModal({ open: false })}
          onSave={() => { setModal({ open: false }); loadProducts(); }}
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
