import api from '../../lib/api';

export interface ReferralUser {
  id: number;
  name: string;
  email: string;
  mobile: string | null;
}

export interface Referral {
  id: number;
  referralCode: string;
  status: 'pending' | 'approved' | 'rejected';
  rewardAmount: number;
  referrer: ReferralUser;
  referee: ReferralUser;
  created_at: string;
}

export interface ReferralStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  totalRewards: number;
}

export const referralApi = {
  getStats: () =>
    api.get<ReferralStats>('/api/admin/referrals/stats').then(r => r.data),

  getAll: (params?: { status?: string; search?: string; page?: number; limit?: number }) =>
    api.get<{ referrals: Referral[]; total: number; page: number; pages: number }>(
      '/api/admin/referrals', { params }
    ).then(r => r.data),

  updateStatus: (id: number, status: string, rewardAmount?: number) =>
    api.patch<{ referral: Referral }>(`/api/admin/referrals/${id}`, { status, rewardAmount }).then(r => r.data.referral),
};
