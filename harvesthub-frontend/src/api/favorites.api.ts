import api from './axios'
import { FavoriteDto, AddFavoriteDto, ApiResponse } from '@/types/backend'

export const favoritesApi = {
    // Получение всех избранных товаров пользователя
    getMyFavorites: async (): Promise<FavoriteDto[]> => {
        const response = await api.get<ApiResponse<FavoriteDto[]>>('/Favorites')
        if (!response.data.success) {
            throw new Error(response.data.message || 'Не удалось загрузить избранное')
        }
        return response.data.data
    },

    // Добавление товара в избранное
    addFavorite: async (productId: number): Promise<FavoriteDto> => {
        const response = await api.post<ApiResponse<FavoriteDto>>('/Favorites', { productId })
        if (!response.data.success) {
            throw new Error(response.data.message || 'Не удалось добавить в избранное')
        }
        return response.data.data
    },

    // Удаление товара из избранного
    removeFavorite: async (productId: number): Promise<boolean> => {
        const response = await api.delete<ApiResponse<boolean>>(`/Favorites/${productId}`)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Не удалось удалить из избранного')
        }
        return response.data.data
    },

    // Проверка, находится ли товар в избранном
    checkFavorite: async (productId: number): Promise<boolean> => {
        const response = await api.get<ApiResponse<boolean>>(`/Favorites/check/${productId}`)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Не удалось проверить избранное')
        }
        return response.data.data
    }
}










