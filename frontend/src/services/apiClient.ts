import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const API_ORIGIN: string = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
export const api = axios.create({ baseURL: `${API_ORIGIN}/api/v1` });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401 && useAuthStore.getState().token) useAuthStore.getState().logout();
    return Promise.reject(e);
  }
);

export function errMsg(e: unknown): string {
  if (axios.isAxiosError(e))
    return e.response?.data?.message ?? 'We could not reach the server. Check your connection and try again.';
  return 'Something went wrong. Please try again.';
}
