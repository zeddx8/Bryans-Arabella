import { api } from './apiClient';
import type { CatalogResponse, Meta, ProductDetail, Review } from '../types/product';

export interface CatalogQuery { q?: string; brand?: string; category?: string; sort?: string; page?: number; limit?: number }

export const productService = {
  list: (params: CatalogQuery) =>
    api.get<CatalogResponse>('/products', { params: Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) }).then((r) => r.data),
  get: (slug: string) => api.get<ProductDetail>(`/products/${slug}`).then((r) => r.data),
  reviews: (id: number) =>
    api.get<{ data: Review[]; meta: Meta & { average: number | null } }>(`/products/${id}/reviews`).then((r) => r.data),
  addReview: (id: number, b: { rating: number; title?: string; comment?: string }) =>
    api.post(`/products/${id}/reviews`, b).then((r) => r.data),
};
