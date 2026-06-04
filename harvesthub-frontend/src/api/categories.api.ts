import api from './axios'
import {
    CategoryDto,
    CreateCategoryDto,
    UpdateCategoryDto,
    ApiResponse
} from '@/types/backend'

export const categoriesApi = {
    // Получение всех категорий
    getCategories: async (): Promise<CategoryDto[]> => {
        const response = await api.get<ApiResponse<CategoryDto[]>>('/Categories')
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch categories')
        }
        return response.data.data
    },

    // Получение категории по ID
    getCategoryById: async (id: number): Promise<CategoryDto> => {
        const response = await api.get<ApiResponse<CategoryDto>>(`/Categories/${id}`)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch category')
        }
        return response.data.data
    },

    // Получение дерева категорий
    getCategoryTree: async (): Promise<CategoryDto[]> => {
        const response = await api.get<ApiResponse<CategoryDto[]>>('/Categories/tree')
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch category tree')
        }
        return response.data.data
    },

    // Создание категории (для админа)
    createCategory: async (categoryData: CreateCategoryDto): Promise<CategoryDto> => {
        try {
            const cleanedData: CreateCategoryDto = {
                name: categoryData.name.trim(),
                ...(categoryData.description && categoryData.description.trim() ? { description: categoryData.description.trim() } : {}),
                ...(categoryData.parentId !== undefined && { parentId: categoryData.parentId })
            }

            const response = await api.post<ApiResponse<CategoryDto>>('/Categories', cleanedData)
            if (!response.data.success) {
                throw new Error(response.data.message || 'Не удалось создать категорию')
            }
            return response.data.data
        } catch (error: any) {
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.errors ?
                Object.values(error.response.data.errors).flat().join(', ') :
                error.message ||
                'Не удалось создать категорию'
            throw new Error(errorMessage)
        }
    },

    // Обновление категории (для админа)
    updateCategory: async (id: number, categoryData: UpdateCategoryDto): Promise<CategoryDto> => {
        try {
            // Очищаем данные: убираем пустые строки и undefined значения
            const cleanedData: any = {}

            // Name: отправляем только если не пустое
            if (categoryData.name !== undefined && categoryData.name !== null) {
                const trimmedName = categoryData.name.trim()
                if (trimmedName) {
                    cleanedData.name = trimmedName
                }
            }

            // Description: отправляем только если передано значение
            // Если передана пустая строка, отправляем пустую строку (не null, чтобы избежать проблем с валидацией)
            if (categoryData.description !== undefined) {
                if (categoryData.description === null) {
                    // Если явно null, не отправляем поле (оставляем как есть в БД)
                    // Не добавляем в cleanedData
                } else {
                    const trimmed = categoryData.description.trim()
                    // Отправляем пустую строку вместо null для очистки
                    cleanedData.description = trimmed
                }
            }

            // ParentId: отправляем только если определено
            if (categoryData.parentId !== undefined) {
                cleanedData.parentId = categoryData.parentId
            }

            console.log('Отправка данных для обновления категории:', JSON.stringify(cleanedData))

            const response = await api.put<ApiResponse<CategoryDto>>(`/Categories/${id}`, cleanedData)
            if (!response.data.success) {
                throw new Error(response.data.message || 'Не удалось обновить категорию')
            }
            return response.data.data
        } catch (error: any) {
            console.error('Ошибка при обновлении категории:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            })

            // Извлекаем сообщение об ошибке из ответа сервера
            let errorMessage = error.message || 'Не удалось обновить категорию'

            if (error.response?.data) {
                // Если есть детальные ошибки валидации из ModelState
                if (error.response.data.errors) {
                    const validationErrors = Object.entries(error.response.data.errors)
                        .map(([key, values]: [string, any]) => {
                            const messages = Array.isArray(values) ? values : [values]
                            return `${key}: ${messages.join(', ')}`
                        })
                        .join('; ')
                    errorMessage = validationErrors || error.response.data.message || errorMessage
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message
                }
            }

            throw new Error(errorMessage)
        }
    },

    // Удаление категории (для админа)
    deleteCategory: async (id: number): Promise<boolean> => {
        try {
            const response = await api.delete<ApiResponse<boolean>>(`/Categories/${id}`)
            if (!response.data.success) {
                throw new Error(response.data.message || 'Не удалось удалить категорию')
            }
            return response.data.data
        } catch (error: any) {
            const errorMessage = error.response?.data?.message ||
                error.message ||
                'Не удалось удалить категорию'
            throw new Error(errorMessage)
        }
    }
}