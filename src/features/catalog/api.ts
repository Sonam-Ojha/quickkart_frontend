import api from '../../lib/api';

// ── Types ─────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  parentId: number | null;
  icon: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  showInFilter: boolean;
  showInGrid: boolean;
}

export interface CategoryPayload {
  name: string;
  parentId?: number | null;
  icon?: string;
  imageUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
  showInFilter?: boolean;
  showInGrid?: boolean;
}

export interface Product {
  id: number;
  name: string;
  categoryId: number;
  category?: { id: number; name: string };
  brand: string | null;
  unit: string | null;
  mrp: number;
  price: number;
  imageUrl: string | null;
  tag: 'deal' | 'bestseller' | 'new' | null;
  isActive: boolean;
}

export interface ProductPayload {
  name: string;
  categoryId: number;
  brand?: string;
  unit?: string;
  mrp: number;
  price: number;
  imageUrl?: string;
  tag?: 'deal' | 'bestseller' | 'new' | null;
  isActive?: boolean;
}

export interface ProductsResponse {
  total: number;
  page: number;
  limit: number;
  products: Product[];
}

// ── Category APIs ─────────────────────────────────────────

export const catalogApi = {
  // Categories
  getCategories: () =>
    api.get<{ categories: Category[] }>('/api/admin/catalog/categories').then(r => r.data.categories),

  createCategory: (data: CategoryPayload) =>
    api.post<{ category: Category }>('/api/admin/catalog/categories', data).then(r => r.data.category),

  updateCategory: (id: number, data: Partial<CategoryPayload>) =>
    api.put<{ category: Category }>(`/api/admin/catalog/categories/${id}`, data).then(r => r.data.category),

  deleteCategory: (id: number) =>
    api.delete(`/api/admin/catalog/categories/${id}`).then(r => r.data),

  toggleCategory: (id: number) =>
    api.patch<{ category: Category }>(`/api/admin/catalog/categories/${id}/toggle`).then(r => r.data.category),

  bulkCreateCategories: (rows: CategoryPayload[]) =>
    api.post<{ created: number; categories: Category[] }>('/api/admin/catalog/categories/bulk-create', { rows }).then(r => r.data),

  bulkUpdateCategories: (ids: number[], data: Partial<CategoryPayload>) =>
    api.patch<{ updated: number }>('/api/admin/catalog/categories/bulk', { ids, data }).then(r => r.data),

  bulkDeleteCategories: (ids: number[]) =>
    api.delete<{ deleted: number }>('/api/admin/catalog/categories/bulk', { data: { ids } }).then(r => r.data),

  // Products
  getProducts: (params?: { categoryId?: number; search?: string; activeOnly?: boolean; page?: number; limit?: number }) =>
    api.get<ProductsResponse>('/api/admin/catalog/products', { params }).then(r => r.data),

  createProduct: (data: ProductPayload) =>
    api.post<{ product: Product }>('/api/admin/catalog/products', data).then(r => r.data.product),

  updateProduct: (id: number, data: Partial<ProductPayload>) =>
    api.put<{ product: Product }>(`/api/admin/catalog/products/${id}`, data).then(r => r.data.product),

  deleteProduct: (id: number) =>
    api.delete(`/api/admin/catalog/products/${id}`).then(r => r.data),

  toggleProduct: (id: number) =>
    api.patch<{ product: Product }>(`/api/admin/catalog/products/${id}/toggle`).then(r => r.data.product),

  bulkCreateProducts: (rows: ProductPayload[]) =>
    api.post<{ created: number; products: Product[] }>('/api/admin/catalog/products/bulk-create', { rows }).then(r => r.data),

  bulkUpdateProducts: (ids: number[], data: Partial<ProductPayload>) =>
    api.patch<{ updated: number }>('/api/admin/catalog/products/bulk', { ids, data }).then(r => r.data),

  bulkDeleteProducts: (ids: number[]) =>
    api.delete<{ deleted: number }>('/api/admin/catalog/products/bulk', { data: { ids } }).then(r => r.data),
};
