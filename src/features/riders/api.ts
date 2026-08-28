import api from '../../lib/api';

export type RiderStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';
export type VehicleType = 'bike' | 'scooter' | 'ebike' | 'bicycle' | 'cycle' | 'other';
export type DocStatus = 'not_uploaded' | 'uploaded' | 'verified' | 'rejected';

/** The four documents that gate activation. rc / photo are optional extras. */
export const REQUIRED_DOCS = ['aadhaar', 'pan', 'license', 'bank_proof'] as const;

export const DOC_LABEL: Record<string, string> = {
  aadhaar: 'Aadhaar Card',
  pan: 'PAN Card',
  license: 'Driving License',
  bank_proof: 'Bank Proof',
  rc: 'Vehicle RC',
  photo: 'Photo',
};

export interface RiderDocument {
  id: number;
  riderId: number;
  docType: string;
  fileUrl: string;
  status: 'uploaded' | 'verified' | 'rejected';
  rejectionReason: string | null;
  reviewedAt: string | null;
}

export interface Rider {
  id: number;
  name: string;
  mobile: string;
  storeId: number;
  store?: { id: number; name: string; city: string };
  vehicleType: VehicleType;
  vehicleNumber: string | null;
  isOnline: boolean;
  rating: number;
  totalDeliveries: number;
  totalEarnings: number;
  status: RiderStatus;
  kycAadhaarStatus?: DocStatus;
  kycPanStatus?: DocStatus;
  kycLicenseStatus?: DocStatus;
  kycBankStatus?: DocStatus;
}

export interface RiderPayload {
  name: string;
  mobile: string;
  storeId: number;
  vehicleType?: VehicleType;
  vehicleNumber?: string;
  password?: string;
  rating?: number;
  status?: RiderStatus;
}

export const riderApi = {
  getAll: (params?: { storeId?: number; status?: string; search?: string }) =>
    api.get<{ riders: Rider[] }>('/api/admin/riders', { params }).then(r => r.data.riders),

  create: (data: RiderPayload) =>
    api.post<{ rider: Rider }>('/api/admin/riders', data).then(r => r.data.rider),

  update: (id: number, data: Partial<RiderPayload>) =>
    api.put<{ rider: Rider }>(`/api/admin/riders/${id}`, data).then(r => r.data.rider),

  toggle: (id: number) =>
    api.patch<{ rider: Rider }>(`/api/admin/riders/${id}/toggle`).then(r => r.data.rider),

  remove: (id: number) =>
    api.delete(`/api/admin/riders/${id}`).then(r => r.data),

  setPassword: (id: number, password: string) =>
    api.patch(`/api/admin/riders/${id}/set-password`, { password }).then(r => r.data),

  // ── KYC review ──────────────────────────────────────────
  documents: (id: number) =>
    api.get<{ documents: RiderDocument[] }>(`/api/admin/riders/${id}/documents`)
      .then(r => r.data.documents),

  /** Verifying the last required document flips the rider to active — the
   *  response says so via `activated`. */
  reviewDocument: (
    riderId: number,
    docId: number,
    body: { status: 'verified' } | { status: 'rejected'; rejectionReason: string },
  ) =>
    api.patch<{ document: RiderDocument; riderStatus: RiderStatus; activated: boolean }>(
      `/api/admin/riders/${riderId}/documents/${docId}`, body,
    ).then(r => r.data),
};
