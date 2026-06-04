import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { OrderDto, CreateOrderDto, OrderItemDto } from '@/types/backend'
import { useCartStore } from './cart.store'
import { useAuthStore } from './auth.store'

interface OrdersStore {
    orders: OrderDto[]
    currentOrder: OrderDto | null
    isLoading: boolean
    error: string | null

    // Actions
    setOrders: (orders: OrderDto[]) => void
    setCurrentOrder: (order: OrderDto | null) => void
    addOrder: (order: OrderDto) => void
    updateOrderStatus: (orderId: number, status: string) => void
    getOrder: (orderId: string) => OrderDto | undefined
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    clearOrders: () => void
    clearCurrentOrder: () => void
    fetchOrders: () => Promise<void> // Добавлено: загрузка заказов из API

    // Создание заказа из корзины
    createOrderFromCart: (deliveryAddress: string, customerNotes?: string) => Promise<OrderDto>
}

export const useOrdersStore = create<OrdersStore>()(
    persist(
        (set, get) => ({ 
            orders: [],
            currentOrder: null,
            isLoading: false,
            error: null,

            setOrders: (orders) => set({ orders }),
            setCurrentOrder: (order) => set({ currentOrder: order }),

            addOrder: (order) => set((state) => ({
                orders: [order, ...state.orders]
            })),
            getOrder: (orderId: string) => {
                const state = get()
                return state.orders.find(order => order.orderId.toString() === orderId)
            },
            updateOrderStatus: (orderId: number, status: string) =>
                set((state) => ({
                    orders: state.orders.map(order =>
                        order.orderId === orderId
                            ? { ...order, status, updatedAt: new Date().toISOString() }
                            : order
                    ),
                    currentOrder: state.currentOrder?.orderId === orderId
                        ? { ...state.currentOrder, status, updatedAt: new Date().toISOString() }
                        : state.currentOrder
                })),

            setLoading: (loading) => set({ isLoading: loading }),
            setError: (error) => set({ error }),
            clearOrders: () => set({ orders: [] }),
            clearCurrentOrder: () => set({ currentOrder: null }),

            fetchOrders: async () => {
                const authStore = useAuthStore.getState()
                if (!authStore.user) {
                    set({ orders: [], isLoading: false })
                    return
                }

                set({ isLoading: true, error: null })
                try {
                    const { ordersApi } = await import('@/api/orders.api')
                    const fetchedOrders = await ordersApi.getUserOrders()
                    set({ orders: fetchedOrders, isLoading: false })
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Не удалось загрузить заказы'
                    set({ error: errorMessage, isLoading: false })
                    console.error('Failed to fetch orders:', error)
                }
            },

            createOrderFromCart: async (deliveryAddress: string, customerNotes?: string) => {
                set({ isLoading: true, error: null })

                try {
                    const cartStore = useCartStore.getState()
                    const cartItems = cartStore.items

                    if (cartItems.length === 0) {
                        throw new Error('Корзина пуста')
                    }

                    // Конвертируем товары из корзины в OrderItemDto
                    const orderItems: OrderItemDto[] = cartItems.map(item => ({
                        productId: parseInt(item.productId),
                        quantity: item.quantity
                    }))

                    // ВАЖНО: customerNotes должно быть строкой, даже если пустой
                    const orderData: CreateOrderDto = {
                        deliveryAddress,
                        customerNotes: customerNotes || "", // ← гарантируем строку
                        items: orderItems
                    }

                    console.log('📤 Создаем заказ:', orderData)

                    // Создаем заказ через API
                    const { ordersApi } = await import('@/api/orders.api')
                    const newOrder = await ordersApi.createOrder(orderData)

                    // Очищаем корзину
                    cartStore.clearCart()

                    // Добавляем заказ в состояние
                    set((state) => ({
                        orders: [newOrder, ...state.orders],
                        currentOrder: newOrder,
                        isLoading: false
                    }))

                    return newOrder

                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Ошибка создания заказа'
                    set({ error: errorMessage, isLoading: false })
                    throw error
                }
            }
        }),
        {
            name: 'harvesthub-orders-storage',
            version: 1,
            // Динамический ключ для хранения заказов на основе ID пользователя
            getStorage: () => localStorage,
            getItem: (name) => {
                const authStore = useAuthStore.getState()
                const userId = authStore.user?.userId
                const storageKey = userId ? `${name}-${userId}` : name
                return localStorage.getItem(storageKey)
            },
            setItem: (name, value) => {
                const authStore = useAuthStore.getState()
                const userId = authStore.user?.userId
                const storageKey = userId ? `${name}-${userId}` : name
                localStorage.setItem(storageKey, value)
            },
            removeItem: (name) => {
                const authStore = useAuthStore.getState()
                const userId = authStore.user?.userId
                const storageKey = userId ? `${name}-${userId}` : name
                localStorage.removeItem(storageKey)
            },
        }
    )
)

// Подписываемся на изменения пользователя, чтобы очищать заказы при выходе
useAuthStore.subscribe(
    (state, prevState) => {
        if (prevState.user && !state.user) {
            // Пользователь вышел, очищаем заказы
            useOrdersStore.getState().clearOrders()
        } else if (prevState.user?.userId !== state.user?.userId) {
            // Пользователь сменился, очищаем заказы и загружаем новые
            useOrdersStore.getState().clearOrders()
            if (state.user) {
                useOrdersStore.getState().fetchOrders()
            }
        }
    },
    (state) => state.user
)