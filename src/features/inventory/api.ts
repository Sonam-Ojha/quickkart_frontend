import api from '../../lib/api';

export interface InventoryRow {
  id: number;
  productId: number;
  storeId: number;
  stockQty: number;
  product: {
    id: number;
    name: string;
    brand: string | null;
    unit: string | null;
    imageUrl: string | null;
    category: { id: number; name: string };
  };
}

export const inventoryApi = {
  getByStore: (storeId: number, params?: { search?: string; lowStock?: boolean }) =>
    api.get<{ inventory: InventoryRow[] }>(`/api/admin/inventory/store/${storeId}`, { params }).then(r => r.data.inventory),

  setStock: (storeId: number, productId: number, stockQty: number) =>
    api.post(`/api/admin/inventory/store/${storeId}`, { productId, stockQty }).then(r => r.data),

  adjustStock: (storeId: number, productId: number, delta: number) =>
    api.patch(`/api/admin/inventory/store/${storeId}/adjust`, { productId, delta }).then(r => r.data),

  removeEntry: (storeId: number, productId: number) =>
    api.delete(`/api/admin/inventory/store/${storeId}/product/${productId}`).then(r => r.data),
};
