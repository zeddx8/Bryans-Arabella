export interface User { id: number; name: string; email: string; phone_number: string | null; role: 'customer' | 'admin'; email_verified?: boolean }
export interface Address {
  id: number; recipient_name: string; phone: string; street_address: string;
  city: string; region_or_state: string; is_default: number | boolean;
}
export type AddressInput = Omit<Address, 'id' | 'is_default'> & { id?: number; is_default?: boolean };
