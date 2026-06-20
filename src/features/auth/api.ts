import api from '../../lib/api';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export interface RegisterResponse {
  message: string;
  user: AuthUser;
}

export const authApi = {
  register: (data: RegisterPayload) =>
    api.post<RegisterResponse>('/api/admin/auth/register', data).then(r => r.data),

  login: (data: LoginPayload) =>
    api.post<LoginResponse>('/api/admin/auth/login', data).then(r => r.data),
};
