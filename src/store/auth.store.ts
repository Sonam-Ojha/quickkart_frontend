import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AdminUser {
  id: number | string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  login: (user: AdminUser, token: string) => void;
  logout: () => void;
  updateUser: (data: Partial<AdminUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      updateUser: (data) => set(state => ({ user: state.user ? { ...state.user, ...data } : null })),
    }),
    { name: 'qk-admin-auth' }
  )
);
