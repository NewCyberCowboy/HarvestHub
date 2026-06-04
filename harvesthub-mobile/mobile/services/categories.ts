import { apiRequest } from '@/lib/api';
import type { CategoryDto } from '@/types/backend';

export const categoriesService = {
  getAll: (token?: string) => apiRequest<CategoryDto[]>('/Categories', { token }),
};
