import AsyncStorage from '@react-native-async-storage/async-storage';

import { productDraftsService, type CreateProductDraftDto } from '@/services/productDrafts';
import type { CreateProductDto } from '@/types/backend';

export type OfflineProductStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface OfflineProductDraft {
  localId: string;
  ownerUserId: number;
  payload: CreateProductDto;
  status: OfflineProductStatus;
  createdAt: string;
  updatedAt: string;
  syncedProductId?: number;
  lastError?: string;
}

const STORAGE_KEY = 'harvesthub-mobile-offline-products';

const readAllDrafts = async (): Promise<OfflineProductDraft[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as OfflineProductDraft[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return [];
  }
};

const writeAllDrafts = (drafts: OfflineProductDraft[]) =>
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));

export const offlineProductsService = {
  getForUser: async (ownerUserId: number) => {
    const drafts = await readAllDrafts();
    return drafts.filter((draft) => draft.ownerUserId === ownerUserId);
  },

  add: async (ownerUserId: number, payload: CreateProductDto) => {
    const drafts = await readAllDrafts();
    const now = new Date().toISOString();
    const draft: OfflineProductDraft = {
      localId: `${ownerUserId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ownerUserId,
      payload,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    await writeAllDrafts([draft, ...drafts]);
    return draft;
  },

  update: async (localId: string, payload: CreateProductDto) => {
    const drafts = await readAllDrafts();
    const now = new Date().toISOString();
    const updatedDrafts = drafts.map((draft) =>
      draft.localId === localId
        ? { ...draft, payload, status: 'pending' as OfflineProductStatus, updatedAt: now, lastError: undefined }
        : draft
    );
    await writeAllDrafts(updatedDrafts);
  },

  remove: async (localId: string) => {
    const drafts = await readAllDrafts();
    await writeAllDrafts(drafts.filter((draft) => draft.localId !== localId));
  },

  syncForUser: async (ownerUserId: number, token: string) => {
    const drafts = await readAllDrafts();
    const userDrafts = drafts.filter(
      (draft) => draft.ownerUserId === ownerUserId && draft.status !== 'synced'
    );

    const syncedIds: string[] = [];
    const failedIds: string[] = [];
    let nextDrafts = drafts;

    for (const draft of userDrafts) {
      nextDrafts = nextDrafts.map((item) =>
        item.localId === draft.localId ? { ...item, status: 'syncing' } : item
      );
      await writeAllDrafts(nextDrafts);

      try {
        // Map CreateProductDto to CreateProductDraftDto
        const draftPayload: CreateProductDraftDto = {
          deviceId: 'mobile',
          localDraftId: draft.localId,
          name: draft.payload.name,
          description: draft.payload.description,
          basePrice: draft.payload.basePrice,
          currentStock: draft.payload.currentStock,
          unit: draft.payload.unit || 'кг',
          categoryId: draft.payload.categoryId,
          storageConditions: draft.payload.storageConditions,
          allowCustomWeight: draft.payload.allowCustomWeight ?? true,
          imageUrl: draft.payload.imageUrl,
        };
        const created = await productDraftsService.create(draftPayload, token);
        syncedIds.push(draft.localId);
        nextDrafts = nextDrafts.map((item) =>
          item.localId === draft.localId
            ? {
              ...item,
              status: 'synced',
              syncedProductId: created.draftId,
              updatedAt: new Date().toISOString(),
              lastError: undefined,
            }
            : item
        );
      } catch (err) {
        failedIds.push(draft.localId);
        nextDrafts = nextDrafts.map((item) =>
          item.localId === draft.localId
            ? {
              ...item,
              status: 'failed',
              updatedAt: new Date().toISOString(),
              lastError: err instanceof Error ? err.message : 'Не удалось синхронизировать продукт',
            }
            : item
        );
      }

      await writeAllDrafts(nextDrafts);
    }

    return { syncedIds, failedIds };
  },
};
