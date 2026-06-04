// src/store/products.store.ts
import { create } from 'zustand'
import { CategoryDto } from '@/types/backend'
import { Product } from '@/types/product'

interface ProductsStore {
    products: Product[]  // ← Теперь Product, а не ProductDto
    categories: CategoryDto[]
    selectedProduct: Product | null
    isLoading: boolean
    error: string | null

    // Actions
    setProducts: (products: Product[]) => void
    setCategories: (categories: CategoryDto[]) => void
    setSelectedProduct: (product: Product | null) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    clearProducts: () => void
    clearCategories: () => void
    clearSelectedProduct: () => void
}

export const useProductsStore = create<ProductsStore>((set) => ({
    products: [],
    categories: [],
    selectedProduct: null,
    isLoading: false,
    error: null,

    setProducts: (products) => {
        console.log('🛒 [PRODUCTS STORE] Установка продуктов:', {
            count: products.length,
            firstProduct: products[0],
            allProducts: products
        })
        set({ products })
    },

    setCategories: (categories) => {
        console.log('🏷️ [PRODUCTS STORE] Установка категорий:', {
            count: categories.length,
            categories
        })
        set({ categories })
    },

    setSelectedProduct: (product) => {
        console.log('🎯 [PRODUCTS STORE] Установка выбранного продукта:', product)
        set({ selectedProduct: product })
    },

    setLoading: (loading) => {
        console.log('⏳ [PRODUCTS STORE] Установка loading:', loading)
        set({ isLoading: loading })
    },

    setError: (error) => {
        console.log('❌ [PRODUCTS STORE] Установка ошибки:', error)
        set({ error })
    },

    clearProducts: () => {
        console.log('🧹 [PRODUCTS STORE] Очистка продуктов')
        set({ products: [] })
    },

    clearCategories: () => {
        console.log('🧹 [PRODUCTS STORE] Очистка категорий')
        set({ categories: [] })
    },

    clearSelectedProduct: () => {
        console.log('🧹 [PRODUCTS STORE] Очистка выбранного продукта')
        set({ selectedProduct: null })
    },
}))