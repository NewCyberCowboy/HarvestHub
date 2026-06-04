// src/hooks/useProductDetail.ts
import { useState, useCallback } from 'react'
import { productsApi } from '@/api/products.api'
import { ProductDto } from '@/types/backend'

export const useProductDetail = () => {
    const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchProductById = useCallback(async (id: number) => {
        setIsLoading(true)
        setError(null)
        try {
            const product = await productsApi.getProductById(id)
            setSelectedProduct(product)
            return product
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Ошибка загрузки продукта'
            setError(message)
            throw error
        } finally {
            setIsLoading(false)
        }
    }, []) // ← ПУСТОЙ массив зависимостей!

    const clearProduct = useCallback(() => {
        setSelectedProduct(null)
        setError(null)
    }, [])

    return {
        selectedProduct,
        isLoading,
        error,
        fetchProductById,
        clearProduct
    }
}