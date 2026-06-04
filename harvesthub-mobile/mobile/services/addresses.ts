import { apiRequest } from '@/lib/api';
import type { AddressDto, CreateAddressDto, UpdateAddressDto } from '@/types/backend';

export const addressesService = {
  getAll: (token: string) => apiRequest<AddressDto[]>('/Addresses', { token }),
  getDefault: (token: string) => apiRequest<AddressDto>('/Addresses/default', { token }),
  create: (payload: CreateAddressDto, token: string) =>
    apiRequest<AddressDto>('/Addresses', { method: 'POST', body: payload, token }),
  update: (id: number, payload: UpdateAddressDto, token: string) =>
    apiRequest<AddressDto>(`/Addresses/${id}`, { method: 'PUT', body: payload, token }),
  setDefault: (id: number, token: string) =>
    apiRequest<void>(`/Addresses/${id}/set-default`, { method: 'PATCH', token }),
  remove: (id: number, token: string) =>
    apiRequest<void>(`/Addresses/${id}`, { method: 'DELETE', token }),
};
