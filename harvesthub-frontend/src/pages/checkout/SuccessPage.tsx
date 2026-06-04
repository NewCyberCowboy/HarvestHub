// src/pages/checkout/SuccessPage.tsx - обновленная версия
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ordersApi } from '@/api/orders.api'
import { OrderDto } from '@/types/backend'
import { CheckCircle, Package, Home, Clock, AlertCircle } from 'lucide-react'

export default function CheckoutSuccessPage() {
    const { orderId } = useParams<{ orderId: string }>()
    const [order, setOrder] = useState<OrderDto | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Проверяем наличие orderId перед выполнением
        if (!orderId) {
            setError('ID заказа не указан')
            setIsLoading(false)
            return
        }

        const parsedOrderId = parseInt(orderId, 10)
        if (isNaN(parsedOrderId)) {
            setError('Неверный ID заказа')
            setIsLoading(false)
            return
        }

        const fetchOrder = async () => {
            try {
                setIsLoading(true)
                setError(null)
                console.log('🔄 Загружаем реальный заказ ID:', parsedOrderId)

                // Получаем реальный заказ из API
                const orderData = await ordersApi.getOrderById(parsedOrderId)
                console.log('✅ Реальный заказ получен:', orderData)

                setOrder(orderData)
            } catch (err) {
                console.error('❌ Ошибка загрузки реального заказа:', err)
                setError(`Не удалось загрузить заказ: ${(err as Error).message}`)
            } finally {
                setIsLoading(false)
            }
        }

        fetchOrder()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]) // orderId всегда будет строкой или undefined, поэтому зависимость стабильна

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Загрузка информации о заказе...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Предупреждение об ошибке */}
                    {error && (
                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-yellow-800 font-medium">Информация</p>
                                    <p className="text-yellow-700 text-sm mt-1">
                                        {error}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Заголовок успеха */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            Заказ успешно оформлен!
                        </h1>
                        <p className="text-gray-600 text-lg">
                            Спасибо за ваш заказ. Мы уже начали его обрабатывать.
                        </p>
                        {order && (
                            <p className="text-gray-500 mt-2">
                                Номер заказа: <span className="font-bold">{order.orderNumber}</span>
                            </p>
                        )}
                    </div>

                    {/* Информация о заказе */}
                    {order && (
                        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                            <h2 className="text-xl font-bold mb-6">Детали заказа</h2>

                            <div className="space-y-6">
                                {/* Статус и сумма */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-2">
                                            Статус заказа
                                        </h3>
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                            {getStatusText(order.status)}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-2">
                                            Сумма заказа
                                        </h3>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {order.totalAmount.toFixed(2)} ₽
                                        </p>
                                    </div>
                                </div>

                                {/* Адрес доставки */}
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <Home className="h-5 w-5 text-gray-400" />
                                        <h3 className="font-medium text-gray-900">Адрес доставки</h3>
                                    </div>
                                    <p className="text-gray-700 pl-8">{order.deliveryAddress}</p>
                                </div>

                                {/* Комментарий */}
                                {order.customerNotes && (
                                    <div>
                                        <h3 className="font-medium text-gray-900 mb-2">Комментарий к заказу</h3>
                                        <p className="text-gray-600">{order.customerNotes}</p>
                                    </div>
                                )}

                                {/* Товары */}
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <Package className="h-5 w-5 text-gray-400" />
                                        <h3 className="font-medium text-gray-900">Состав заказа</h3>
                                    </div>
                                    <div className="space-y-3 pl-8">
                                        {order.items.map((item, index) => (
                                            <div key={index} className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {item.productName || `Товар #${item.productId}`}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {item.expectedWeight ? `${item.expectedWeight} кг` : `${item.quantity} ${item.product?.unit || 'кг'}`} × {item.price?.toFixed(2) || '0.00'} ₽/кг
                                                    </p>
                                                </div>
                                                <p className="font-medium text-gray-900">
                                                    {((item.quantity) * (item.price || 0)).toFixed(2)} ₽
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Дата создания */}
                                <div>
                                    <div className="flex items-center gap-3">
                                        <Clock className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <h3 className="font-medium text-gray-900">Дата оформления</h3>
                                            <p className="text-gray-600">
                                                {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Действия */}
                    <div className="text-center">
                        <div className="mb-6">
                            <p className="text-gray-600 mb-4">
                                Подтверждение заказа отправлено на вашу электронную почту.
                                Мы свяжемся с вами для подтверждения заказа.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                На главную
                            </Link>
                            <Link
                                to="/products"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                            >
                                Продолжить покупки
                            </Link>
                        </div>

                        <div className="mt-8 text-sm text-gray-500">
                            <p className="mb-2">
                                Есть вопросы по заказу?
                            </p>
                            <p>
                                Звоните: <span className="font-medium text-gray-900">8 (800) 123-45-67</span>
                                {' '}или пишите: <span className="font-medium text-gray-900">support@harvesthub.ru</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Функция для создания мок данных
function createMockOrder(orderId: number): OrderDto {
    return {
        orderId: orderId,
        orderNumber: `ORD-${orderId.toString().padStart(6, '0')}`,
        totalAmount: 1525.50,
        status: 'Pending',
        deliveryAddress: 'Москва, ул. Тестовая, д. 1, кв. 1',
        customerNotes: 'Тестовый заказ',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [
            {
                productId: 7,
                quantity: 2,
                productName: 'Тестовый продукт из Swagger',
                price: 100.00
            },
            {
                productId: 8,
                quantity: 1,
                productName: 'Тестовый продукт',
                price: 100.50
            }
        ],
        statusHistory: [
            {
                status: 'Pending',
                changedAt: new Date().toISOString(),
                notes: 'Заказ создан',
                changedBy: 'Система'
            }
        ]
    }
}

function getStatusColor(status: string): string {
    switch (status) {
        case 'Pending': return 'bg-yellow-100 text-yellow-800'
        case 'Confirmed': return 'bg-blue-100 text-blue-800'
        case 'Processing': return 'bg-purple-100 text-purple-800'
        case 'Shipped': return 'bg-indigo-100 text-indigo-800'
        case 'Delivered': return 'bg-green-100 text-green-800'
        case 'Cancelled': return 'bg-red-100 text-red-800'
        default: return 'bg-gray-100 text-gray-800'
    }
}

function getStatusText(status: string): string {
    switch (status) {
        case 'Pending': return 'Ожидает подтверждения'
        case 'Confirmed': return 'Подтвержден'
        case 'Processing': return 'В обработке'
        case 'Shipped': return 'Отправлен'
        case 'Delivered': return 'Доставлен'
        case 'Cancelled': return 'Отменен'
        default: return status
    }
}