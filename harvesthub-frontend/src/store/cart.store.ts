import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product } from '@/types/product'
import { ordersApi } from '@/api/orders.api'
import { OrderDto } from '@/types/backend'
import { useAuthStore } from '@/store/auth.store'

export interface CartItem {
    productId: string
    product: Product
    quantity: number
    expectedWeight?: number // Ожидаемый вес в кг (от клиента)
}

interface CartStore {
    items: CartItem[]
    totalItems: number
    totalPrice: number
    deliveryCost: number
    freeDeliveryThreshold: number
    isCartOpen: boolean

    // Действия
    addItem: (product: Product, quantity?: number, expectedWeight?: number) => void
    removeItem: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
    toggleCart: () => void
    getItem: (productId: string) => CartItem | undefined
    calculateTotals: () => void
    getDeliveryPrice: () => number
    getTotalWithDelivery: () => number

    // ИСПРАВЛЯЕМ тип:
    createOrderFromCart: (deliveryAddress: string, customerNotes?: string) => Promise<OrderDto> // вместо any
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            totalItems: 0,
            totalPrice: 0,
            deliveryCost: 200,
            freeDeliveryThreshold: 2000,
            isCartOpen: false,

            // === ДОБАВЬТЕ ЭТИ МЕТОДЫ ===
            addItem: (product, quantity = 1, expectedWeight?: number) => {
                set((state) => {
                    const existingItem = state.items.find(item => item.productId === product.id)

                    let updatedItems: CartItem[]
                    if (existingItem) {
                        updatedItems = state.items.map(item =>
                            item.productId === product.id
                                ? { 
                                    ...item, 
                                    quantity: item.quantity + quantity,
                                    expectedWeight: expectedWeight || item.expectedWeight
                                }
                                : item
                        )
                    } else {
                        const newItem: CartItem = {
                            productId: product.id,
                            product,
                            quantity,
                            expectedWeight
                        }
                        updatedItems = [...state.items, newItem]
                    }

                    // Сразу вычисляем totals на основе обновленных items
                    const totalItems = updatedItems.length
                    const totalPrice = updatedItems.reduce((sum, item) => {
                        const price = item.product.discountPrice || item.product.price
                        // Если указан вес, используем его для расчета, иначе quantity
                        const weight = item.expectedWeight || item.quantity
                        return sum + (price * weight)
                    }, 0)

                    return {
                        items: updatedItems,
                        totalItems,
                        totalPrice
                    }
                })
            },

            removeItem: (productId) => {
                set((state) => {
                    const updatedItems = state.items.filter(item => item.productId !== productId)
                    
                    // Сразу вычисляем totals на основе обновленных items
                    const totalItems = updatedItems.length
                    const totalPrice = updatedItems.reduce((sum, item) => {
                        const price = item.product.discountPrice || item.product.price
                        // Если указан вес, используем его для расчета, иначе quantity
                        const weight = item.expectedWeight || item.quantity
                        return sum + (price * weight)
                    }, 0)

                    return {
                        items: updatedItems,
                        totalItems,
                        totalPrice
                    }
                })
            },

            updateQuantity: (productId, quantity) => {
                if (quantity < 1) {
                    get().removeItem(productId)
                    return
                }

                set((state) => {
                    const updatedItems = state.items.map(item =>
                        item.productId === productId
                            ? { ...item, quantity }
                            : item
                    )
                    
                    // Сразу вычисляем totals на основе обновленных items
                    const totalItems = updatedItems.length
                    const totalPrice = updatedItems.reduce((sum, item) => {
                        const price = item.product.discountPrice || item.product.price
                        return sum + (price * item.quantity)
                    }, 0)

                    return {
                        items: updatedItems,
                        totalItems,
                        totalPrice
                    }
                })
            },

            clearCart: () => {
                set({ items: [], totalItems: 0, totalPrice: 0 })
            },

            toggleCart: () => {
                set((state) => ({ isCartOpen: !state.isCartOpen }))
            },

            getItem: (productId) => {
                return get().items.find(item => item.productId === productId)
            },

            calculateTotals: () => {
                const state = get()
                // Считаем количество уникальных продуктов, а не общее количество единиц
                const totalItems = state.items.length
                const totalPrice = state.items.reduce((sum, item) => {
                    const price = item.product.discountPrice || item.product.price
                    // Если указан вес, используем его для расчета, иначе quantity
                    const weight = item.expectedWeight || item.quantity
                    return sum + (price * weight)
                }, 0)

                set({ totalItems, totalPrice })
            },

            getDeliveryPrice: () => {
                const { totalPrice, deliveryCost, freeDeliveryThreshold } = get()
                return totalPrice >= freeDeliveryThreshold ? 0 : deliveryCost
            },

            getTotalWithDelivery: () => {
                const { totalPrice } = get()
                return totalPrice + get().getDeliveryPrice()
            },
            // === КОНЕЦ ДОБАВЛЕННЫХ МЕТОДОВ ===

            createOrderFromCart: async (deliveryAddress: string, customerNotes?: string) => {
                const state = get()
                const cartItems = state.items

                if (cartItems.length === 0) {
                    throw new Error('Корзина пуста')
                }

                try {
                    const orderItems = cartItems.map(item => ({
                        productId: parseInt(item.productId),
                        quantity: item.quantity, // Для обратной совместимости
                        expectedWeight: item.expectedWeight, // Ожидаемый вес в кг
                        price: item.product.discountPrice || item.product.price // Цена за кг
                    }))


                    const orderData = {
                        deliveryAddress,
                        customerNotes,
                        items: orderItems
                    }

                    const newOrder = await ordersApi.createOrder(orderData)

                    state.clearCart()

                    return newOrder

                } catch (error) {
                    console.error('Ошибка при создании заказа:', error)
                    throw error
                }
            }
        }),
        {
            name: 'cart-storage', // Базовое имя, будет переопределено динамически
            // Используем кастомный storage, который учитывает userId
            storage: {
                getItem: (name) => {
                    const authStore = useAuthStore.getState()
                    const userId = authStore.user?.userId || 'guest'
                    const key = `cart-storage-${userId}`
                    const value = localStorage.getItem(key)
                    return value ? JSON.parse(value) : null
                },
                setItem: (name, value) => {
                    const authStore = useAuthStore.getState()
                    const userId = authStore.user?.userId || 'guest'
                    const key = `cart-storage-${userId}`
                    localStorage.setItem(key, JSON.stringify(value))
                },
                removeItem: (name) => {
                    const authStore = useAuthStore.getState()
                    const userId = authStore.user?.userId || 'guest'
                    const key = `cart-storage-${userId}`
                    localStorage.removeItem(key)
                }
            }
        }
    )
)

// Очищаем корзину при смене пользователя
useAuthStore.subscribe(
    (state) => state.user,
    (user, prevUser) => {
        if (user?.userId !== prevUser?.userId) {
            // Пользователь изменился - очищаем корзину
            useCartStore.getState().clearCart()
        }
    }
)