import api from '../../lib/api';

export interface ProfileData {
  id: number;
  name: string;
  email: string;
  mobile: string | null;
  avatar: string | null;
  dob: string | null;
  role: string;
  walletBalance: number;
  referralCode: string | null;
  isActive: boolean;
  created_at: string;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  mobile?: string;
  avatar?: string;
  dob?: string;
}

export const profileApi = {
  get: () =>
    api.get<{ profile: ProfileData }>('/api/admin/profile').then(r => r.data.profile),

  update: (data: UpdateProfilePayload) =>
    api.put<{ profile: ProfileData }>('/api/admin/profile', data).then(r => r.data.profile),

  changePassword: (oldPassword: string, newPassword: string) =>
    api.patch('/api/admin/profile/password', { oldPassword, newPassword }).then(r => r.data),
};
