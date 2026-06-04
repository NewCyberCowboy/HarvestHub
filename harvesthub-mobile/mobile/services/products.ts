import { apiRequest } from '@/lib/api';
import type { CreateProductDto, ProductDto, UpdateProductDto } from '@/types/backend';

export const productsService = {
  getAll: () => apiRequest<ProductDto[]>('/Products'),
  getById: (id: number) => apiRequest<ProductDto>(`/Products/${id}`),
  search: (term: string) => apiRequest<ProductDto[]>(`/Products/search?term=${encodeURIComponent(term)}`),
  getMyProducts: (token: string) => apiRequest<ProductDto[]>('/Products/farmer/my-products', { token }),
  create: (payload: CreateProductDto, token: string) =>
    apiRequest<ProductDto>('/Products', { method: 'POST', body: payload, token }),
  update: (id: number, payload: UpdateProductDto, token: string) =>
    apiRequest<ProductDto>(`/Products/${id}`, { method: 'PUT', body: payload, token }),
  remove: (id: number, token: string) =>
    apiRequest<boolean>(`/Products/${id}`, { method: 'DELETE', token }),
};
