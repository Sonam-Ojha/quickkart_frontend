import api from '../../lib/api';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  created_at: string;
}

export interface InvitePayload {
  name: string;
  email: string;
  role: string;
}

export interface UpdatePayload {
  role?: string;
  isActive?: boolean;
}

export const adminUsersApi = {
  list: () =>
    api.get<{ users: AdminUser[] }>('/api/admin/users').then(r => r.data.users),

  invite: (data: InvitePayload) =>
    api.post<{ message: string; user: AdminUser; tempPassword: string }>(
      '/api/admin/users/invite', data
    ).then(r => r.data),

  update: (id: number, data: UpdatePayload) =>
    api.put<{ message: string; user: AdminUser }>(
      `/api/admin/users/${id}`, data
    ).then(r => r.data),
};
