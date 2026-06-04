import { OrderDto } from '@/types/backend'
import { Package, Truck, CheckCircle, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

interface OrderCardProps {
    order: OrderDto
}

export function OrderCard({ order }: OrderCardProps) {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'delivered':
                return <CheckCircle className="h-5 w-5 text-green-500" />
            case 'shipped':
            case 'processing':
                return <Truck className="h-5 w-5 text-blue-500" />
            default:
                return <Clock className="h-5 w-5 text-yellow-500" />
        }
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            pending: 'Ожидает подтверждения',
            confirmed: 'Подтвержден',
            processing: 'В обработке',
            shipped: 'В пути',
            delivered: 'Доставлен',
            cancelled: 'Отменен',
        }
        return labels[status] || status
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
        })
    }

    return (
        <Link
            to={`/dashboard/orders/${order.orderId}`}
            className="block bg-white border rounded-xl p-6 hover:shadow-md transition-shadow"
        >
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="font-bold text-gray-900">Заказ #{order.orderNumber}</h3>
                    <p className="text-sm text-gray-500">от {formatDate(order.createdAt)}</p>
                </div>

                <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    <span className="text-sm font-medium">{getStatusLabel(order.status)}</span>
                </div>
            </div>

            <div className="space-y-3">
                {/* Товары */}
                <div className="flex items-center gap-2 text-gray-600">
                    <Package className="h-4 w-4" />
                    <span className="text-sm">
                        {order.items.length} товар{getPluralEnding(order.items.length)}
                    </span>
                </div>

                {/* Адрес */}
                <div className="text-sm text-gray-600">
                    <p className="truncate">
                        {order.deliveryAddress}
                    </p>
                </div>

                {/* Сумма */}
                <div className="flex justify-between items-center pt-3 border-t">
                    <div className="text-sm text-gray-500">
                    </div>
                    <div className="font-bold text-lg">{order.totalAmount.toFixed(2)} ₽</div>
                </div>
            </div>
        </Link>
    )
}

function getPluralEnding(count: number): string {
    const lastDigit = count % 10
    const lastTwoDigits = count % 100

    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'ов'
    if (lastDigit === 1) return ''
    if (lastDigit >= 2 && lastDigit <= 4) return 'а'
    return 'ов'
}