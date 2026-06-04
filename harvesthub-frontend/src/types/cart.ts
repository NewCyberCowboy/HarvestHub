import { ProductDto, OrderDto } from './backend';

export interface CartItem {
    productId: string;
    product?: ProductDto;
    quantity: number;
}

export interface CartStore {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
    deliveryCost: number;
    freeDeliveryThreshold: number;
    isCartOpen: boolean;

    addItem: (item: { productId: string; name: string; price: number; image: string; quantity: number }) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    toggleCart: () => void;
    getItem: (productId: string) => CartItem | undefined;
    calculateTotals: () => void;
    getDeliveryPrice: () => number;
    getTotalWithDelivery: () => number;
    createOrderFromCart: (deliveryAddress: string, customerNotes?: string) => Promise<OrderDto>;
}