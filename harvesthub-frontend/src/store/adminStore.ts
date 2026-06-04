// src/store/adminStore.ts
import { create } from 'zustand'
import { productsApi } from '@/api/products.api'
import { reviewsApi } from '@/api/reviews.api'
import { categoriesApi } from '@/api/categories.api'
import { ordersApi } from '@/api/orders.api'
import { usersApi } from '@/api/users.api' // Добавьте этот импорт
import {
    ProductDto,
    CreateProductDto,
    UpdateProductDto,
    OrderDto,
    CategoryDto,
    ReviewDto,
    UpdateOrderStatusDto,
    CreateCategoryDto,
    UpdateCategoryDto,
    UserDto,
    UserStatsDto,
    UpdateUserRoleDto,
    UpdateUserStatusDto // Добавьте эти импорты
} from '@/types/backend'

interface AdminStore {
    // Состояние
    products: ProductDto[]
    orders: OrderDto[]
    categories: CategoryDto[]
    pendingReviews: ReviewDto[]
    users: UserDto[]
    userStats: UserStatsDto | null

    isLoading: boolean
    error: string | null

    // Действия для продуктов
    fetchProducts: () => Promise<void>
    createProduct: (productData: CreateProductDto) => Promise<ProductDto>
    updateProduct: (id: number, productData: UpdateProductDto) => Promise<ProductDto>
    deleteProduct: (id: number) => Promise<void>

    // Действия для заказов
    fetchOrders: () => Promise<void>
    updateOrderStatus: (id: number, statusData: UpdateOrderStatusDto) => Promise<OrderDto>

    // Действия для категорий
    fetchCategories: () => Promise<void>
    createCategory: (categoryData: CreateCategoryDto) => Promise<CategoryDto>
    updateCategory: (id: number, categoryData: UpdateCategoryDto) => Promise<CategoryDto>
    deleteCategory: (id: number) => Promise<void>

    // Действия для отзывов
    fetchPendingReviews: () => Promise<void>
    approveReview: (id: number) => Promise<void>
    rejectReview: (id: number) => Promise<void>

    // Действия для пользователей
    fetchUsers: () => Promise<void>
    fetchUserStats: () => Promise<void>
    updateUserRole: (id: number, roleData: UpdateUserRoleDto) => Promise<UserDto>
    updateUserStatus: (id: number, statusData: UpdateUserStatusDto) => Promise<UserDto>
    deleteUser: (id: number) => Promise<void>
    searchUsers: (term: string) => Promise<void>

    // Утилиты
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    clearError: () => void
}

