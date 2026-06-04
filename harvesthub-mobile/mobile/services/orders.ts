import { apiRequest } from '@/lib/api';
import type { CreateOrderDto, FarmerAnalyticsDto, OrderDto, UpdateOrderStatusDto } from '@/types/backend';

interface UpdateOrderWeightsDto {
  productId: number;
  actualWeight: number;
}

export const ordersService = {
  getMyOrders: (token: string) => apiRequest<OrderDto[]>('/Orders/my-orders', { token }),
  create: (payload: CreateOrderDto, token: string) =>
    apiRequest<OrderDto>('/Orders', { method: 'POST', body: payload, token }),
  getFarmerOrders: (token: string) => apiRequest<OrderDto[]>('/Orders/farmer/orders', { token }),
  getFarmerAnalytics: (token: string, days = 30) =>
    apiRequest<FarmerAnalyticsDto>(`/Orders/farmer/analytics?days=${days}`, { token }),
  updateStatus: (id: number, payload: UpdateOrderStatusDto, token: string) =>
    apiRequest<OrderDto>(`/Orders/${id}/status`, { method: 'PUT', body: payload, token }),
  updateOrderWeights: (orderId: number, weights: UpdateOrderWeightsDto[], token: string) =>
    apiRequest<OrderDto>(`/Orders/${orderId}/weights`, { method: 'PUT', body: weights, token }),
};
