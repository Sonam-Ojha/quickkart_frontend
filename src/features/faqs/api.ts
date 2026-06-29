import api from '../../lib/api';

export interface Faq {
  id: number;
  question: string;
  answer: string;
  page: string;
  sortOrder: number;
  isActive: boolean;
  created_at: string;
}

export interface FaqPayload {
  question: string;
  answer: string;
  page: string;
  sortOrder?: number;
  isActive?: boolean;
}

export const faqApi = {
  getAll: (page?: string) =>
    api.get<Faq[]>('/api/admin/faqs', { params: page ? { page } : {} }).then(r => r.data),

  create: (data: FaqPayload) =>
    api.post<Faq>('/api/admin/faqs', data).then(r => r.data),

  update: (id: number, data: Partial<FaqPayload>) =>
    api.put<Faq>(`/api/admin/faqs/${id}`, data).then(r => r.data),

  toggle: (id: number) =>
    api.patch<Faq>(`/api/admin/faqs/${id}/toggle`).then(r => r.data),

  remove: (id: number) =>
    api.delete(`/api/admin/faqs/${id}`).then(r => r.data),
};
