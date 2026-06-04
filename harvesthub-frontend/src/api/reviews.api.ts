import api from './axios'
import {
    ReviewDto,
    CreateReviewDto,
    UpdateReviewDto,
    ApiResponse,
    ProductReviewsSummaryDto
} from '@/types/backend'

export const reviewsApi = {
    // Получение отзывов по продукту
    getProductReviews: async (productId: number): Promise<ReviewDto[]> => {
        const response = await api.get<ApiResponse<ReviewDto[]>>(`/Reviews/product/${productId}`)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch reviews')
        }
        return response.data.data
    },

    // Создание отзыва
    createReview: async (reviewData: CreateReviewDto): Promise<ReviewDto> => {
        const response = await api.post<ApiResponse<ReviewDto>>('/Reviews', reviewData)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to create review')
        }
        return response.data.data
    },

    // Обновление отзыва
    updateReview: async (id: number, reviewData: UpdateReviewDto): Promise<ReviewDto> => {
        const response = await api.put<ApiResponse<ReviewDto>>(`/Reviews/${id}`, reviewData)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to update review')
        }
        return response.data.data
    },

    // Удаление отзыва (для админа/автора)
    deleteReview: async (id: number): Promise<boolean> => {
        const response = await api.delete<ApiResponse<boolean>>(`/Reviews/${id}`)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to delete review')
        }
        return response.data.data
    },

    // ===================== АДМИНСКИЕ МЕТОДЫ =====================

    // Получение отзывов на модерацию
    getPendingReviews: async (): Promise<ReviewDto[]> => {
        const response = await api.get<ApiResponse<ReviewDto[]>>('/Reviews/pending')
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch pending reviews')
        }
        return response.data.data
    },

    // Одобрение отзыва
    approveReview: async (id: number): Promise<boolean> => {
        const response = await api.post<ApiResponse<boolean>>(`/Reviews/${id}/approve`)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to approve review')
        }
        return response.data.data
    },

    // Отклонение отзыва
    rejectReview: async (id: number): Promise<boolean> => {
        const response = await api.post<ApiResponse<boolean>>(`/Reviews/${id}/reject`)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to reject review')
        }
        return response.data.data
    },

    // Получение отзывов пользователя
    getMyReviews: async (): Promise<ReviewDto[]> => {
        const response = await api.get<ApiResponse<ReviewDto[]>>('/Reviews/my-reviews')
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch my reviews')
        }
        return response.data.data
    },

    // Сводка отзывов по продукту
    getProductReviewsSummary: async (productId: number): Promise<ProductReviewsSummaryDto> => {
        const response = await api.get<ApiResponse<ProductReviewsSummaryDto>>(`/Reviews/product/${productId}/summary`)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch reviews summary')
        }
        return response.data.data
    }
}
