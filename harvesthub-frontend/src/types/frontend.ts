// ИСПРАВЛЕННЫЙ frontend.ts
import {
    ProductDto,
    OrderDto,
    CategoryDto,
    ReviewDto,
    OrderItemDto, // ДОБАВЛЯЕМ
    OrderStatusHistoryDto // ДОБАВЛЯЕМ
} from './backend';

// ===================== ОБРАБОТАННЫЕ ТИПЫ =====================

// Продукт для фронтенда (расширенный)
export interface Product extends Omit<ProductDto, 'productId' | 'categoryId'> {
    id: string; // конвертируем number в string для фронтенда
    categoryId: string; // конвертируем number в string
    images: string[]; // фронтенд ожидает массив изображений
    discountPrice?: number;
    rating: number;
    reviewCount: number;
    unit: 'kg' | 'g' | 'piece' | 'liter';
    isOrganic: boolean;
    isVegetarian?: boolean;
    isGlutenFree?: boolean;
    isLactoseFree?: boolean;
    tags: string[];
    farmerId?: string;
    isAvailable: boolean; // расчитываем из status
}

// Заказ для фронтенда
export interface Order extends Omit<OrderDto, 'orderId' | 'items' | 'statusHistory'> {
    id: string;
    items: OrderItem[];
    statusHistory: OrderStatusHistory[];
    deliveryTime?: string;
    paymentMethod: 'card' | 'cash' | 'online';
    paymentStatus: 'pending' | 'paid' | 'failed';
    userId?: string;
}

// ИСПРАВЛЯЕМ: OrderItem теперь расширяет OrderItemDto
export interface OrderItem extends OrderItemDto {
    id: string;
    product?: Product;
    price: number; // цена на момент заказа
}

// ИСПРАВЛЯЕМ: OrderStatusHistory теперь расширяет OrderStatusHistoryDto
export interface OrderStatusHistory extends OrderStatusHistoryDto {
    id: string;
}

// Категория для фронтенда
export interface Category extends Omit<CategoryDto, 'categoryId' | 'parentId'> {
    id: string;
    parentId?: string;
    imageUrl?: string;
}

// Отзыв для фронтенда
export interface Review extends Omit<ReviewDto, 'reviewId' | 'productId' | 'customerId' | 'orderId'> {
    id: string;
    productId: string;
    customerId: string;
    orderId: string;
    user?: {
        id: string;
        name: string;
        avatar?: string;
    };
}

// ===================== ФОРМЫ =====================
export interface LoginFormData {
    email: string;
    password: string;
}

export interface RegisterFormData {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;       
    lastName: string;      
    phoneNumber: string;   
    address?: string;
}

export interface AddressFormData {
    street: string;
    city: string;
    postalCode: string;
    apartment?: string;
    floor?: string;
    entrance?: string;
    intercom?: string;
}

// ===================== КОРЗИНА =====================
export interface CartItem {
    id: string; // productId как string
    productId: string;
    product?: Product;
    quantity: number;
    price: number;
    name: string;
    image?: string;
}

export interface CartState {
    items: CartItem[];
    total: number;
    itemCount: number;
}

// ===================== КОМПОНЕНТЫ =====================
export interface ProductCardProps {
    product: Product;
    className?: string;
    showAddToCart?: boolean;
}

export interface ProductGalleryProps {
    images: string[];
    productName?: string;
    className?: string;
}

export interface ProductRatingProps {
    rating: number;
    reviewCount?: number;
    size?: 'sm' | 'md' | 'lg';
}

export interface FarmerInfoProps {
    name: string;
    location?: string;
    description?: string;
    rating?: number;
    reviewCount?: number;
}

// ===================== ПОЛЬЗОВАТЕЛЬ =====================
export interface User {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    avatar?: string;
    addresses?: Address[];
}

export interface Address {
    id: string;
    userId: string;
    street: string;
    city: string;
    postalCode: string;
    apartment?: string;
    floor?: string;
    entrance?: string;
    intercom?: string;
    isDefault: boolean;
}