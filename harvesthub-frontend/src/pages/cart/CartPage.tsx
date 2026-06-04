import { Link } from 'react-router-dom'
import { useCartStore } from '@/store/cart.store'
import { CartItem } from '@/components/cart/CartItem'
import {
    ArrowLeft,
    ShoppingBag,
    Truck,
    Shield,
    CreditCard,
    AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function CartPage() {
    const {
        items,
        totalPrice,
        totalItems,
        deliveryCost,
        freeDeliveryThreshold,
        updateQuantity,
        removeItem,
        clearCart
    } = useCartStore()

    const handleClearCart = () => {
        if (window.confirm('Вы уверены, что хотите очистить корзину?')) {
            clearCart()
        }
    }

    const handleUpdateQuantity = (productId: string, quantity: number) => {
        updateQuantity(productId, quantity)
    }

    const deliveryPrice = totalPrice >= freeDeliveryThreshold ? 0 : deliveryCost
    const totalWithDelivery = totalPrice + deliveryPrice
    const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - totalPrice)

    if (totalItems === 0) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-md mx-auto text-center">
                    <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
                        <ShoppingBag className="w-16 h-16 text-gray-400" />
                    </div>
                    <h1 className="text-3xl font-bold mb-4">Корзина пуста</h1>
                    <p className="text-gray-600 mb-8 text-lg">
                        Здесь пока ничего нет. Добавьте товары из каталога!
                    </p>
                    <div className="space-y-4">
                        <Link to="/products">
                            <Button size="lg" className="w-full">
                                <ArrowLeft className="mr-2 h-5 w-5" />
                                Вернуться к покупкам
                            </Button>
                        </Link>
                        <Link to="/farmers">
                            <Button variant="outline" size="lg" className="w-full">
                                Посмотреть фермеров
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
                {/* Заголовок */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Корзина</h1>
                        <p className="text-gray-600 mt-2">
                            {totalItems} {getWordForm(totalItems)} на сумму {totalPrice.toFixed(2)} ₽
                        </p>
                    </div>
                    <button
                        onClick={handleClearCart}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                        Очистить корзину
                    </button>
                </div>

                <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                    {/* Левая колонка - Товары */}
                    <div className="lg:col-span-2">
                        {/* Хедер списка товаров */}
                        <div className="hidden md:grid grid-cols-12 gap-4 mb-4 px-4 text-sm font-medium text-gray-500">
                            <div className="col-span-6">Товар</div>
                            <div className="col-span-3 text-center">Количество</div>
                            <div className="col-span-3 text-right">Сумма</div>
                        </div>

                        {/* Список товаров */}
                        <div className="bg-white rounded-xl border divide-y">
                            {items.map((item) => (
                                <CartItem
                                    key={item.productId}
                                    item={item}
                                    onUpdateQuantity={handleUpdateQuantity}
                                    onRemove={removeItem}
                                />
                            ))}
                        </div>

                        {/* Кнопка продолжения покупок */}
                        <div className="mt-6">
                            <Link to="/products">
                                <Button variant="outline" className="w-full md:w-auto">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Продолжить покупки
                                </Button>
                            </Link>
                        </div>

                        {/* Информация о фермере */}
                        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6">
                            <h3 className="font-bold text-lg text-gray-900 mb-3">Информация от фермера</h3>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-gray-700">
                                            Все товары в вашей корзине от одного фермера. Это обеспечивает свежесть и качество продуктов.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Truck className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-gray-700">
                                            Доставка осуществляется собственной службой фермера. Вы получите все товары в одной поставке.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Правая колонка - Итоги */}
                    <div className="mt-8 lg:mt-0">
                        <div className="bg-white border rounded-xl p-6 sticky top-6">
                            <h3 className="font-bold text-xl text-gray-900 mb-6">Ваш заказ</h3>

                            {/* Промежуточные итоги */}
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Товары ({totalItems})</span>
                                    <span className="font-medium">{totalPrice.toFixed(2)} ₽</span>
                                </div>

                                {/* Доставка */}
                                <div className="flex justify-between items-center">
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

                                {/* Прогресс бесплатной доставки */}
                                {deliveryPrice > 0 && (
                                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-100 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-green-800">
                                                До бесплатной доставки
                                            </span>
                                            <span className="text-sm font-bold text-green-800">
                                                {remainingForFreeDelivery.toFixed(2)} ₽
                                            </span>
                                        </div>
                                        <div className="w-full bg-green-200 rounded-full h-2">
                                            <div
                                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                                style={{
                                                    width: `${Math.min((totalPrice / freeDeliveryThreshold) * 100, 100)}%`
                                                }}
                                            />
                                        </div>
                                        <p className="text-xs text-green-700 mt-2">
                                            Добавьте товаров на {remainingForFreeDelivery.toFixed(2)} ₽ для бесплатной доставки!
                                        </p>
                                    </div>
                                )}

                                {/* Итого */}
                                <div className="border-t pt-4">
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Итого к оплате</span>
                                        <span>{totalWithDelivery.toFixed(2)} ₽</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Включая НДС
                                    </p>
                                </div>
                            </div>

                            {/* Гарантии */}
                            <div className="mt-6 space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Shield className="h-5 w-5 text-green-500 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Гарантия свежести</p>
                                        <p className="text-xs text-gray-600">Все товары собираются в день доставки</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <CreditCard className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Удобная оплата</p>
                                        <p className="text-xs text-gray-600">Картой онлайн или наличными при получении</p>
                                    </div>
                                </div>
                            </div>

                            {/* Кнопка оформления */}
                            <Link to="/checkout" className="block mt-6">
                                <Button size="lg" className="w-full">
                                    Перейти к оформлению
                                </Button>
                            </Link>

                            {/* Дополнительная информация */}
                            <div className="mt-6 text-center">
                                <p className="text-xs text-gray-500">
                                    Нажимая на кнопку, вы соглашаетесь с{' '}
                                    <Link to="/terms" className="text-blue-600 hover:underline">
                                        условиями обработки данных
                                    </Link>
                                </p>
                            </div>
                        </div>

                        {/* Промокод */}
                        <div className="mt-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-100 rounded-xl p-4">
                            <h4 className="font-bold text-gray-900 mb-2">Есть промокод?</h4>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Введите промокод"
                                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <Button variant="outline" className="whitespace-nowrap">
                                    Применить
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Вспомогательная функция для склонения слова "товар"
function getWordForm(count: number): string {
    const lastDigit = count % 10
    const lastTwoDigits = count % 100

    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'товаров'
    if (lastDigit === 1) return 'товар'
    if (lastDigit >= 2 && lastDigit <= 4) return 'товара'
    return 'товаров'
}