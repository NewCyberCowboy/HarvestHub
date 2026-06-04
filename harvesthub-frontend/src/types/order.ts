
export interface Order {
    id: string;
    orderNumber: string;
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    totalAmount: number;
    items: OrderItem[];
    shippingAddress: Address;
    createdAt: string;
    updatedAt?: string;
    customerId?: string;
    paymentStatus?: string;
    customerNotes?: string;
}

export interface OrderItem {
    id?: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    unit?: string;
    price?: number; 
}

export interface Address {
    id?: string;
    street: string;
    apartment?: string;
    city: string;
    postalCode: string;
    isDefault?: boolean;
    country?: string;
    state?: string;
}


export type { Order as OrderType };

export interface ContactFormData {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
}