import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

const DEFAULT_API = import.meta.env.DEV ? 'http://localhost:4000' : 'https://api.jhatpats.com'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // 15s — agar backend respond na kare toh error dikhao
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      // ProtectedRoute detects token=null and redirects to /login with the
      // current path in state, so the user returns here after re-login.
    }
    return Promise.reject(err);
  }
);

export default api;
