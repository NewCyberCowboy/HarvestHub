import { useCartStore } from '@/store/cart.store'
import { Truck, Shield, Package } from 'lucide-react'

export function OrderReview() {
    const { items, totalPrice, getDeliveryPrice, totalItems } = useCartStore()

    const deliveryPrice = getDeliveryPrice()
    const totalWithDelivery = totalPrice + deliveryPrice

    if (items.length === 0) {
        return (
            <div className="bg-white border rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">Ваш заказ</h3>
                <p className="text-gray-500">Корзина пуста</p>
            </div>
        )
    }

    return (
        <div className="bg-white border rounded-xl p-6 sticky top-6">
            <h3 className="text-lg font-bold mb-6">Ваш заказ</h3>

            {/* Список товаров */}
            <div className="space-y-4 mb-6">
                <div className="max-h-60 overflow-y-auto pr-2">
                    {items.map((item) => (
                        <div key={item.productId} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                    {item.product.images?.[0] && (
                                        <img
                                            src={item.product.images[0]}
                                            alt={item.product.name}
                                            className="w-12 h-12 object-cover rounded"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{item.product.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {item.quantity} {formatUnit(item.product.unit)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="font-medium">
                                    {((item.product.discountPrice || item.product.price) * item.quantity).toFixed(2)} ₽
                                </p>
                                {item.product.discountPrice && (
                                    <p className="text-sm text-gray-400 line-through">
                                        {(item.product.price * item.quantity).toFixed(2)} ₽
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Итоги */}
            <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                    <span className="text-gray-600">Товары ({totalItems})</span>
                    <span className="font-medium">{totalPrice.toFixed(2)} ₽</span>
                </div>

                <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Доставка</span>
                    </div>
                    <div>
                        {deliveryPrice === 0 ? (
                            <span className="text-green-600 font-medium">Бесплатно</span>
                        ) : (
                            <span className="font-medium">{deliveryPrice} ₽</span>
                        )}
                    </div>
                </div>

                <div className="border-t pt-3">
                    <div className="flex justify-between font-bold text-lg">
                        <span>Итого к оплате</span>
                        <span>{totalWithDelivery.toFixed(2)} ₽</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        Включая НДС
                    </p>
                </div>
            </div>

            {/* Гарантии */}
            <div className="space-y-4 pt-6 border-t">
                <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-gray-900">Фермерская гарантия</p>
                        <p className="text-xs text-gray-600">Все товары собираются в день доставки</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-gray-900">Свежесть и качество</p>
                        <p className="text-xs text-gray-600">Если что-то не понравится — вернем деньги</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function formatUnit(unit?: string): string {
    if (!unit) return 'кг'

    switch (unit.toLowerCase()) {
        case 'kg': return 'кг'
        case 'g': return 'г'
        case 'piece': return 'кг'
        case 'liter': return 'л'
        default: return unit || 'кг'
    }
}