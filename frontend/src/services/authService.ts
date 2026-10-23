import { api } from './apiClient';
import type { User } from '../types/user';

interface AuthResult { token: string; user: User }

export const authService = {
  register: (b: { name: string; email: string; password: string; phone_number?: string }) =>
    api.post<AuthResult>('/auth/register', b).then((r) => r.data),
  login: (b: { email: string; password: string }) => api.post<AuthResult>('/auth/login', b).then((r) => r.data),
  logout: () => api.post('/auth/logout').catch(() => undefined),
  me: () => api.get<{ user: User }>('/auth/me').then((r) => r.data.user),
  verifyEmail: (token: string) => api.post<{ message: string }>('/auth/verify-email', { token }).then((r) => r.data),
  resendVerification: () => api.post<{ message: string }>('/auth/resend-verification').then((r) => r.data),
  forgotPassword: (email: string) => api.post<{ message: string }>('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (token: string, password: string) => api.post<{ message: string }>('/auth/reset-password', { token, password }).then((r) => r.data),
};
