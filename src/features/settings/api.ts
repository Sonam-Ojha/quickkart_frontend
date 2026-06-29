import api from '../../lib/api';

export type Settings = Record<string, string>;

export const settingsApi = {
  getAll: () => api.get<Settings>('/api/admin/settings').then(r => r.data),
  save:   (data: Settings) => api.post<{ message: string }>('/api/admin/settings', data).then(r => r.data),
};
