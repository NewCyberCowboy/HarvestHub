import api from './axios'
import {
    ProductDto,
    CreateProductDto,
    UpdateProductDto,
    ApiResponse
} from '@/types/backend'

export const productsApi = {
    // Получение всех продуктов
    getProducts: async (): Promise<ProductDto[]> => {
        const response = await api.get<ApiResponse<ProductDto[]>>('/Products')
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch products')
        }
        return response.data.data
    },

    // Получение продукта по ID
    getProductById: async (id: number): Promise<ProductDto> => {
        const response = await api.get<ApiResponse<ProductDto>>(`/Products/${id}`)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch product')
        }
        return response.data.data
    },

    // Получение продуктов по категории
    getProductsByCategory: async (categoryId: number): Promise<ProductDto[]> => {
        const response = await api.get<ApiResponse<ProductDto[]>>(`/Products/category/${categoryId}`)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch products by category')
        }
        return response.data.data
    },

    // Поиск продуктов
    searchProducts: async (term: string): Promise<ProductDto[]> => {
        const response = await api.get<ApiResponse<ProductDto[]>>('/Products/search', {
            params: { term }
        })
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to search products')
        }
        return response.data.data
    },

    // Создание продукта (для фермера/админа)
    createProduct: async (productData: CreateProductDto): Promise<ProductDto> => {
        const response = await api.post<ApiResponse<ProductDto>>('/Products', productData)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to create product')
        }
        return response.data.data
    },

    // Обновление продукта (для фермера/админа)
    updateProduct: async (id: number, productData: UpdateProductDto): Promise<ProductDto> => {
        const response = await api.put<ApiResponse<ProductDto>>(`/Products/${id}`, productData)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to update product')
        }
        return response.data.data
    },

    // Удаление продукта (для фермера/админа)
    deleteProduct: async (id: number): Promise<boolean> => {
        try {
            const response = await api.delete<ApiResponse<boolean>>(`/Products/${id}`)
            if (!response.data.success) {
                throw new Error(response.data.message || 'Не удалось удалить продукт')
            }
            return response.data.data
        } catch (error: any) {
            // Извлекаем сообщение об ошибке из ответа сервера
            const errorMessage = error.response?.data?.message ||
                error.message ||
                'Не удалось удалить продукт'
            throw new Error(errorMessage)
        }
    },

    // Получение продуктов фермера
    getMyProducts: async (): Promise<ProductDto[]> => {
        const response = await api.get<ApiResponse<ProductDto[]>>('/Products/farmer/my-products')
        if (!response.data.success) {
            throw new Error(response.data.message || 'Не удалось загрузить продукты')
        }
        return response.data.data
    }
}