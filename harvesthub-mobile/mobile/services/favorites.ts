import { apiRequest } from '@/lib/api';
import type { FavoriteDto } from '@/types/backend';

export const favoritesService = {
  getAll: (token: string) => apiRequest<FavoriteDto[]>('/Favorites', { token }),
  add: (productId: number, token: string) =>
    apiRequest<FavoriteDto>('/Favorites', { method: 'POST', body: { productId }, token }),
  remove: (productId: number, token: string) =>
    apiRequest<boolean>(`/Favorites/${productId}`, { method: 'DELETE', token }),
  check: (productId: number, token: string) =>
    apiRequest<boolean>(`/Favorites/check/${productId}`, { token }),
};
