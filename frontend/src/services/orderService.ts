import { api } from './apiClient';
import type { Meta } from '../types/product';
import type { AddressInput, Address, User } from '../types/user';
import type { Message, WishItem } from '../types/account';
import type { CheckoutResult, Order, PaymentMethod, Provider } from '../types/order';

export const orderService = {
  paymentMethods: () =>
    api.get<{ data: PaymentMethod[]; shipping_fee: number }>('/orders/payment-methods').then((r) => r.data),
  checkout: (items: { product_id: number; quantity: number }[], address_id: number) =>
    api.post<CheckoutResult>('/orders/checkout', { items, address_id }).then((r) => r.data),
  submitPayment: (orderId: number, b: { payment_method: Provider; transaction_reference?: string; screenshot: File }) => {
    const fd = new FormData();
    fd.append('payment_method', b.payment_method);
    if (b.transaction_reference) fd.append('transaction_reference', b.transaction_reference);
    fd.append('screenshot', b.screenshot);
    return api.post(`/orders/${orderId}/submitpayment`, fd).then((r) => r.data);
  },
  myOrders: (page = 1) =>
    api.get<{ data: Order[]; meta: Meta; hold_hours: number }>('/orders/my-orders', { params: { page } }).then((r) => r.data),
};

export const accountService = {
  profile: () => api.get<{ user: User; addresses: Address[] }>('/account/profile').then((r) => r.data),
  saveAddress: (a: AddressInput) => api.post<{ id: number }>('/account/addresses', a).then((r) => r.data),

  wishlist: () => api.get<{ data: WishItem[] }>('/account/wishlist').then((r) => r.data.data),
  addWish: (productId: number) => api.post(`/account/wishlist/${productId}`).then((r) => r.data),
  removeWish: (productId: number) => api.delete(`/account/wishlist/${productId}`).then((r) => r.data),

  inbox: () => api.get<{ data: Message[]; unread: number }>('/account/inbox').then((r) => r.data),
  markRead: (id: number) => api.patch(`/account/inbox/${id}/read`).then((r) => r.data),
  sendMessage: (subject: string, body: string) => api.post('/account/inbox', { subject, body }).then((r) => r.data),
};
