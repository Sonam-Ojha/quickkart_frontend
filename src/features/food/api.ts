import api from '../../lib/api';

export interface Restaurant {
  id: number;
  storeId: number;
  name: string;
  description: string | null;
  cuisines: string | null;
  imageUrl: string | null;
  address: string;
  lat: number | string | null;
  lng: number | string | null;
  phone: string | null;
  isPureVeg: boolean;
  commissionPct: number | string;
  prepTimeMins: number;
  openTime: string | null;
  closeTime: string | null;
  isOpen: boolean;
  isActive: boolean;
  sortOrder: number;
  store?: { id: number; name: string; city: string; foodEnabled: boolean };
  itemCount?: number;
  openNow?: boolean;
}

export type RestaurantPayload = Partial<Omit<Restaurant, 'id' | 'store' | 'itemCount' | 'openNow'>>;

export interface MenuCategory {
  id: number;
  restaurantId: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuItem {
  id: number;
  restaurantId: number;
  menuCategoryId: number | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  mrp: number | null;
  unit: string | null;
  isVeg: boolean;
  isAvailable: boolean;
  isActive: boolean;
  sortOrder: number;
}

export type MenuItemPayload = Partial<Omit<MenuItem, 'id' | 'restaurantId'>>;

const base = '/api/admin/food/restaurants';

export const foodApi = {
  list: () => api.get<{ restaurants: Restaurant[] }>(base).then(r => r.data.restaurants),
  get: (id: number) => api.get<{ restaurant: Restaurant }>(`${base}/${id}`).then(r => r.data.restaurant),
  create: (data: RestaurantPayload) => api.post<{ restaurant: Restaurant }>(base, data).then(r => r.data.restaurant),
  update: (id: number, data: RestaurantPayload) => api.put<{ restaurant: Restaurant }>(`${base}/${id}`, data).then(r => r.data.restaurant),
  /** field 'isOpen' = open right now; default = listed / hidden */
  toggle: (id: number, field: 'isActive' | 'isOpen' = 'isActive') =>
    api.patch<{ restaurant: Restaurant }>(`${base}/${id}/toggle`, null, { params: { field } }).then(r => r.data.restaurant),
  remove: (id: number) => api.delete(`${base}/${id}`).then(r => r.data),

  menu: (id: number) => api.get<{ categories: MenuCategory[]; items: MenuItem[] }>(`${base}/${id}/menu`).then(r => r.data),
  createCategory: (id: number, data: Partial<MenuCategory>) =>
    api.post<{ category: MenuCategory }>(`${base}/${id}/menu-categories`, data).then(r => r.data.category),
  updateCategory: (id: number, catId: number, data: Partial<MenuCategory>) =>
    api.put<{ category: MenuCategory }>(`${base}/${id}/menu-categories/${catId}`, data).then(r => r.data.category),
  removeCategory: (id: number, catId: number) => api.delete(`${base}/${id}/menu-categories/${catId}`).then(r => r.data),
  createItem: (id: number, data: MenuItemPayload) =>
    api.post<{ item: MenuItem }>(`${base}/${id}/menu-items`, data).then(r => r.data.item),
  updateItem: (id: number, itemId: number, data: MenuItemPayload) =>
    api.put<{ item: MenuItem }>(`${base}/${id}/menu-items/${itemId}`, data).then(r => r.data.item),
  toggleItem: (id: number, itemId: number) =>
    api.patch<{ item: MenuItem }>(`${base}/${id}/menu-items/${itemId}/toggle`).then(r => r.data.item),
  removeItem: (id: number, itemId: number) => api.delete(`${base}/${id}/menu-items/${itemId}`).then(r => r.data),
};
