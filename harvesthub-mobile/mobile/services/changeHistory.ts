import AsyncStorage from '@react-native-async-storage/async-storage';

export type ChangeType = 'price' | 'stock' | 'both' | 'create' | 'delete';

export interface ProductChangeRecord {
  id: string;
  productId: number;
  productName: string;
  changeType: ChangeType;
  oldPrice?: number;
  newPrice?: number;
  oldStock?: number;
  newStock?: number;
  changedBy: number;
  changedByName: string;
  timestamp: string;
  synced: boolean;
}

const STORAGE_KEY = 'harvesthub-mobile-change-history';
const MAX_HISTORY_ITEMS = 100;

const readHistory = async (): Promise<ProductChangeRecord[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as ProductChangeRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeHistory = (history: ProductChangeRecord[]) =>
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS)));

export const changeHistoryService = {
  getForProduct: async (productId: number) => {
    const history = await readHistory();
    return history.filter((h) => h.productId === productId);
  },

  getForUser: async (userId: number, limit = 20) => {
    const history = await readHistory();
    return history
      .filter((h) => h.changedBy === userId)
      .slice(0, limit);
  },

  getAll: async (limit = 50) => {
    const history = await readHistory();
    return history.slice(0, limit);
  },

  add: async (record: Omit<ProductChangeRecord, 'id' | 'timestamp'>) => {
    const history = await readHistory();
    const newRecord: ProductChangeRecord = {
      ...record,
      id: `change-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date().toISOString(),
    };
    await writeHistory([newRecord, ...history]);
    return newRecord;
  },

  logPriceChange: async (
    productId: number,
    productName: string,
    oldPrice: number,
    newPrice: number,
    changedBy: number,
    changedByName: string
  ) => {
    return changeHistoryService.add({
      productId,
      productName,
      changeType: 'price',
      oldPrice,
      newPrice,
      changedBy,
      changedByName,
      synced: false,
    });
  },

  logStockChange: async (
    productId: number,
    productName: string,
    oldStock: number,
    newStock: number,
    changedBy: number,
    changedByName: string
  ) => {
    return changeHistoryService.add({
      productId,
      productName,
      changeType: 'stock',
      oldStock,
      newStock,
      changedBy,
      changedByName,
      synced: false,
    });
  },

  logBothChange: async (
    productId: number,
    productName: string,
    oldPrice: number,
    newPrice: number,
    oldStock: number,
    newStock: number,
    changedBy: number,
    changedByName: string
  ) => {
    return changeHistoryService.add({
      productId,
      productName,
      changeType: 'both',
      oldPrice,
      newPrice,
      oldStock,
      newStock,
      changedBy,
      changedByName,
      synced: false,
    });
  },

  clear: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
  },

  getStats: async (userId: number) => {
    const history = await readHistory();
    const userChanges = history.filter((h) => h.changedBy === userId);

    const today = new Date().toDateString();
    const todayChanges = userChanges.filter(
      (h) => new Date(h.timestamp).toDateString() === today
    );

    return {
      totalChanges: userChanges.length,
      todayChanges: todayChanges.length,
      priceChanges: userChanges.filter((h) => h.changeType === 'price' || h.changeType === 'both').length,
      stockChanges: userChanges.filter((h) => h.changeType === 'stock' || h.changeType === 'both').length,
    };
  },
};
