import { useEffect } from 'react'
import { DashboardSidebar } from './components/Sidebar'
import { useOrdersStore } from '@/store/orders.store'
import { useAuthStore } from '@/store/auth.store'
import { OrderCard } from './components/OrderCard'
import { Package, Filter, Calendar } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button' // Импортируем ButtonLink


export default function OrdersPage() {
    const { user } = useAuthStore()
    const { orders, isLoading, fetchOrders } = useOrdersStore()

    useEffect(() => {
        if (user) {
            fetchOrders()
        }
    }, [user, fetchOrders])

    

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <h1 className="text-2xl font-bold mb-4">Войдите в аккаунт</h1>
                <ButtonLink href="/login"> {/* Используем ButtonLink вместо Button с asChild */}
                    Войти
                </ButtonLink>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex flex-col md:flex-row">
                <DashboardSidebar />

                <div className="flex-1 p-4 md:p-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">Мои заказы</h1>
                            <p className="text-gray-600 mt-2">
                                История всех ваших заказов в HarvestHub
                            </p>
                        </div>

                        {/* Фильтры */}
                        <div className="bg-white border rounded-xl p-4 mb-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-gray-400" />
                                    <span className="font-medium">{orders.length} заказ{getPluralEnding(orders.length)}</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <select className="border rounded-lg px-3 py-2 text-sm">
                                            <option>За все время</option>
                                            <option>За последний месяц</option>
                                            <option>За последние 3 месяца</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-gray-400" />
                                        <select className="border rounded-lg px-3 py-2 text-sm">
                                            <option>Все статусы</option>
                                            <option>Ожидает подтверждения</option>
                                            <option>В обработке</option>
                                            <option>В пути</option>
                                            <option>Доставлен</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Список заказов */}
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                                    <p className="mt-4 text-gray-600">Загрузка заказов...</p>
                                </div>
                            </div>
                        ) : orders.length > 0 ? (
                            <div className="space-y-4">
                                {orders.map((order) => (
                                    <OrderCard key={order.orderId} order={order} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white border rounded-xl p-12 text-center">
                                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Заказов пока нет</h3>
                                <p className="text-gray-600 mb-6">
                                    Сделайте свой первый заказ и он появится здесь
                                </p>
                                <ButtonLink href="/products"> {/* Используем ButtonLink */}
                                    Перейти в каталог
                                </ButtonLink>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
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