import { api } from './apiClient';
import type { Address } from '../types/user';
import type { OrderStatus } from '../types/order';
import type { AdminCustomer, AdminOrder, AdminProduct, AdminProductDetail, AdminStats, Category, Inquiry, Paged } from '../types/admin';

export const adminService = {
  stats: () => api.get<AdminStats>('/admin/stats').then((r) => r.data),
  categories: () => api.get<{ data: Category[] }>('/admin/categories').then((r) => r.data.data),

  products: (params: { q?: string; category?: string; page?: number }) =>
    api.get<Paged<AdminProduct>>('/admin/products', { params: { ...params, limit: 15 } }).then((r) => r.data),
  product: (id: number) => api.get<AdminProductDetail>(`/admin/products/${id}`).then((r) => r.data),
  saveProduct: (id: number | null, fd: FormData) =>
    (id ? api.patch(`/admin/products/${id}`, fd) : api.post('/admin/products', fd)).then((r) => r.data),
  archiveProduct: (id: number) => api.delete(`/admin/products/${id}`).then((r) => r.data),

  orders: (params: { status?: string; page?: number }) =>
    api.get<Paged<AdminOrder>>('/admin/orders', { params: { ...params, limit: 15 } }).then((r) => r.data),
  // Screenshots are private, so fetch with the admin token and show as a local blob
  screenshot: (paymentId: number) =>
    api.get<Blob>(`/admin/payments/${paymentId}/screenshot`, { responseType: 'blob' }).then((r) => URL.createObjectURL(r.data)),
  verify: (paymentId: number, action: 'approve' | 'reject', reason?: string) =>
    api.patch(`/admin/payments/${paymentId}/verify`, { action, reason }).then((r) => r.data),
  setStatus: (orderId: number, status: OrderStatus) =>
    api.patch(`/admin/orders/${orderId}/status`, { status }).then((r) => r.data),

  customers: (params: { q?: string; page?: number }) =>
    api.get<Paged<AdminCustomer>>('/admin/customers', { params: { ...params, limit: 15 } }).then((r) => r.data),
  customer: (id: number) =>
    api.get<AdminCustomer & { addresses: Address[] }>(`/admin/customers/${id}`).then((r) => r.data),
  inquiries: () => api.get<{ data: Inquiry[] }>('/admin/inquiries').then((r) => r.data.data),
  reply: (userId: number, subject: string, body: string) =>
    api.post(`/admin/inquiries/${userId}/reply`, { subject, body }).then((r) => r.data),
};
