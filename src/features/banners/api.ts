import api from '../../lib/api';

export interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  bannerImage: string;
  bgType: 'orange-tint' | 'teal-tint';
  deeplink: string | null;
  sortOrder: number;
  validTo: string | null;
  isActive: boolean;
  created_at: string;
}

export interface BannerPayload {
  title: string;
  subtitle?: string;
  bannerImage: string;
  bgType: 'orange-tint' | 'teal-tint';
  deeplink?: string;
  sortOrder?: number;
  validTo?: string;
  isActive?: boolean;
}

export const bannerApi = {
  getAll: () =>
    api.get<{ banners: Banner[] }>('/api/admin/banners').then(r => r.data.banners),

  create: (data: BannerPayload) =>
    api.post<{ banner: Banner }>('/api/admin/banners', data).then(r => r.data.banner),

  update: (id: number, data: Partial<BannerPayload>) =>
    api.put<{ banner: Banner }>(`/api/admin/banners/${id}`, data).then(r => r.data.banner),

  toggle: (id: number) =>
    api.patch<{ banner: Banner }>(`/api/admin/banners/${id}/toggle`).then(r => r.data.banner),

  remove: (id: number) =>
    api.delete(`/api/admin/banners/${id}`).then(r => r.data),
};
