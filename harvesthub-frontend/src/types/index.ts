export * from './user'
export * from './auth'
export * from './product'
export * from './cart'
export * from './order'
export * from './category'
// User types
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: 'admin' | 'customer' | 'farmer';
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
}

// Product types
export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    discountPrice?: number;
    images: string[];
    categoryId: string;
    categoryName: string;
    farmerId: string;
    farmerName: string;
    stock: number;
    unit: 'kg' | 'g' | 'piece' | 'liter';
    rating: number;
    reviewCount: number;
    isOrganic: boolean;
    tags: string[];
    createdAt: string;
}

// Category types
export interface Category {
    id: string;
    name: string;
    description?: string;
    parentId?: string;
    children?: Category[];
    productCount: number;
}

// Cart types
export interface CartItem {
    productId: string;
    productName: string;
    productImage: string;
    quantity: number;
    price: number;
    unit: string;
    maxQuantity: number;
}

// Order types
export interface Order {
    id: string;
    orderNumber: string;
    userId: string;
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    totalAmount: number;
    items: OrderItem[];
    shippingAddress: Address;
    createdAt: string;
}

export interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface Address {
    id: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
}

// API Response types
export interface ApiResponse<T> {
    data: T;
    success: boolean;
    message?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// Auth types
export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
}

