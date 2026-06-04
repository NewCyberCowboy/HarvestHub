import { useCallback } from 'react'
import { useOrdersStore } from '@/store/orders.store'
import { useApi } from './useApi'
import { ordersApi } from '@/api/orders.api'
import { CreateOrderDto } from '@/types/backend'

export const useOrders = () => {
    const store = useOrdersStore()
    const ordersApiHook = useApi(ordersApi.getUserOrders)

    const fetchOrders = useCallback(async () => {
        try {
            const orders = await ordersApiHook.execute()
            store.setOrders(orders)
            return orders
        } catch (error) {
            store.setError(ordersApiHook.error)
            throw error
        }
    }, [store, ordersApiHook])

    const fetchOrderById = useCallback(async (id: number) => {
        try {
            store.setLoading(true)
            const order = await ordersApi.getOrderById(id)
            store.setCurrentOrder(order)
            store.setLoading(false)
            return order
        } catch (error) {
            store.setError(error instanceof Error ? error.message : 'Ошибка загрузки заказа')
            store.setLoading(false)
            throw error
        }
    }, [store])

    const createOrder = useCallback(async (orderData: CreateOrderDto) => {
        try {
            store.setLoading(true)
            const order = await ordersApi.createOrder(orderData)
            store.addOrder(order)
            store.setCurrentOrder(order)
            store.setLoading(false)
            return order
        } catch (error) {
            store.setError(error instanceof Error ? error.message : 'Ошибка создания заказа')
            store.setLoading(false)
            throw error
        }
    }, [store])

    const clearOrders = useCallback(() => {
        store.clearOrders()
        ordersApiHook.clear()
    }, [store, ordersApiHook])

    return {
        // Состояние
        orders: store.orders,
        currentOrder: store.currentOrder,
        isLoading: store.isLoading || ordersApiHook.isLoading,
        error: store.error || ordersApiHook.error,

        // Действия
        fetchOrders,
        fetchOrderById,
        createOrder,
        createOrderFromCart: store.createOrderFromCart,

        // Вспомогательные методы
        clearOrders,
        clearCurrentOrder: store.clearCurrentOrder,
        setError: store.setError,
    }
}