import api from '../../lib/api';

export type BgType = 'orange-tint' | 'teal-tint' | 'blue-tint' | 'emerald-tint' | 'rose-tint' | 'purple-tint';
export type BannerSection = 'hero' | 'promo';

export interface Banner {
  id: number;
  title: string | null;
  subtitle: string | null;
  bannerImage: string;
  section: BannerSection;
  emoji: string | null;
  bgType: BgType | null;
  deeplink: string | null;
  sortOrder: number;
  validTo: string | null;
  isActive: boolean;
  created_at: string;
}

export interface BannerPayload {
  title?: string | null;
  subtitle?: string | null;
  bannerImage: string;
  section?: BannerSection;
  emoji?: string | null;
  bgType: BgType | null;
  deeplink?: string | null;
  sortOrder?: number;
  validTo?: string | null;
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
