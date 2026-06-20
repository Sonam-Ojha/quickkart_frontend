import api from '../../lib/api';

export interface DarkStore {
  id: number;
  name: string;
  address: string;
  city: string;
  lat: number | string | null;
  lng: number | string | null;
  isActive: boolean;
}

export interface DarkStorePayload {
  name: string;
  address: string;
  city: string;
  lat?: number;
  lng?: number;
  isActive?: boolean;
}

export interface StoreStats {
  activeRiders: number;
  totalSKUs: number;
}

export const darkStoreApi = {
  getAll: () =>
    api.get<{ stores: DarkStore[] }>('/api/admin/dark-stores').then(r => r.data.stores),

  getById: (id: number) =>
    api.get<{ store: DarkStore }>(`/api/admin/dark-stores/${id}`).then(r => r.data.store),

  getStats: (id: number) =>
    api.get<StoreStats>(`/api/admin/dark-stores/${id}/stats`).then(r => r.data),

  create: (data: DarkStorePayload) =>
    api.post<{ store: DarkStore }>('/api/admin/dark-stores', data).then(r => r.data.store),

  update: (id: number, data: Partial<DarkStorePayload>) =>
    api.put<{ store: DarkStore }>(`/api/admin/dark-stores/${id}`, data).then(r => r.data.store),

  toggle: (id: number) =>
    api.patch<{ store: DarkStore }>(`/api/admin/dark-stores/${id}/toggle`).then(r => r.data.store),

  remove: (id: number) =>
    api.delete(`/api/admin/dark-stores/${id}`).then(r => r.data),
};
