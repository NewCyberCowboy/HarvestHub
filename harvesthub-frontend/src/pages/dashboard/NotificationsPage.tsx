import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { toast } from 'react-hot-toast'
import {
    Bell,
    BellOff,
    CheckCircle,
    ChevronRight,
    ShoppingCart,
    Package,
    Truck,
    AlertCircle,
    Tag,
    MessageSquare,
    Scale,
} from 'lucide-react'
import { notificationsApi, Notification } from '@/api/notifications.api'

export default function NotificationsPage() {
    const navigate = useNavigate()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadNotifications()
    }, [])

    const loadNotifications = async () => {
        try {
            setLoading(true)
            const data = await notificationsApi.getNotifications()
            setNotifications(data)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось загрузить уведомления')
        } finally {
            setLoading(false)
        }
    }

    const markAsRead = async (id: number) => {
        try {
            await notificationsApi.markAsRead(id)
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            )
        } catch (err) {
            console.error('Failed to mark as read:', err)
        }
    }

    const markAllAsRead = async () => {
        try {
            await notificationsApi.markAllAsRead()
            setNotifications(prev =>
                prev.map(n => ({ ...n, isRead: true }))
            )
            toast.success('Все уведомления отмечены как прочитанные')
        } catch (err) {
            console.error('Failed to mark all as read:', err)
            toast.error('Не удалось отметить все уведомления')
        }
    }

    const getNotificationIcon = (type: string) => {
        const icons: Record<string, React.ReactNode> = {
            'new_order': <ShoppingCart className="w-5 h-5" />,
            'order_status_changed': <Package className="w-5 h-5" />,
            'order_delivered': <CheckCircle className="w-5 h-5" />,
            'order_cancelled': <AlertCircle className="w-5 h-5" />,
            'product_available': <CheckCircle className="w-5 h-5" />,
            'product_out_of_stock': <AlertCircle className="w-5 h-5" />,
            'price_changed': <Tag className="w-5 h-5" />,
            'farmer_response': <MessageSquare className="w-5 h-5" />,
            'weight_updated': <Scale className="w-5 h-5" />,
            'delivery_update': <Truck className="w-5 h-5" />,
        }
        return icons[type] || <Bell className="w-5 h-5" />
    }

    const getNotificationColor = (type: string) => {
        const colors: Record<string, string> = {
            'new_order': 'bg-emerald-100 text-emerald-700',
            'order_status_changed': 'bg-sky-100 text-sky-700',
            'order_delivered': 'bg-green-100 text-green-700',
            'order_cancelled': 'bg-red-100 text-red-700',
            'product_available': 'bg-emerald-100 text-emerald-700',
            'product_out_of_stock': 'bg-amber-100 text-amber-700',
            'price_changed': 'bg-purple-100 text-purple-700',
            'farmer_response': 'bg-blue-100 text-blue-700',
            'weight_updated': 'bg-teal-100 text-teal-700',
            'delivery_update': 'bg-orange-100 text-orange-700',
        }
        return colors[type] || 'bg-stone-100 text-stone-700'
    }

    const unreadCount = notifications.filter(n => !n.isRead).length

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Уведомления</h1>
                    <p className="text-stone-500 mt-1">
                        {unreadCount > 0 && `${unreadCount} непрочитанных`}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
                    >
                        Прочитать все
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
                </div>
            ) : error ? (
                <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-500">{error}</p>
                </div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-12">
                    <BellOff className="w-12 h-12 text-stone-400 mx-auto mb-4" />
                    <p className="text-stone-500">Уведомлений пока нет</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() => {
                                if (!notification.isRead) {
                                    markAsRead(notification.id)
                                }
                                if (notification.data?.orderId) {
                                    navigate(`/dashboard/orders/${notification.data.orderId}`)
                                }
                            }}
                            className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${!notification.isRead
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-white border-stone-200'
                                }`}
                        >
                            <div className={`p-3 rounded-full ${getNotificationColor(notification.type)}`}>
                                {getNotificationIcon(notification.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className={`font-semibold ${!notification.isRead ? 'text-stone-900' : 'text-stone-700'
                                        }`}>
                                        {notification.title}
                                    </h3>
                                    {!notification.isRead && (
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-2" />
                                    )}
                                </div>
                                <p className="text-stone-600 text-sm mt-1 line-clamp-2">
                                    {notification.body}
                                </p>
                                <p className="text-stone-400 text-xs mt-2">
                                    {format(new Date(notification.createdAt), 'dd MMM yyyy, HH:mm', { locale: ru })}
                                </p>
                            </div>

                            <ChevronRight className="w-5 h-5 text-stone-400 flex-shrink-0 mt-1" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