export const useAdminStore = create<AdminStore>((set, get) => ({
    // Начальное состояние
    products: [],
    orders: [],
    categories: [],
    pendingReviews: [],
    users: [],
    userStats: null,
    isLoading: false,
    error: null,

    // ===================== ПРОДУКТЫ =====================
    fetchProducts: async () => {
        set({ isLoading: true, error: null })
        try {
            const products = await productsApi.getProducts()
            set({ products, isLoading: false })
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Ошибка загрузки продуктов',
                isLoading: false
            })
        }
    },

    createProduct: async (productData: CreateProductDto) => {
        set({ isLoading: true, error: null })
        try {
            const product = await productsApi.createProduct(productData)
            // Обновляем список продуктов
            const { products } = get()
            set({
                products: [...products, product],
                isLoading: false
            })
            return product
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Ошибка создания продукта',
                isLoading: false
            })
            throw error
        }
    },

    updateProduct: async (id: number, productData: UpdateProductDto) => {
        set({ isLoading: true, error: null })
        try {
            const product = await productsApi.updateProduct(id, productData)
            // Обновляем продукт в списке
            const { products } = get()
            set({
                products: products.map(p => p.productId === id ? product : p),
                isLoading: false
            })
            return product
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Ошибка обновления продукта',
                isLoading: false
            })
            throw error
        }
    },

    deleteProduct: async (id: number) => {
        set({ isLoading: true, error: null })
        try {
            await productsApi.deleteProduct(id)
            // Удаляем продукт из списка
            const { products } = get()
            set({
                products: products.filter(p => p.productId !== id),
                isLoading: false
            })
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Ошибка удаления продукта',
                isLoading: false
            })
            throw error
        }
    },

    // ===================== ЗАКАЗЫ =====================
    fetchOrders: async () => {
        set({ isLoading: true, error: null })
        try {
            const orders = await ordersApi.getAllOrders() // Используем метод для получения всех заказов
            set({ orders, isLoading: false })
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Ошибка загрузки заказов',
                isLoading: false
            })
        }
    },

    updateOrderStatus: async (id: number, statusData: UpdateOrderStatusDto) => {
        set({ isLoading: true, error: null })
        try {
            const order = await ordersApi.updateOrderStatus(id, statusData)
            // Обновляем заказ в списке
            const { orders } = get()
            set({
                orders: orders.map(o => o.orderId === id ? order : o),
                isLoading: false
            })
            return order
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Ошибка обновления статуса',
                isLoading: false
            })
            throw error
        }
    },

    // ===================== КАТЕГОРИИ =====================
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

    createCategory: async (categoryData: CreateCategoryDto) => {
        set({ isLoading: true, error: null })
        try {
            const category = await categoriesApi.createCategory(categoryData)
            // Обновляем список категорий
            const { categories } = get()
            set({
                categories: [...categories, category],
                isLoading: false
            })
            return category
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Ошибка создания категории',
                isLoading: false
            })
            throw error
        }
    },

    updateCategory: async (id: number, categoryData: UpdateCategoryDto) => {
        set({ isLoading: true, error: null })
        try {
            const category = await categoriesApi.updateCategory(id, categoryData)
            // Обновляем категорию в списке
            const { categories } = get()
            set({
                categories: categories.map(c => c.categoryId === id ? category : c),
                isLoading: false
            })
            return category
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Ошибка обновления категории',
                isLoading: false
            })
            throw error
        }
    },

    deleteCategory: async (id: number) => {
        set({ isLoading: true, error: null })
        try {
            await categoriesApi.deleteCategory(id)
            // Удаляем категорию из списка
            const { categories } = get()
            set({
                categories: categories.filter(c => c.categoryId !== id),
                isLoading: false
            })
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Ошибка удаления категории',
                isLoading: false
            })
            throw error
        }
    },

    // ===================== ОТЗЫВЫ =====================
    fetchPendingReviews: async () => {
        set({ isLoading: true, error: null })
        try {
            const pendingReviews = await reviewsApi.getPendingReviews()
            set({ pendingReviews, isLoading: false })
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Ошибка загрузки отзывов',
                isLoading: false
            })
        }
    },

    approveReview: async (id: number) => {
        set({ isLoading: true, error: null })
        try {
            await reviewsApi.approveReview(id)
            // Удаляем одобренный отзыв из списка ожидания
            const { pendingReviews } = get()
            set({
                pendingReviews: pendingReviews.filter(r => r.reviewId !== id),
                isLoading: false
            })
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Ошибка одобрения отзыва',
                isLoading: false
            })
            throw error
        }
    },

    rejectReview: async (id: number) => {
        set({ isLoading: true, error: null })
        try {
            await reviewsApi.rejectReview(id)
            // Удаляем отклоненный отзыв из списка ожидания
            const { pendingReviews } = get()
            set({
                pendingReviews: pendingReviews.filter(r => r.reviewId !== id),
                isLoading: false
            })
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Ошибка отклонения отзыва',
                isLoading: false
            })
            throw error
        }
    },

    // ===================== ПОЛЬЗОВАТЕЛИ =====================
    fetchUsers: async () => {
        set({ isLoading: true, error: null })
        try {
            const users = await usersApi.getAllUsers()
            set({ users, isLoading: false })
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Ошибка загрузки пользователей',
                isLoading: false
            })
        }
    },

    fetchUserStats: async () => {
        set({ isLoading: true, error: null })
        try {
            const userStats = await usersApi.getUserStats()
            set({ userStats, isLoading: false })
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Ошибка загрузки статистики пользователей',
                isLoading: false
            })
        }
    },

    updateUserRole: async (id: number, roleData: UpdateUserRoleDto) => {
        set({ isLoading: true, error: null })
        try {
            const user = await usersApi.updateUserRole(id, roleData)
            // Обновляем пользователя в списке
            const { users } = get()
            set({
                users: users.map(u => u.userId === id ? user : u),
                isLoading: false
            })
            return user
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Ошибка обновления роли пользователя',
                isLoading: false
            })
            throw error
        }
    },

    updateUserStatus: async (id: number, statusData: UpdateUserStatusDto) => {
        set({ isLoading: true, error: null })
        try {
            const user = await usersApi.updateUserStatus(id, statusData)
            // Обновляем пользователя в списке
            const { users } = get()
            set({
                users: users.map(u => u.userId === id ? user : u),
                isLoading: false
            })
            return user
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Ошибка обновления статуса пользователя',
                isLoading: false
            })
            throw error
        }
    },

    deleteUser: async (id: number) => {
        set({ isLoading: true, error: null })
        try {
            await usersApi.deleteUser(id)
            // Удаляем пользователя из списка
            const { users } = get()
            set({
                users: users.filter(u => u.userId !== id),
                isLoading: false
            })
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Ошибка удаления пользователя',
                isLoading: false
            })
            throw error
        }
    },

    searchUsers: async (term: string) => {
        set({ isLoading: true, error: null })
        try {
            const users = await usersApi.searchUsers(term)
            set({ users, isLoading: false })
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Ошибка поиска пользователей',
                isLoading: false
            })
        }
    },

    // ===================== УТИЛИТЫ =====================
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null })
}))