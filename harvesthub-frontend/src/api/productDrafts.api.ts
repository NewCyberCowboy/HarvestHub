import api from './axios'

export interface ProductDraftDto {
    draftId: number
    ownerUserId: number
    name: string
    description?: string
    basePrice: number
    currentStock: number
    unit: string
    categoryId: number
    storageConditions?: string
    allowCustomWeight: boolean
    imageUrl?: string
    status: 'pending' | 'syncing' | 'synced' | 'error'
    lastError?: string
    createdAt: string
    updatedAt: string
}

export interface CreateProductDraftDto {
    name: string
    description?: string
    basePrice: number
    currentStock: number
    unit: string
    categoryId: number
    storageConditions?: string
    allowCustomWeight: boolean
}

export interface UpdateProductDraftDto {
    name?: string
    description?: string
    basePrice?: number
    currentStock?: number
    unit?: string
    categoryId?: number
    storageConditions?: string
    allowCustomWeight?: boolean
    imageUrl?: string
    status?: 'pending' | 'syncing' | 'synced' | 'error'
}

export interface SyncDraftsRequestDto {
    drafts: CreateProductDraftDto[]
}

export interface SyncDraftsResponseDto {
    syncedIds: number[]
    errors: string[]
}

export const productDraftsApi = {
    getMyDrafts: () => api.get<ProductDraftDto[]>('/ProductDrafts'),
    getDraft: (id: number) => api.get<ProductDraftDto>(`/ProductDrafts/${id}`),
    createDraft: (dto: CreateProductDraftDto) => api.post<ProductDraftDto>('/ProductDrafts', dto),
    updateDraft: (id: number, dto: UpdateProductDraftDto) => api.put<ProductDraftDto>(`/ProductDrafts/${id}`, dto),
    deleteDraft: (id: number) => api.delete(`/ProductDrafts/${id}`),
    syncDrafts: (request: SyncDraftsRequestDto) => api.post<SyncDraftsResponseDto>('/ProductDrafts/sync', request),
}
