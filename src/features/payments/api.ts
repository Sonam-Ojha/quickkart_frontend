import api from '../../lib/api';

export interface Payment {
  id: number;
  orderId: number;
  txnId: string | null;
  gateway: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  refundedAt: string | null;
  created_at: string;
  order?: { id: number; total: number; status: string; customer?: { id: number; name: string; email: string } };
}

export interface PaymentStats {
  total: number; paid: number; failed: number; refunded: number; pending: number; revenue: number;
}

export const paymentApi = {
  getStats: () => api.get<PaymentStats>('/api/admin/payments/stats').then(r => r.data),
  getAll:   (params?: { status?: string; gateway?: string; search?: string; page?: number }) =>
    api.get<{ payments: Payment[]; total: number; page: number; pages: number }>(
      '/api/admin/payments', { params }
    ).then(r => r.data),
};
