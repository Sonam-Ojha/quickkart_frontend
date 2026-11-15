import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PartnerStaff { id: number; name: string; mobile?: string }
export interface PartnerRestaurantRef { id: number; name: string; imageUrl: string | null }

interface PartnerAuthState {
  token: string | null;
  staff: PartnerStaff | null;
  restaurant: PartnerRestaurantRef | null;
  login: (token: string, staff: PartnerStaff, restaurant: PartnerRestaurantRef) => void;
  logout: () => void;
}

// Kept apart from the admin session (qk-admin-auth) so a partner login and an
// admin login in the same browser never overwrite each other.
export const usePartnerStore = create<PartnerAuthState>()(
  persist(
    (set) => ({
      token: null,
      staff: null,
      restaurant: null,
      login: (token, staff, restaurant) => set({ token, staff, restaurant }),
      logout: () => set({ token: null, staff: null, restaurant: null }),
    }),
    { name: 'qk-partner-auth' },
  ),
);
