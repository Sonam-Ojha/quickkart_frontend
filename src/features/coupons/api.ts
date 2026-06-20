import api from '../../lib/api';

export interface Coupon {
  id: number;
  code: string;
  type: 'flat' | 'percent';
  value: number;
  maxDiscount: number | null;
  minOrder: number;
  usageLimit: number | null;
  perUserLimit: number;
  usedCount: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  created_at: string;
}

export interface CouponPayload {
  code: string;
  type: 'flat' | 'percent';
  value: number;
  maxDiscount?: number;
  minOrder?: number;
  usageLimit?: number;
  perUserLimit?: number;
  validFrom: string;
  validTo: string;
  isActive?: boolean;
}

export const couponApi = {
  getAll: (params?: { search?: string; status?: string }) =>
    api.get<{ coupons: Coupon[] }>('/api/admin/coupons', { params }).then(r => r.data.coupons),

  create: (data: CouponPayload) =>
    api.post<{ coupon: Coupon }>('/api/admin/coupons', data).then(r => r.data.coupon),

  update: (id: number, data: Partial<CouponPayload>) =>
    api.put<{ coupon: Coupon }>(`/api/admin/coupons/${id}`, data).then(r => r.data.coupon),

  toggle: (id: number) =>
    api.patch<{ coupon: Coupon }>(`/api/admin/coupons/${id}/toggle`).then(r => r.data.coupon),

  remove: (id: number) =>
    api.delete(`/api/admin/coupons/${id}`).then(r => r.data),
};
