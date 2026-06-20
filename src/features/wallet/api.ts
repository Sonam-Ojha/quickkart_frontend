import api from '../../lib/api';

export interface WalletTransaction {
  id: number;
  type: 'credit' | 'debit';
  amount: number;
  source: string;
  balanceAfter: number;
  note: string | null;
  created_at: string;
  user?: { id: number; name: string; email: string; mobile: string | null };
}

export interface WalletStats { totalCredits: number; totalDebits: number; txnCount: number; }

export const walletApi = {
  getStats: () => api.get<WalletStats>('/api/admin/wallet/stats').then(r => r.data),
  getAll:   (params?: { type?: string; source?: string; search?: string; page?: number }) =>
    api.get<{ transactions: WalletTransaction[]; total: number; page: number; pages: number }>(
      '/api/admin/wallet', { params }
    ).then(r => r.data),
};
