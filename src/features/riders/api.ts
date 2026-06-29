import api from '../../lib/api';

export interface Rider {
  id: number;
  name: string;
  mobile: string;
  storeId: number;
  store?: { id: number; name: string; city: string };
  vehicleType: 'bike' | 'scooter' | 'cycle' | 'other';
  vehicleNumber: string | null;
  isOnline: boolean;
  rating: number;
  totalDeliveries: number;
  totalEarnings: number;
  status: 'active' | 'inactive' | 'suspended';
}

export interface RiderPayload {
  name: string;
  mobile: string;
  storeId: number;
  vehicleType?: 'bike' | 'scooter' | 'cycle' | 'other';
  vehicleNumber?: string;
  password?: string;
  rating?: number;
  status?: 'active' | 'inactive' | 'suspended';
}

export const riderApi = {
  getAll: (params?: { storeId?: number; status?: string; search?: string }) =>
    api.get<{ riders: Rider[] }>('/api/admin/riders', { params }).then(r => r.data.riders),

  create: (data: RiderPayload) =>
    api.post<{ rider: Rider }>('/api/admin/riders', data).then(r => r.data.rider),

  update: (id: number, data: Partial<RiderPayload>) =>
    api.put<{ rider: Rider }>(`/api/admin/riders/${id}`, data).then(r => r.data.rider),

  toggle: (id: number) =>
    api.patch<{ rider: Rider }>(`/api/admin/riders/${id}/toggle`).then(r => r.data.rider),

  remove: (id: number) =>
    api.delete(`/api/admin/riders/${id}`).then(r => r.data),

  setPassword: (id: number, password: string) =>
    api.patch(`/api/admin/riders/${id}/set-password`, { password }).then(r => r.data),
};
