// src/hooks/useProducts.ts
import { useCallback } from 'react'
import { useProductsStore } from '@/store/products.store'
import { useApi } from './useApi'
import { productsApi } from '@/api/products.api'
import { categoriesApi } from '@/api/categories.api'
import { mapDtoToProduct } from '@/types/product' // ← Импортируем маппер


export const useProducts = () => {
    const store = useProductsStore()
    const productsApiHook = useApi(productsApi.getProducts)
    const categoriesApiHook = useApi(categoriesApi.getCategories)

    const fetchProducts = useCallback(async () => {
        console.log('🔄 [USE PRODUCTS] Начало загрузки продуктов')
        try {
            const productDtos = await productsApiHook.execute()
            console.log('✅ [USE PRODUCTS] Получены DTO:', {
                count: productDtos.length,
                firstDto: productDtos[0]
            })

            // Конвертируем DTO в Product
            const products = productDtos.map(dto => {
                const product = mapDtoToProduct(dto)
                console.log(`   ↳ Конвертация DTO ${dto.productId} -> Product ${product.id}`)
                return product
            })

            console.log('💾 [USE PRODUCTS] Сохранение продуктов в store:', {
                count: products.length
            })
            store.setProducts(products)
            return products
        } catch (error) {
            console.error('❌ [USE PRODUCTS] Ошибка загрузки:', error)
            store.setError(productsApiHook.error || 'Ошибка загрузки продуктов')
            throw error
        }
    }, [store, productsApiHook])

    const fetchCategories = useCallback(async () => {
        console.log('🔄 [USE PRODUCTS] Загрузка категорий')
        try {
            const categories = await categoriesApiHook.execute()
            console.log('✅ [USE PRODUCTS] Получены категории:', {
                count: categories.length
            })
            store.setCategories(categories)
            return categories
        } catch (error) {
            console.error('❌ [USE PRODUCTS] Ошибка загрузки категорий:', error)
            store.setError(categoriesApiHook.error || 'Ошибка загрузки категорий')
            throw error
        }
    }, [store, categoriesApiHook])

    const fetchProductById = useCallback(async (id: number) => {
        console.log(`🔄 [USE PRODUCTS] Загрузка продукта по ID: ${id}`)
        try {
            store.setLoading(true)
            const productDto = await productsApi.getProductById(id)
            console.log('✅ [USE PRODUCTS] Получен DTO продукта:', productDto)

            // Конвертируем DTO в Product
            const product = mapDtoToProduct(productDto)
            console.log('🔄 [USE PRODUCTS] Конвертирован в Product:', product)

            store.setSelectedProduct(product)
            store.setLoading(false)
            return product
        } catch (error) {
            console.error(`❌ [USE PRODUCTS] Ошибка загрузки продукта ${id}:`, error)
            store.setError(error instanceof Error ? error.message : 'Ошибка загрузки продукта')
            store.setLoading(false)
            throw error
        }
    }, [store])

    const searchProducts = useCallback(async (term: string) => {
        console.log(`🔍 [USE PRODUCTS] Поиск продуктов: "${term}"`)
        try {
            store.setLoading(true)
            const productDtos = await productsApi.searchProducts(term)
            console.log('✅ [USE PRODUCTS] Результаты поиска (DTO):', {
                count: productDtos.length
            })

            // Конвертируем DTO в Product
            const products = productDtos.map(dto => mapDtoToProduct(dto))

            store.setProducts(products)
            store.setLoading(false)
            return products
        } catch (error) {
            console.error('❌ [USE PRODUCTS] Ошибка поиска:', error)
            store.setError(error instanceof Error ? error.message : 'Ошибка поиска')
            store.setLoading(false)
            throw error
        }
    }, [store])

    const clearProducts = useCallback(() => {
        console.log('🧹 [USE PRODUCTS] Очистка продуктов')
        store.clearProducts()
        productsApiHook.clear()
    }, [store, productsApiHook])

    const clearCategories = useCallback(() => {
        console.log('🧹 [USE PRODUCTS] Очистка категорий')
        store.clearCategories()
        categoriesApiHook.clear()
    }, [store, categoriesApiHook])

    return {
        // Состояние
        products: store.products,
        categories: store.categories,
        selectedProduct: store.selectedProduct,
        isLoading: store.isLoading || productsApiHook.isLoading || categoriesApiHook.isLoading,
        error: store.error || productsApiHook.error || categoriesApiHook.error,

        // Действия
        fetchProducts,
        fetchCategories,
        fetchProductById,
        searchProducts,
        clearProducts,
        clearCategories,

        // Вспомогательные методы
        setError: store.setError,
    }
}