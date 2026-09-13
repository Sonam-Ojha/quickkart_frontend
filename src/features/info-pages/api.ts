import api from '../../lib/api';

export interface InfoSection { heading: string; body: string }
export interface InfoPage {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  sections: InfoSection[];
  isActive: boolean;
}

export const infoPageApi = {
  list: ()                          => api.get<InfoPage[]>('/api/admin/info-pages').then(r => r.data),
  get:  (id: number)                => api.get<InfoPage>(`/api/admin/info-pages/${id}`).then(r => r.data),
  create: (data: Partial<InfoPage>) => api.post<InfoPage>('/api/admin/info-pages', data).then(r => r.data),
  update: (id: number, data: Partial<InfoPage>) => api.put<InfoPage>(`/api/admin/info-pages/${id}`, data).then(r => r.data),
  remove: (id: number)              => api.delete(`/api/admin/info-pages/${id}`),
};
