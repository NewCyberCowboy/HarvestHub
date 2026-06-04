import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ordersApi } from '@/api/orders.api'
import { OrderDto } from '@/types/backend'
import { DashboardSidebar } from './components/Sidebar'
import { useAuthStore } from '@/store/auth.store'
import { ReviewForm } from '@/components/products/ReviewForm'
import { reviewsApi } from '@/api/reviews.api'
import { 
    Package, 
    Home, 
    Clock, 
    ArrowLeft, 
    CheckCircle, 
    Truck, 
    XCircle,
    Loader2,
    AlertCircle,
    Star
} from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ButtonLink } from '@/components/ui/Button'

export default function OrderDetailPage() {
    const { orderId } = useParams<{ orderId: string }>()
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [order, setOrder] = useState<OrderDto | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedProductForReview, setSelectedProductForReview] = useState<number | null>(null)

    useEffect(() => {
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
                const orderData = await ordersApi.getOrderById(parsedOrderId)
                setOrder(orderData)
            } catch (err) {
                console.error('Ошибка загрузки заказа:', err)
                setError(err instanceof Error ? err.message : 'Не удалось загрузить заказ')
            } finally {
                setIsLoading(false)
            }
        }

        fetchOrder()
    }, [orderId])

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'delivered':
            case 'completed':
                return <CheckCircle className="h-5 w-5 text-green-500" />
            case 'shipped':
                return <Truck className="h-5 w-5 text-blue-500" />
            case 'cancelled':
                return <XCircle className="h-5 w-5 text-red-500" />
            default:
                return <Package className="h-5 w-5 text-yellow-500" />
        }
    }

    const getStatusColor = (status: string): string => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            case 'confirmed':
                return 'bg-blue-100 text-blue-800'
            case 'processing':
                return 'bg-purple-100 text-purple-800'
            case 'shipped':
                return 'bg-indigo-100 text-indigo-800'
            case 'delivered':
            case 'completed':
                return 'bg-green-100 text-green-800'
            case 'cancelled':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusText = (status: string): string => {
        const labels: Record<string, string> = {
            pending: 'Ожидает подтверждения',
            confirmed: 'Подтвержден',
            processing: 'В обработке',
            shipped: 'Отправлен',
            delivered: 'Доставлен',
            completed: 'Завершен',
            cancelled: 'Отменен',
        }
        return labels[status.toLowerCase()] || status
    }

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <h1 className="text-2xl font-bold mb-4">Войдите в аккаунт</h1>
                <ButtonLink href="/login">Войти</ButtonLink>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="flex flex-col md:flex-row">
                    <DashboardSidebar />
                    <div className="flex-1 p-4 md:p-8 flex items-center justify-center">
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
                            <p className="text-gray-600">Загрузка заказа...</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="flex flex-col md:flex-row">
                    <DashboardSidebar />
                    <div className="flex-1 p-4 md:p-8">
                        <div className="max-w-2xl mx-auto">
                            <div className="bg-white border rounded-xl p-8 text-center">
                                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Ошибка загрузки заказа</h2>
                                <p className="text-gray-600 mb-6">{error || 'Заказ не найден'}</p>
                                <ButtonLink href="/dashboard/orders">Вернуться к заказам</ButtonLink>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex flex-col md:flex-row">
                <DashboardSidebar />

                <div className="flex-1 p-4 md:p-8">
                    <div className="max-w-4xl mx-auto">
                        {/* Заголовок */}
                        <div className="mb-6">
                            <button
                                onClick={() => navigate('/dashboard/orders')}
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span>Вернуться к заказам</span>
                            </button>
                            <h1 className="text-3xl font-bold text-gray-900">Заказ #{order.orderNumber}</h1>
                            <p className="text-gray-600 mt-2">
                                от {format(new Date(order.createdAt), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                            </p>
                        </div>

                        {/* Статус заказа */}
                        <div className="bg-white border rounded-xl p-6 mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(order.status)}
                                    <div>
                                        <p className="text-sm text-gray-500">Статус заказа</p>
                                        <p className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${getStatusColor(order.status)}`}>
                                            {getStatusText(order.status)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Сумма заказа</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        {order.totalAmount.toFixed(2)} ₽
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* История статусов */}
                        {order.statusHistory && order.statusHistory.length > 0 && (
                            <div className="bg-white border rounded-xl p-6 mb-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">История статусов</h2>
                                <div className="space-y-4">
                                    {order.statusHistory.map((history, index) => (
                                        <div key={index} className="flex items-start gap-4">
                                            <div className="flex-shrink-0 mt-1">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">
                                                    {getStatusText(history.status)}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {format(new Date(history.changedAt), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                                                </p>
                                                {history.notes && (
                                                    <p className="text-sm text-gray-600 mt-1">{history.notes}</p>
                                                )}
                                                {history.changedBy && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Изменено: {history.changedBy}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Детали заказа */}
                        <div className="bg-white border rounded-xl p-6 mb-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-6">Детали заказа</h2>

                            <div className="space-y-6">
                                {/* Адрес доставки */}
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
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

                                {/* Дата создания */}
                                <div>
                                    <div className="flex items-center gap-3">
                                        <Clock className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <h3 className="font-medium text-gray-900">Дата оформления</h3>
                                            <p className="text-gray-600">
                                                {format(new Date(order.createdAt), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Состав заказа */}
                        <div className="bg-white border rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <Package className="h-5 w-5 text-gray-400" />
                                <h2 className="text-lg font-bold text-gray-900">Состав заказа</h2>
                            </div>

                            <div className="space-y-4">
                                {order.items.map((item, index) => (
                                    <div key={index} className="flex justify-between items-start pb-4 border-b last:border-0">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    to={`/products/${item.productId}`}
                                                    className="font-medium text-gray-900 hover:text-green-600 transition-colors"
                                                >
                                                    {item.productName || `Товар #${item.productId}`}
                                                </Link>
                                                {/* Кнопка для отзыва, если заказ доставлен */}
                                                {order.status.toLowerCase() === 'delivered' && (
                                                    <button
                                                        onClick={() => setSelectedProductForReview(
                                                            selectedProductForReview === item.productId ? null : item.productId
                                                        )}
                                                        className="flex items-center gap-1 px-2 py-1 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                                                        title="Оставить отзыв"
                                                    >
                                                        <Star className="h-4 w-4" />
                                                        {selectedProductForReview === item.productId ? 'Скрыть форму' : 'Оставить отзыв'}
                                                    </button>
                                                )}
                                            </div>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {item.expectedWeight ? `${item.expectedWeight} кг` : `${item.quantity} ${item.product?.unit || 'кг'}`} × {item.price?.toFixed(2) || '0.00'} ₽/кг
                                                </p>
                                            {/* Форма отзыва для этого продукта */}
                                            {selectedProductForReview === item.productId && order.status.toLowerCase() === 'delivered' && (
                                                <div className="mt-4">
                                                    <ReviewForm
                                                        productId={item.productId}
                                                        orderId={order.orderId}
                                                        onSuccess={() => {
                                                            setSelectedProductForReview(null)
                                                            // Можно показать уведомление об успехе
                                                        }}
                                                        onCancel={() => setSelectedProductForReview(null)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <p className="font-medium text-gray-900">
                                            {((item.quantity) * (item.price || 0)).toFixed(2)} ₽
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Итого */}
                            <div className="mt-6 pt-6 border-t">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-medium text-gray-900">Итого:</span>
                                    <span className="text-2xl font-bold text-gray-900">
                                        {order.totalAmount.toFixed(2)} ₽
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

