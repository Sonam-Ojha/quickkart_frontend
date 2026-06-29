import api from '../../lib/api';

// ── Types ─────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  parentId: number | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface CategoryPayload {
  name: string;
  parentId?: number | null;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
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
};
