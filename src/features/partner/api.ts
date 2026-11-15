import axios from 'axios';
import { usePartnerStore, PartnerStaff, PartnerRestaurantRef } from './partner.store';
import type { Restaurant, MenuCategory, MenuItem, MenuItemPayload } from '../food/api';

const DEFAULT_API = import.meta.env.DEV ? 'http://localhost:4000' : 'https://api.jhatpats.com';

// Separate client: partner token, and a 401 signs the partner out (not the admin).
const http = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API}/api/partner`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});
http.interceptors.request.use((config) => {
  const token = usePartnerStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && usePartnerStore.getState().token) usePartnerStore.getState().logout();
    return Promise.reject(err);
  },
);

export type OrderGroup = 'new' | 'preparing' | 'onTheWay' | 'done';

export interface PartnerOrder {
  id: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  subtotal: number;
  deliveryFee: number;
  total: number;
  cancelReason: string | null;
  readyAt: string | null;
  created_at: string;
  items: { id: number; itemName: string | null; quantity: number; unitPrice: number; total: number }[];
  customer: { id: number; name: string; mobile: string | null } | null;
  address: { label: string | null; line1: string | null; line2: string | null; city: string | null; pincode: string | null; phone: string | null } | null;
  payment: { gateway: string; status: string } | null;
}

export interface EarningsPeriod { orders: number; sales: number; commission: number; payout: number }
export interface Earnings {
  commissionPct: number;
  today: EarningsPeriod; week: EarningsPeriod; month: EarningsPeriod;
  cancelledThisMonth: number;
}

export interface DashSummary {
  orders: number; delivered: number; cancelled: number; rejected: number;
  sales: number; commission: number; payout: number; avgOrderValue: number;
  avgAcceptMins: number | null; avgPrepMins: number | null; acceptRate: number | null;
  customers: number; repeatCustomers: number;
}
export interface PartnerDashboard {
  range: number; commissionPct: number;
  live: { new: number; preparing: number; onTheWay: number };
  today: DashSummary; current: DashSummary; previous: DashSummary;
  daily: { date: string; orders: number; sales: number; cancelled: number }[];
  hourly: { hour: number; orders: number }[];
  topItems: { name: string; qty: number; sales: number }[];
  status: { new: number; preparing: number; onTheWay: number; delivered: number; cancelled: number };
  recent: { id: number; status: PartnerOrder['status']; subtotal: number; created_at: string; items: string }[];
}

export const partnerApi = {
  login: (mobile: string, password: string) =>
    http.post<{ token: string; staff: PartnerStaff; restaurant: PartnerRestaurantRef }>('/auth/login', { mobile, password }).then(r => r.data),
  me: () => http.get<{ staff: PartnerStaff; restaurant: Restaurant & { openNow: boolean } }>('/me').then(r => r.data),

  restaurant: () => http.get<{ restaurant: Restaurant & { openNow: boolean } }>('/restaurant').then(r => r.data.restaurant),
  updateRestaurant: (data: Partial<Restaurant>) =>
    http.patch<{ restaurant: Restaurant & { openNow: boolean } }>('/restaurant', data).then(r => r.data.restaurant),

  orders: (group: OrderGroup) =>
    http.get<{ orders: PartnerOrder[]; counts: Record<OrderGroup, number | null> }>('/orders', { params: { group } }).then(r => r.data),
  accept:    (id: number) => http.post<{ order: PartnerOrder }>(`/orders/${id}/accept`).then(r => r.data.order),
  preparing: (id: number) => http.post<{ order: PartnerOrder }>(`/orders/${id}/preparing`).then(r => r.data.order),
  ready:     (id: number) => http.post<{ order: PartnerOrder }>(`/orders/${id}/ready`).then(r => r.data.order),
  reject:    (id: number, reason: string) => http.post<{ order: PartnerOrder }>(`/orders/${id}/reject`, { reason }).then(r => r.data.order),

  dashboard: (days: number) => http.get<PartnerDashboard>('/dashboard', { params: { days } }).then(r => r.data),
  earnings: () => http.get<Earnings>('/earnings').then(r => r.data),

  menu: () => http.get<{ categories: MenuCategory[]; items: MenuItem[] }>('/menu').then(r => r.data),
  createCategory: (data: Partial<MenuCategory>) => http.post<{ category: MenuCategory }>('/menu-categories', data).then(r => r.data.category),
  updateCategory: (catId: number, data: Partial<MenuCategory>) => http.put<{ category: MenuCategory }>(`/menu-categories/${catId}`, data).then(r => r.data.category),
  removeCategory: (catId: number) => http.delete(`/menu-categories/${catId}`).then(r => r.data),
  createItem: (data: MenuItemPayload) => http.post<{ item: MenuItem }>('/menu-items', data).then(r => r.data.item),
  updateItem: (itemId: number, data: MenuItemPayload) => http.put<{ item: MenuItem }>(`/menu-items/${itemId}`, data).then(r => r.data.item),
  toggleItem: (itemId: number) => http.patch<{ item: MenuItem }>(`/menu-items/${itemId}/toggle`).then(r => r.data.item),
  removeItem: (itemId: number) => http.delete(`/menu-items/${itemId}`).then(r => r.data),

  upload: (fd: FormData) =>
    http.post<{ url: string }>('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data.url),
};
