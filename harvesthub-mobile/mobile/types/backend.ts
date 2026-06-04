export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

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
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
}

export interface AuthResponseDto {
  token: string;
  expires?: string;
  user: AuthUserDto;
}

export interface ProductDto {
  productId: number;
  name: string;
  description?: string;
  basePrice: number;
  currentStock: number;
  unit?: string;
  weightOptions?: number[];
  allowCustomWeight?: boolean;
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
  unit?: string;
  weightOptions?: number[];
  allowCustomWeight?: boolean;
  harvestDate?: string;
  expiryDate?: string;
  storageConditions?: string;
  categoryId: number;
  imageUrl?: string;
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

export interface OrderItemDto {
  productId: number;
  quantity: number;
  productName?: string;
  expectedWeight?: number;
  actualWeight?: number;
  price?: number;
}

export interface CreateOrderDto {
  deliveryAddress: string;
  customerNotes?: string;
  items: Array<{
    productId: number;
    quantity: number;
    expectedWeight?: number;
    price?: number;
  }>;
}

export interface OrderStatusHistoryDto {
  status: string;
  changedAt: string;
  notes?: string;
  changedBy?: string;
}

export interface OrderDto {
  orderId: number;
  orderNumber: string;
  totalAmount: number;
  productsAmount: number;
  deliveryAmount: number;
  status: string;
  deliveryAddress: string;
  customerNotes?: string;
  createdAt: string;
  updatedAt?: string;
  items: OrderItemDto[];
  statusHistory: OrderStatusHistoryDto[];
}

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

export interface CategoryDto {
  categoryId: number;
  name: string;
  description?: string;
  parentId?: number;
  parentName?: string;
  children: CategoryDto[];
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

export interface ReviewDto {
  reviewId: number;
  productId: number;
  productName?: string;
  customerId: number;
  customerName?: string;
  orderId: number;
  rating: number;
  comment?: string;
  isApproved: boolean;
  createdAt: string;
}

export interface CreateReviewDto {
  productId: number;
  orderId: number;
  rating: number;
  comment?: string;
}

export interface ProductReviewsSummaryDto {
  averageRating: number;
  totalReviews: number;
  reviews: ReviewDto[];
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

export interface UpdateOrderStatusDto {
  status: string;
  notes?: string;
}
