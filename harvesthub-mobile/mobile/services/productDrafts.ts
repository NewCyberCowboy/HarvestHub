import { apiRequest } from '@/lib/api';

export interface CreateProductDraftDto {
  deviceId?: string;
  localDraftId?: string;
  name: string;
  description?: string;
  basePrice: number;
  currentStock: number;
  unit: string;
  categoryId: number;
  storageConditions?: string;
  allowCustomWeight: boolean;
  imageUrl?: string;
}

export interface ProductDraftDto {
  draftId: number;
  ownerUserId: number;
  name: string;
  description?: string;
  basePrice: number;
  currentStock: number;
  unit: string;
  categoryId: number;
  storageConditions?: string;
  allowCustomWeight: boolean;
  imageUrl?: string;
  status: 'pending' | 'syncing' | 'synced' | 'error';
  createdAt: string;
  updatedAt: string;
  lastError?: string;
}

export const productDraftsService = {
  create: async (draft: CreateProductDraftDto, token: string): Promise<ProductDraftDto> => {
    return apiRequest<ProductDraftDto>('/ProductDrafts', { method: 'POST', body: draft, token });
  },

  getMyDrafts: async (token: string): Promise<ProductDraftDto[]> => {
    return apiRequest<ProductDraftDto[]>('/ProductDrafts', { token });
  },

  getDraft: async (draftId: number, token: string): Promise<ProductDraftDto> => {
    return apiRequest<ProductDraftDto>(`/ProductDrafts/${draftId}`, { token });
  },

  updateDraft: async (draftId: number, draft: CreateProductDraftDto, token: string): Promise<ProductDraftDto> => {
    return apiRequest<ProductDraftDto>(`/ProductDrafts/${draftId}`, { method: 'PUT', body: draft, token });
  },

  deleteDraft: async (draftId: number, token: string): Promise<void> => {
    return apiRequest<void>(`/ProductDrafts/${draftId}`, { method: 'DELETE', token });
  },
};
