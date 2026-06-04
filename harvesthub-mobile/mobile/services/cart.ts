import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProductDto } from '@/types/backend';

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  unit?: string;
  imageUrl?: string;
  expectedWeight?: number;
  allowCustomWeight?: boolean;
}

export interface Cart {
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
}

const STORAGE_KEY = 'harvesthub-mobile-cart';

const readCart = async (): Promise<CartItem[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeCart = (items: CartItem[]) =>
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));

const calculateTotals = (items: CartItem[]): Cart => {
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  return { items, totalAmount, totalItems };
};

export const cartService = {
  // Get full cart with totals
  getCart: async (): Promise<Cart> => {
    const items = await readCart();
    return calculateTotals(items);
  },

  // Add item to cart
  addItem: async (product: ProductDto, quantity: number = 1, expectedWeight?: number): Promise<Cart> => {
    const items = await readCart();
    const existingIndex = items.findIndex((item) => item.productId === product.productId);

    if (existingIndex >= 0) {
      // Update existing item
      items[existingIndex].quantity += quantity;
      if (expectedWeight !== undefined) {
        items[existingIndex].expectedWeight = expectedWeight;
      }
    } else {
      // Add new item
      items.push({
        productId: product.productId,
        name: product.name,
        price: product.basePrice,
        quantity,
        unit: product.unit,
        imageUrl: product.imageUrl,
        expectedWeight,
        allowCustomWeight: product.allowCustomWeight,
      });
    }

    await writeCart(items);
    return calculateTotals(items);
  },

  // Update item quantity
  updateQuantity: async (productId: number, quantity: number): Promise<Cart> => {
    const items = await readCart();
    const index = items.findIndex((item) => item.productId === productId);

    if (index >= 0) {
      if (quantity <= 0) {
        items.splice(index, 1);
      } else {
        items[index].quantity = quantity;
      }
      await writeCart(items);
    }

    return calculateTotals(items);
  },

  // Update item weight
  updateWeight: async (productId: number, expectedWeight: number): Promise<Cart> => {
    const items = await readCart();
    const index = items.findIndex((item) => item.productId === productId);

    if (index >= 0) {
      items[index].expectedWeight = expectedWeight;
      await writeCart(items);
    }

    return calculateTotals(items);
  },

  // Remove item from cart
  removeItem: async (productId: number): Promise<Cart> => {
    const items = await readCart();
    const filtered = items.filter((item) => item.productId !== productId);
    await writeCart(filtered);
    return calculateTotals(filtered);
  },

  // Clear cart
  clearCart: async (): Promise<Cart> => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return { items: [], totalAmount: 0, totalItems: 0 };
  },

  // Check if product is in cart
  isInCart: async (productId: number): Promise<boolean> => {
    const items = await readCart();
    return items.some((item) => item.productId === productId);
  },

  // Get cart item count
  getItemCount: async (): Promise<number> => {
    const items = await readCart();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },
};
