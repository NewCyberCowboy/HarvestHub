import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import type { ProductDto } from '@/types/backend';

export interface CartItem {
  product: ProductDto;
  quantity: number;
  expectedWeight?: number;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (product: ProductDto, quantity?: number, expectedWeight?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const CART_STORAGE_KEY = 'harvesthub-mobile-cart';

function calculateTotal(items: CartItem[]) {
  return items.reduce((sum, item) => {
    const amount = item.expectedWeight || item.quantity;
    return sum + item.product.basePrice * amount;
  }, 0);
}

export function CartProvider({ children }: React.PropsWithChildren) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const restoreCart = async () => {
      try {
        const raw = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (!raw) {
          return;
        }

        setItems(JSON.parse(raw) as CartItem[]);
      } catch {
        await AsyncStorage.removeItem(CART_STORAGE_KEY);
      }
    };

    void restoreCart();
  }, []);

  useEffect(() => {
    void AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product: ProductDto, quantity = 1, expectedWeight?: number) => {
    setItems((current) => {
      const existing = current.find((item) => item.product.productId === product.productId);
      if (existing) {
        return current.map((item) =>
          item.product.productId === product.productId
            ? {
                ...item,
                quantity: item.quantity + quantity,
                expectedWeight: expectedWeight ?? item.expectedWeight,
              }
            : item
        );
      }

      return [...current, { product, quantity, expectedWeight }];
    });
  };

  const removeItem = (productId: number) => {
    setItems((current) => current.filter((item) => item.product.productId !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) {
      removeItem(productId);
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.product.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const value = useMemo(
    () => ({
      items,
      totalItems: items.length,
      totalPrice: calculateTotal(items),
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [items]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used inside CartProvider');
  }
  return context;
}
