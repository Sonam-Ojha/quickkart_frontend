import React, { useState, useEffect, useCallback } from 'react';
import { Warehouse, Search, AlertTriangle, Package, Loader2, AlertCircle, Plus, Minus, Edit2, Trash2, X } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { usePermission } from '../../hooks/usePermission';
import { inventoryApi, InventoryRow } from './api';
import { darkStoreApi, DarkStore } from '../dark-stores/api';
import { catalogApi, Product } from '../catalog/api';

const LOW_STOCK_THRESHOLD = 10;

// ── Set Stock Modal ───────────────────────────────────────

function SetStockModal({
  storeId, row, products, onClose, onSave,
}: {
  storeId: number;
  row?: InventoryRow | null;
  products: Product[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [productId, setProductId] = useState<number>(row?.productId ?? 0);
  const [qty, setQty] = useState<number>(row?.stockQty ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) { setError('Select a product'); return; }
    if (qty < 0) { setError('Qty cannot be negative'); return; }
    setSaving(true); setError('');
    try {
      await inventoryApi.setStock(storeId, productId, qty);
      onSave();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to update stock');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">{row ? 'Edit Stock' : 'Add Product to Store'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600"><AlertCircle size={14} />{error}</div>}
          {!row && (
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Product</label>
              <select
                value={productId}
                onChange={e => setProductId(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
              >
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

// ── Main Page ─────────────────────────────────────────────

export function InventoryPage() {
  const { can } = usePermission();
  const [stores, setStores] = useState<DarkStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<{ open: boolean; row?: InventoryRow | null }>({ open: false });
  const [adjusting, setAdjusting] = useState<number | null>(null);

  useEffect(() => {
    darkStoreApi.getAll().then(data => {
      setStores(data);
      if (data.length > 0) setSelectedStore(data[0].id);
    }).catch(() => {});

    catalogApi.getProducts({ limit: 500 }).then(res => setAllProducts(res.products)).catch(() => {});
  }, []);

  const loadInventory = useCallback(async () => {
    if (!selectedStore) return;
    setLoading(true); setError('');
    try {
      const rows = await inventoryApi.getByStore(selectedStore, {
        search: search || undefined,
        lowStock: lowStockOnly || undefined,
      });
      setInventory(rows);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load inventory');
    } finally { setLoading(false); }
  }, [selectedStore, search, lowStockOnly]);

  useEffect(() => { loadInventory(); }, [loadInventory]);

  const handleAdjust = async (row: InventoryRow, delta: number) => {
    setAdjusting(row.id);
    try {
      const res = await inventoryApi.adjustStock(selectedStore!, row.productId, delta);
      setInventory(prev => prev.map(r => r.id === row.id ? { ...r, stockQty: res.inventory.stockQty } : r));
    } catch {} finally { setAdjusting(null); }
  };

  const handleRemove = async (row: InventoryRow) => {
    if (!confirm(`Remove ${row.product.name} from this store's inventory?`)) return;
    try {
      await inventoryApi.removeEntry(selectedStore!, row.productId);
      loadInventory();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to remove');
    }
  };

  const lowStockCount = inventory.filter(r => r.stockQty < LOW_STOCK_THRESHOLD).length;
  const storeName = stores.find(s => s.id === selectedStore)?.name ?? '';

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle={selectedStore ? `${storeName}` : 'Select a store'}
        breadcrumbs={[{ label: 'Home' }, { label: 'Catalog' }, { label: 'Inventory' }]}
        action={can('catalog.edit') && selectedStore && (
          <Button size="sm" onClick={() => setModal({ open: true, row: null })}>
            <Plus size={14} /> Add Product
          </Button>
        )}
      />

      {/* Store selector */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Store</label>
          <select
            value={selectedStore ?? ''}
            onChange={e => setSelectedStore(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 min-w-48"
          >
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-48 max-w-xs">
          <label className="text-xs font-medium text-slate-600 mb-1 block">Search</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search products..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm cursor-pointer h-[38px]">
            <input type="checkbox" checked={lowStockOnly} onChange={e => setLowStockOnly(e.target.checked)} className="accent-[#EA580C]" />
            <span className="text-slate-600">Low stock only</span>
            {lowStockCount > 0 && <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full font-medium">{lowStockCount}</span>}
          </label>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          <AlertCircle size={14} />{error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {!selectedStore ? (
          <div className="text-center py-16 text-slate-400">
            <Warehouse size={36} className="mx-auto mb-3 text-slate-200" />
            <p>Select a store to view inventory</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 size={22} className="animate-spin mr-2" /> Loading...
          </div>
        ) : inventory.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Package size={36} className="mx-auto mb-3 text-slate-200" />
            <p className="font-medium">No inventory entries</p>
            <p className="text-sm mt-1">Add products to this store using the button above</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Product</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Category</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Stock</th>
                {can('catalog.edit') && <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {inventory.map(row => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {row.product.imageUrl
                          ? <img src={row.product.imageUrl} alt="" className="w-full h-full object-cover" />
                          : <Package size={16} className="text-slate-300" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{row.product.name}</p>
                        <p className="text-xs text-slate-400">{row.product.brand}{row.product.brand && row.product.unit ? ' · ' : ''}{row.product.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 font-medium">
                      {row.product.category?.name ?? '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-sm ${row.stockQty === 0 ? 'text-red-500' : row.stockQty < LOW_STOCK_THRESHOLD ? 'text-amber-600' : 'text-slate-800'}`}>
                        {row.stockQty}
                      </span>
                      {row.stockQty === 0 && (
                        <span className="text-xs bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full font-medium">Out of stock</span>
                      )}
                      {row.stockQty > 0 && row.stockQty < LOW_STOCK_THRESHOLD && (
                        <span className="flex items-center gap-0.5 text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full font-medium">
                          <AlertTriangle size={10} /> Low
                        </span>
                      )}
                    </div>
                  </td>
                  {can('catalog.edit') && (
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleAdjust(row, -1)}
                          disabled={adjusting === row.id || row.stockQty === 0}
                          className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-500 disabled:opacity-40 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <button
                          onClick={() => handleAdjust(row, 1)}
                          disabled={adjusting === row.id}
                          className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-500 disabled:opacity-40 transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          onClick={() => setModal({ open: true, row })}
                          className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors ml-1"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleRemove(row)}
                          className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
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

      {modal.open && selectedStore && (
        <SetStockModal
          storeId={selectedStore}
          row={modal.row}
          products={allProducts}
          onClose={() => setModal({ open: false })}
          onSave={() => { setModal({ open: false }); loadInventory(); }}
        />
      )}
    </div>
  );
}
