// ===================== АУТЕНТИФИКАЦИЯ =====================
export interface RegisterDto {
    email: string;
    password: string;
    role?: string;
    firstName: string;      
    lastName: string;       
    phone: string;           
    address?: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface AuthUserDto {
    userId: number;
    email: string;
    role: string;
    fullName?: string;
    firstName?: string;  
    lastName?: string;   
    phone?: string;      
    address?: string;    
}

export interface AuthResponseDto {
    token: string;
    user: AuthUserDto;
}

// ===================== ПРОДУКТЫ =====================
export interface ProductDto {
    productId: number;
    name: string;
    description?: string;
    basePrice: number;
    currentStock: number;
    unit?: string; // Единица измерения (по умолчанию "кг")
    weightOptions?: number[]; // Варианты веса: [0.5, 1, 1.5, 2, ... 20]
    allowCustomWeight?: boolean; // Разрешить произвольный вес
    status: string;
    harvestDate?: string;
    expiryDate?: string;
    storageConditions?: string;
    createdAt: string;
    categoryId: number;
    categoryName: string;
    farmerId: number;
    farmerName: string;
    farmerAddress?: string;
    imageUrl?: string;
}

export interface CreateProductDto {
    name: string;
    description?: string;
    basePrice: number;
    currentStock: number;
    unit?: string; // Единица измерения (по умолчанию "кг")
    weightOptions?: number[]; // Варианты веса: [0.5, 1, 1.5, 2, ... 20]
    allowCustomWeight?: boolean; // Разрешить произвольный вес
   /* status?: string;*/
    harvestDate?: string;
    expiryDate?: string;
    storageConditions?: string;
    categoryId: number;
    imageUrl?: string;
}

// ===================== ЗАКАЗЫ =====================
export interface OrderItemDto {
    productId: number;
    quantity: number; // Для обратной совместимости
    productName?: string; 
    expectedWeight?: number; // Ожидаемый вес в кг (от клиента)
    actualWeight?: number; // Реальный вес в кг (от фермера)
    price?: number; // Цена за кг
}

export interface CreateOrderDto {
    deliveryAddress: string;
    customerNotes?: string;
    items: Array<{
        productId: number;
        quantity: number; // Для обратной совместимости
        expectedWeight?: number; // Ожидаемый вес в кг
        price?: number; // Цена за кг
        productName?: string; 
    }>;
}
export interface OrderDto {
    orderId: number;
    orderNumber: string;
    totalAmount: number; // Итоговая сумма
    productsAmount: number; // Сумма товаров
    deliveryAmount: number; // Сумма доставки
    status: string;
    deliveryAddress: string;
    customerCity?: string; // Город клиента
    farmerCity?: string; // Город фермера
    customerNotes?: string;
    createdAt: string;
    updatedAt?: string;
    items: OrderItemDto[];
    statusHistory: OrderStatusHistoryDto[];
}

export interface OrderStatusHistoryDto {
    status: string;
    changedAt: string;
    notes?: string;
    changedBy?: string;
}

export interface FarmerAnalyticsDto {
    periodDays: number;
    fromDate: string;
    toDate: string;
    revenueTotal: number;
    ordersCount: number;
    averageOrderValue: number;
    itemsSoldTotal: number;
    averageItemsPerOrder: number;
    uniqueCustomers: number;
    newCustomers: number;
    repeatCustomers: number;
    completedOrders: number;
    cancelledOrders: number;
    revenueByDay: Array<{
        date: string;
        revenue: number;
        orders: number;
    }>;
    statusBreakdown: Array<{
        status: string;
        count: number;
    }>;
    topProducts: Array<{
        productId: number;
        productName: string;
        revenue: number;
        quantity: number;
    }>;
    categoryBreakdown: Array<{
        categoryName: string;
        revenue: number;
        quantity: number;
    }>;
}

// ===================== КАТЕГОРИИ =====================
export interface CategoryDto {
    categoryId: number;
    name: string;
    description?: string;
    parentId?: number;
    parentName?: string;
    children: CategoryDto[];
}
export interface CreateCategoryDto {
    name: string;
    description?: string;
    parentId?: number;
}

export interface UpdateCategoryDto {
    name?: string;
    description?: string;
    parentId?: number;
}

// ===================== ОТЗЫВЫ =====================
export interface ReviewDto {
    reviewId: number;
    productId: number;
    customerId: number;
    orderId: number;
    rating: number;
    comment?: string;
    isApproved: boolean;
    createdAt: string;
    customerName?: string;
}

// ===================== API ОТВЕТЫ =====================
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

// ===================== ENUMS =====================
export enum UserRole {
    Customer = 'Customer',
    Farmer = 'Farmer',
    Admin = 'Admin'
}

export enum OrderStatus {
    Pending = 'Pending',
    AwaitingWeight = 'AwaitingWeight', // Ожидает указания реального веса фермером
    ReadyToShip = 'ReadyToShip', // Готов к отправке (вес указан)
    Confirmed = 'Confirmed',
    Processing = 'Processing',
    Shipped = 'Shipped',
    Delivered = 'Delivered',
    Cancelled = 'Cancelled'
}

export enum ProductStatus {
    Available = 'Available',
    OutOfStock = 'OutOfStock',
    ComingSoon = 'ComingSoon',
    Discontinued = 'Discontinued'
}

export interface UpdateOrderStatusDto {
    status: string;
    notes?: string;
}

// DTO для указания реального веса фермером
export interface UpdateOrderWeightsDto {
    items: Array<{
        orderItemId: number;
        actualWeight: number; // Реальный вес в кг
    }>;
}

export interface UpdateProductDto {
    name?: string;
    description?: string;
    basePrice?: number;
    currentStock?: number;
    unit?: string;
    weightOptions?: number[];
    allowCustomWeight?: boolean;
    status?: string;
    harvestDate?: string;
    expiryDate?: string;
    storageConditions?: string;
    categoryId?: number;
    imageUrl?: string;
}

export interface UpdateCategoryDto {
    name?: string;
    description?: string;
    parentId?: number;
}

export interface CreateReviewDto {
    productId: number;
    orderId: number;
    rating: number;
    comment?: string;
}

export interface UpdateReviewDto {
    rating?: number;
    comment?: string;
}

// Утилитарные типы для фронтенда
export type FrontendId = string;
export type BackendId = number;

// Добавить в конец файла:

export interface UpdateOrderStatusDto {
    status: string;
    notes?: string;
}

// DTO для указания реального веса фермером
export interface UpdateOrderWeightsDto {
    items: Array<{
        orderItemId: number;
        actualWeight: number; // Реальный вес в кг
    }>;
}

export interface UpdateCategoryDto {
    name?: string;
    description?: string;
    parentId?: number;
}

export interface CreateReviewDto {
    productId: number;
    orderId: number;
    rating: number;
    comment?: string;
}

export interface UpdateReviewDto {
    rating?: number;
    comment?: string;
}

// ===================== АДРЕСА =====================
export interface AddressDto {
    addressId: number;
    street: string;
    apartment: string;
    city: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface CreateAddressDto {
    street: string;
    apartment: string;
    city: string;
    postalCode: string;
    country?: string;
    isDefault?: boolean;
}

export interface UpdateAddressDto {
    street?: string;
    apartment?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    isDefault?: boolean;
}
export interface CreateCategoryDto {
    name: string;
    description?: string;
    parentId?: number;
}

export interface UpdateCategoryDto {
    name?: string;
    description?: string;
    parentId?: number;
}
// ===================== КАТЕГОРИИ =====================
export interface CreateCategoryDto {
    name: string;
    description?: string;
    parentId?: number;
}

export interface UpdateCategoryDto {
    name?: string;
    description?: string;
    parentId?: number;
}

// Если еще нет CategoryDto, добавьте:
export interface CategoryDto {
    categoryId: number;
    name: string;
    description?: string;
    parentId?: number;
    parentName?: string;
    children: CategoryDto[];
}


export interface ProductReviewsSummaryDto {
    averageRating: number;
    totalReviews: number;
    reviews: ReviewDto[];
}

// ===================== ИЗБРАННОЕ =====================
export interface FavoriteDto {
    favoriteId: number;
    userId: number;
    productId: number;
    productName: string;
    productPrice: number;
    productImageUrl?: string;
    productDescription?: string;
    productStatus: string;
    productStock: number;
    createdAt: string;
}

export interface AddFavoriteDto {
    productId: number;
}


// ===================== ПОЛЬЗОВАТЕЛИ =====================
export interface UserDto {
    userId: number;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    productCount: number;
    orderCount: number;
}

export interface UpdateUserRoleDto {
    role: string; // 'Customer' | 'Farmer' | 'Admin'
}

export interface UpdateUserStatusDto {
    isActive: boolean;
}

export interface UserStatsDto {
    totalUsers: number;
    activeUsers: number;
    farmersCount: number;
    customersCount: number;
    adminsCount: number;
    newUsersLastWeek: number;
}