import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ProductQRCode {
  id: string;
  productId: number;
  productName: string;
  qrData: string; // JSON string with product info
  createdAt: string;
}

const STORAGE_KEY = 'harvesthub-mobile-product-qr-codes';

export const generateQRData = (productId: number, productName: string): string => {
  const data = {
    type: 'harvesthub-product',
    productId,
    productName,
    timestamp: Date.now(),
  };
  return JSON.stringify(data);
};

export const parseQRData = (data: string): { productId: number; productName: string } | null => {
  try {
    const parsed = JSON.parse(data);
    if (parsed.type === 'harvesthub-product' && parsed.productId) {
      return { productId: parsed.productId, productName: parsed.productName };
    }
    return null;
  } catch {
    return null;
  }
};

const readQRCodes = async (): Promise<ProductQRCode[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as ProductQRCode[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeQRCodes = (codes: ProductQRCode[]) =>
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(codes));

export const qrCodeService = {
  getForProduct: async (productId: number): Promise<ProductQRCode | null> => {
    const codes = await readQRCodes();
    return codes.find((c) => c.productId === productId) || null;
  },

  generate: async (productId: number, productName: string): Promise<ProductQRCode> => {
    const codes = await readQRCodes();
    const existing = codes.find((c) => c.productId === productId);

    if (existing) {
      return existing;
    }

    const newCode: ProductQRCode = {
      id: `qr-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      productId,
      productName,
      qrData: generateQRData(productId, productName),
      createdAt: new Date().toISOString(),
    };

    await writeQRCodes([...codes, newCode]);
    return newCode;
  },

  getAll: async (): Promise<ProductQRCode[]> => {
    return readQRCodes();
  },

  remove: async (productId: number) => {
    const codes = await readQRCodes();
    await writeQRCodes(codes.filter((c) => c.productId !== productId));
  },

  clear: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
};
