import { useCartStore } from '@/store/cart.store'
import { Product } from '@/types/product'

export const useCart = () => {
    const store = useCartStore()

    const addToCart = (product: Product, quantity: number = 1) => {
        // Проверяем доступность товара
        if (!product.isAvailable) {
            alert('Товар временно недоступен')
            return
        }

        if (product.stock <= 0) {
            alert('Товар закончился')
            return
        }

        store.addItem(product, quantity)
    }

    const increaseQuantity = (productId: string) => {
        const item = store.getItem(productId)
        if (item) {
            store.updateQuantity(productId, item.quantity + 1)
        }
    }

    const decreaseQuantity = (productId: string) => {
        const item = store.getItem(productId)
        if (item) {
            if (item.quantity <= 1) {
                store.removeItem(productId)
            } else {
                store.updateQuantity(productId, item.quantity - 1)
            }
        }
    }

    const isInCart = (productId: string) => {
        return !!store.getItem(productId)
    }

    const getItemQuantity = (productId: string) => {
        const item = store.getItem(productId)
        return item ? item.quantity : 0
    }

    return {
        // Состояние
        items: store.items,
        totalItems: store.totalItems,
        totalPrice: store.totalPrice,
        isCartOpen: store.isCartOpen,

        // Действия
        addToCart,
        removeItem: store.removeItem,
        updateQuantity: store.updateQuantity,
        clearCart: store.clearCart,
        toggleCart: store.toggleCart,

        // Вспомогательные методы
        increaseQuantity,
        decreaseQuantity,
        isInCart,
        getItemQuantity,

        // Рассчитанные значения
        deliveryPrice: store.getDeliveryPrice(),
        totalWithDelivery: store.getTotalWithDelivery(),
        freeDeliveryThreshold: store.freeDeliveryThreshold,
        hasFreeDelivery: store.totalPrice >= store.freeDeliveryThreshold
    }
}