import api from '../../lib/api';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface OrderCustomer { id: number; name: string; email: string; mobile: string | null; }
export interface OrderStore    { id: number; name: string; city: string; }
export interface OrderRider    { id: number; name: string; mobile: string; rating: number; }
export interface OrderProduct  { id: number; name: string; imageUrl: string | null; }
export interface OrderItem     { id: number; quantity: number; unitPrice: number; total: number; product: OrderProduct; }
export interface OrderTimeline { id: number; status: OrderStatus; note: string | null; createdAt: string; }

export interface Order {
  id: number;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  cancelReason: string | null;
  customer: OrderCustomer;
  store: OrderStore;
  rider: OrderRider | null;
  items?: OrderItem[];
  timeline?: OrderTimeline[];
  created_at: string;
}

export interface OrderStats {
  total: number;
  pending: number;
  active: number;
  delivered: number;
  cancelled: number;
  revenue: number;
}

export const orderApi = {
  getStats: () =>
    api.get<OrderStats>('/api/admin/orders/stats').then(r => r.data),

  getAll: (params?: { status?: string; search?: string; page?: number; limit?: number }) =>
    api.get<{ orders: Order[]; total: number; page: number; pages: number }>(
      '/api/admin/orders', { params }
    ).then(r => r.data),

  getById: (id: number) =>
    api.get<{ order: Order }>(`/api/admin/orders/${id}`).then(r => r.data.order),

  updateStatus: (id: number, status: OrderStatus, note?: string) =>
    api.patch<{ order: Order }>(`/api/admin/orders/${id}/status`, { status, note }).then(r => r.data.order),

  assignRider: (orderId: number, riderId: number | null) =>
    api.patch<{ order: Order }>(`/api/admin/orders/${orderId}/assign-rider`, { riderId }).then(r => r.data.order),
};
