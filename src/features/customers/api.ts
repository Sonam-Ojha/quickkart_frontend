import api from '../../lib/api';

export interface Customer {
  id: number;
  name: string;
  email: string;
  mobile: string | null;
  avatar: string | null;
  walletBalance: number;
  referralCode: string | null;
  isActive: boolean;
  created_at: string;
}

export interface CustomerListResponse {
  customers: Customer[];
  total: number;
  page: number;
  pages: number;
}

export const customerApi = {
  getAll: (params?: { search?: string; status?: string; page?: number; limit?: number }) =>
    api.get<CustomerListResponse>('/api/admin/customers', { params }).then(r => r.data),

  getById: (id: number) =>
    api.get<{ customer: Customer }>(`/api/admin/customers/${id}`).then(r => r.data.customer),

  toggleBlock: (id: number) =>
    api.patch<{ id: number; isActive: boolean; message: string }>(`/api/admin/customers/${id}/toggle-block`).then(r => r.data),
};
