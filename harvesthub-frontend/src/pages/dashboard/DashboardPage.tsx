import { useEffect } from 'react'
import { DashboardSidebar } from './components/Sidebar'
import { useOrdersStore } from '@/store/orders.store'
import { useAuthStore } from '@/store/auth.store'
import { OrderCard } from './components/OrderCard'
import {
    Package,
    ShoppingCart,
    Star,
    TrendingUp,
    Calendar,
    ChevronRight
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
    const { user } = useAuthStore()
    const { orders, fetchOrders } = useOrdersStore()

    useEffect(() => {
        if (user) {
            fetchOrders()
        }
    }, [user, fetchOrders])

    const recentOrders = orders.slice(0, 3)
    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0)

    const stats = [
        { icon: Package, label: 'Всего заказов', value: orders.length },
        {
            icon: ShoppingCart, label: 'Товаров куплено', value: orders.reduce((sum, order) =>
                sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)
        },
        { icon: TrendingUp, label: 'Всего потрачено', value: `${totalSpent.toFixed(2)} ₽` },
        {
            icon: Star, label: 'Средний чек', value: orders.length > 0
                ? `${(totalSpent / orders.length).toFixed(2)} ₽`
                : '0 ₽'
        },
    ]

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <h1 className="text-2xl font-bold mb-4">Войдите в аккаунт</h1>
                <Link to="/login" className="text-blue-600 hover:underline">
                    Войти
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex flex-col md:flex-row">
                {/* Сайдбар */}
                <DashboardSidebar />

                {/* Основной контент */}
                <div className="flex-1 p-4 md:p-8">
                    <div className="max-w-6xl mx-auto">
                        {/* Приветствие */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">
                                Добро пожаловать, {user.firstName}!
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Здесь вы можете управлять заказами, настройками профиля и адресами доставки.
                            </p>
                        </div>

                        {/* Статистика */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {stats.map((stat, index) => {
                                const Icon = stat.icon
                                return (
                                    <div
                                        key={index}
                                        className="bg-white border rounded-xl p-6"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-green-50 rounded-lg">
                                                <Icon className="h-5 w-5 text-green-600" />
                                            </div>
                                            <span className="text-sm text-gray-600">{stat.label}</span>
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {stat.value}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                            {/* Последние заказы */}
                            <div className="lg:col-span-2">
                                <div className="bg-white border rounded-xl p-6 mb-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-gray-900">Последние заказы</h2>
                                        <Link
                                            to="/dashboard/orders"
                                            className="flex items-center gap-1 text-green-600 hover:text-green-700 text-sm font-medium"
                                        >
                                            Все заказы
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </div>

                                    {recentOrders.length > 0 ? (
                                        <div className="space-y-4">
                                            {recentOrders.map((order) => (
                                                <OrderCard key={order.orderId} order={order} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-600 mb-4">У вас пока нет заказов</p>
                                            <Link
                                                to="/products"
                                                className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                                            >
                                                <ShoppingCart className="h-4 w-4" />
                                                Сделать первый заказ
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                {/* Быстрые действия */}
                                <div className="bg-white border rounded-xl p-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Быстрые действия</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Link
                                            to="/products?category=vegetables"
                                            className="p-4 border rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="text-2xl">🥦</div>
                                                <div>
                                                    <h3 className="font-medium text-gray-900">Свежие овощи</h3>
                                                    <p className="text-sm text-gray-600">Сезонный урожай</p>
                                                </div>
                                            </div>
                                        </Link>

                                        <Link
                                            to="/dashboard/addresses"
                                            className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="text-2xl">🏠</div>
                                                <div>
                                                    <h3 className="font-medium text-gray-900">Адреса доставки</h3>
                                                    <p className="text-sm text-gray-600">Управление адресами</p>
                                                </div>
                                            </div>
                                        </Link>

                                        <Link
                                            to="/dashboard/profile"
                                            className="p-4 border rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="text-2xl">👤</div>
                                                <div>
                                                    <h3 className="font-medium text-gray-900">Профиль</h3>
                                                    <p className="text-sm text-gray-600">Личные данные</p>
                                                </div>
                                            </div>
                                        </Link>

                                        <Link
                                            to="/products?sort=popular"
                                            className="p-4 border rounded-lg hover:bg-yellow-50 hover:border-yellow-300 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="text-2xl">🔥</div>
                                                <div>
                                                    <h3 className="font-medium text-gray-900">Популярное</h3>
                                                    <p className="text-sm text-gray-600">Что покупают другие</p>
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Правая колонка */}
                            <div className="space-y-6">
                                {/* Предстоящая доставка */}
                                <div className="bg-white border rounded-xl p-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-blue-500" />
                                        Предстоящая доставка
                                    </h2>

                                    {orders.some(o => o.status === 'shipped' || o.status === 'processing') ? (
                                        <div className="space-y-4">
                                            {orders
                                                .filter(o => o.status === 'shipped' || o.status === 'processing')
                                                .slice(0, 2)
                                                .map((order) => (
                                                    <div key={order.orderId} className="p-4 bg-blue-50 rounded-lg">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-medium text-blue-900">
                                                                Заказ #{order.orderNumber}
                                                            </span>
                                                            <span className="text-sm text-blue-700">
                                                                {formatDeliveryDate(order.createdAt)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-blue-800">
                                                            Статус: {order.status === 'shipped' ? 'В пути' : 'Обрабатывается'}
                                                        </p>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-gray-600">Нет предстоящих доставок</p>
                                        </div>
                                    )}
                                </div>

                                {/* Избранное */}
                                <div className="bg-white border rounded-xl p-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <Star className="h-5 w-5 text-yellow-500" />
                                        Избранное
                                    </h2>
                                    <div className="text-center py-4">
                                        <p className="text-gray-600 mb-4">Вы еще ничего не добавили в избранное</p>
                                        <Link
                                            to="/products"
                                            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700"
                                        >
                                            Перейти в каталог
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>

                                {/* Контакты поддержки */}
                                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-100 rounded-xl p-6">
                                    <h3 className="font-bold text-gray-900 mb-3">Нужна помощь?</h3>
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-700">
                                            Мы всегда готовы помочь с вашим заказом
                                        </p>
                                        <a
                                            href="tel:+78001234567"
                                            className="block text-green-600 font-medium hover:text-green-700"
                                        >
                                            8 (800) 123-45-67
                                        </a>
                                        <p className="text-xs text-gray-600">
                                            Ежедневно с 9:00 до 21:00
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function formatDeliveryDate(dateString: string): string {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
        return 'Сегодня'
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Завтра'
    } else {
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    }
}