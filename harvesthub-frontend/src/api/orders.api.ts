import api from './axios'
import {
    OrderDto,
    CreateOrderDto,
    UpdateOrderStatusDto,
    UpdateOrderWeightsDto,
    ApiResponse,
    FarmerAnalyticsDto
} from '@/types/backend'

export const ordersApi = {
    // Получение заказов пользователя
    getUserOrders: async (): Promise<OrderDto[]> => {
        const response = await api.get<ApiResponse<OrderDto[]>>('/Orders/my-orders')
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch orders')
        }
        return response.data.data
    },

    // Получение заказа по ID
    getOrderById: async (id: number): Promise<OrderDto> => {
        const response = await api.get<ApiResponse<OrderDto>>(`/Orders/${id}`)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch order')
        }
        return response.data.data
    },

    // Создание заказа
    createOrder: async (orderData: CreateOrderDto): Promise<OrderDto> => {
        const response = await api.post<ApiResponse<OrderDto>>('/Orders', orderData)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to create order')
        }
        return response.data.data
    },

    // Обновление статуса заказа (для фермера/админа)
    updateOrderStatus: async (id: number, statusData: UpdateOrderStatusDto): Promise<OrderDto> => {
        try {
            // Очищаем данные перед отправкой
            const cleanedData: UpdateOrderStatusDto = {
                status: statusData.status.trim(),
                ...(statusData.notes && statusData.notes.trim() ? { notes: statusData.notes.trim() } : {})
            }

            console.log('Отправка данных для обновления статуса заказа:', JSON.stringify(cleanedData))

            const response = await api.put<ApiResponse<OrderDto>>(`/Orders/${id}/status`, cleanedData)
            if (!response.data.success) {
                throw new Error(response.data.message || 'Не удалось обновить статус заказа')
            }
            return response.data.data
        } catch (error: any) {
            console.error('Ошибка при обновлении статуса заказа:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message,
                stack: error.stack
            })

            // Извлекаем сообщение об ошибке из ответа сервера
            let errorMessage = error.message || 'Не удалось обновить статус заказа'

            if (error.response?.data) {
                // Если есть детальные ошибки валидации
                if (error.response.data.errors) {
                    const validationErrors = Object.entries(error.response.data.errors)
                        .map(([key, values]: [string, any]) => {
                            const messages = Array.isArray(values) ? values : [values]
                            return `${key}: ${messages.join(', ')}`
                        })
                        .join('; ')
                    errorMessage = validationErrors || error.response.data.message || errorMessage
                } else if (error.response.data.message) {
                    // Извлекаем сообщение из ответа, убирая префикс "Internal server error: " если есть
                    const message = error.response.data.message
                    errorMessage = message.startsWith('Internal server error: ')
                        ? message.substring('Internal server error: '.length)
                        : message
                }
            }

            // Если это 500 ошибка и нет детального сообщения, показываем общее
            if (error.response?.status === 500 && errorMessage === 'An unexpected error occurred') {
                errorMessage = 'Внутренняя ошибка сервера. Проверьте логи сервера для деталей.'
            }

            throw new Error(errorMessage)
        }
    },

    // Удаление заказа (для админа)
    deleteOrder: async (id: number): Promise<boolean> => {
        const response = await api.delete<ApiResponse<boolean>>(`/Orders/${id}`)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to delete order')
        }
        return response.data.data
    },

    // Получение заказов фермера (если пользователь - фермер)
    getFarmerOrders: async (): Promise<OrderDto[]> => {
        const response = await api.get<ApiResponse<OrderDto[]>>('/Orders/farmer/orders')
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch farmer orders')
        }
        return response.data.data
    },

    // Получение аналитики фермера
    getFarmerAnalytics: async (days = 30): Promise<FarmerAnalyticsDto> => {
        const response = await api.get<ApiResponse<FarmerAnalyticsDto>>(
            `/Orders/farmer/analytics?days=${days}`,
            { timeout: 10000 }
        )
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch farmer analytics')
        }
        return response.data.data
    },

    // Получение всех заказов (только для админа)
    getAllOrders: async (): Promise<OrderDto[]> => {
        const response = await api.get<ApiResponse<OrderDto[]>>('/Orders/all')
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch all orders')
        }
        return response.data.data
    },

    // Обновление реального веса заказа (для фермера)
    updateOrderWeights: async (id: number, weightsData: UpdateOrderWeightsDto): Promise<OrderDto> => {
        const response = await api.put<ApiResponse<OrderDto>>(`/Orders/${id}/weights`, weightsData)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Не удалось обновить вес заказа')
        }
        return response.data.data
    }
}