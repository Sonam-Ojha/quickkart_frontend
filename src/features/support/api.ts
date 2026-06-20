import api from '../../lib/api';

export interface SupportMessage {
  id: number; ticketId: number; senderType: 'user' | 'admin';
  senderId: number; message: string; createdAt: string;
}

export interface SupportTicket {
  id: number;
  category: string; status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  customer?: { id: number; name: string; email: string; mobile: string | null };
  order?:    { id: number; total: number; status: string } | null;
  messages?: SupportMessage[];
}

export interface SupportStats { total: number; open: number; in_progress: number; resolved: number; }

export const supportApi = {
  getStats:     () => api.get<SupportStats>('/api/admin/support/stats').then(r => r.data),
  getAll:       (params?: { status?: string; category?: string; search?: string; page?: number }) =>
    api.get<{ tickets: SupportTicket[]; total: number; page: number; pages: number }>(
      '/api/admin/support', { params }
    ).then(r => r.data),
  getById:      (id: number) => api.get<{ ticket: SupportTicket }>(`/api/admin/support/${id}`).then(r => r.data.ticket),
  updateStatus: (id: number, status: string) =>
    api.patch<{ ticket: SupportTicket }>(`/api/admin/support/${id}/status`, { status }).then(r => r.data.ticket),
  reply:        (id: number, message: string) =>
    api.post<{ message: SupportMessage }>(`/api/admin/support/${id}/reply`, { message }).then(r => r.data.message),
};
