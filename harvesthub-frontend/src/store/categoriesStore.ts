// src/store/categoriesStore.ts
import { create } from 'zustand'
import { CategoryDto } from '@/types/backend'
import { categoriesApi } from '@/api/categories.api'

interface CategoriesStore {
    categories: CategoryDto[]
    isLoading: boolean
    error: string | null

    fetchCategories: () => Promise<void>
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    clearError: () => void
}

export const useCategoriesStore = create<CategoriesStore>((set) => ({
    categories: [],
    isLoading: false,
    error: null,

    fetchCategories: async () => {
        set({ isLoading: true, error: null })
        try {
            const categories = await categoriesApi.getCategories()
            set({ categories, isLoading: false })
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Ошибка загрузки категорий',
                isLoading: false
            })
        }
    },

    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null })
}))