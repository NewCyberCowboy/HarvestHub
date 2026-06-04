import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react'
import { TrendingUp, BarChart3, PieChart, LineChart, Users, ShoppingCart, Wallet, Loader2 } from 'lucide-react'
import {
    ResponsiveContainer,
    LineChart as RechartsLineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    BarChart as RechartsBarChart,
    Bar,
    Legend
} from 'recharts'
import { DashboardSidebar } from './components/Sidebar'
import { useAuthStore } from '@/store/auth.store'
import { ordersApi } from '@/api/orders.api'
import type { FarmerAnalyticsDto } from '@/types/backend'

type StatCard = {
    title: string
    value: string
    icon: ComponentType<{ className?: string }>
}

export default function FarmerAnalyticsPage() {
    const { user } = useAuthStore()
    const [analytics, setAnalytics] = useState<FarmerAnalyticsDto | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadAnalytics = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const data = await ordersApi.getFarmerAnalytics(30)
            setAnalytics(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось загрузить аналитику')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadAnalytics()
    }, [loadAnalytics])

    const formatMoney = (value: number) => {
        return `₽ ${Math.round(value).toLocaleString('ru-RU')}`
    }

    const statusLabel = (status: string) => {
        const normalized = status.toLowerCase()
        const labels: Record<string, string> = {
            pending: 'Ожидает подтверждения',
            confirmed: 'Подтвержден',
            processing: 'В обработке',
            awaitingweight: 'Ожидает веса',
            readytoship: 'Готов к отправке',
            shipped: 'Отправлен',
            delivered: 'Доставлен',
            completed: 'Завершен',
            cancelled: 'Отменен'
        }
        return labels[normalized] || status
    }

    const statCards = useMemo<StatCard[]>(() => {
        if (!analytics) {
            return []
        }

        return [
            { title: `Выручка за ${analytics.periodDays} дней`, value: formatMoney(analytics.revenueTotal), icon: Wallet },
            { title: `Заказы за ${analytics.periodDays} дней`, value: analytics.ordersCount.toString(), icon: ShoppingCart },
            { title: 'Средний чек', value: formatMoney(analytics.averageOrderValue), icon: TrendingUp },
            { title: 'Новые клиенты', value: analytics.newCustomers.toString(), icon: Users },
        ]
    }, [analytics])

    const rangeLabel = useMemo(() => {
        if (!analytics) {
            return ''
        }
        const from = new Date(analytics.fromDate).toLocaleDateString('ru-RU')
        const to = new Date(analytics.toDate).toLocaleDateString('ru-RU')
        return `${from} — ${to}`
    }, [analytics])

    const lineData = useMemo(() => {
        if (!analytics) {
            return []
        }
        return analytics.revenueByDay.map((point) => ({
            date: new Date(point.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
            revenue: Math.round(point.revenue),
            orders: point.orders
        }))
    }, [analytics])

    const topProductsData = useMemo(() => {
        if (!analytics) {
            return []
        }
        return analytics.topProducts.map((item) => ({
            name: item.productName,
            revenue: Math.round(item.revenue)
        }))
    }, [analytics])

    const categoryData = useMemo(() => {
        if (!analytics) {
            return []
        }
        return analytics.categoryBreakdown.map((item) => ({
            name: item.categoryName,
            value: Math.round(item.revenue)
        }))
    }, [analytics])

    const categoryColors = ['#22c55e', '#14b8a6', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6']

    if (!user || (user.role !== 'Farmer' && user.role !== 'Admin')) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Доступ запрещен</h1>
                    <p className="text-gray-600">Эта страница доступна только для фермеров</p>
                </div>
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
                            <h1 className="text-3xl font-bold text-gray-900">Аналитика продаж</h1>
                            <p className="text-gray-600 mt-2">
                                Ключевые метрики, динамика и CRM-инсайты для фермера
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between gap-4">
                                <span>{error}</span>
                                <button
                                    onClick={loadAnalytics}
                                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Повторить
                                </button>
                            </div>
                        )}

                        {isLoading && (
                            <div className="flex items-center justify-center h-48">
                                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                            </div>
                        )}

                        {!isLoading && analytics && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                    {statCards.map((card) => {
                                        const Icon = card.icon
                                        return (
                                            <div key={card.title} className="bg-white border rounded-xl p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="text-sm text-gray-500">{card.title}</div>
                                                    <Icon className="h-5 w-5 text-green-600" />
                                                </div>
                                                <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                                                <div className="text-sm text-gray-500 mt-1">
                                                    {rangeLabel}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                    <div className="bg-white border rounded-xl p-6 lg:col-span-2">
                                        <div className="flex items-center gap-2 mb-4">
                                            <LineChart className="h-5 w-5 text-green-600" />
                                            <h2 className="text-lg font-semibold">Динамика выручки</h2>
                                        </div>
                                        {lineData.length === 0 ? (
                                            <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                                                Нет данных за период
                                            </div>
                                        ) : (
                                            <div className="h-64">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RechartsLineChart data={lineData}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="date" />
                                                        <YAxis />
                                                        <Tooltip formatter={(value: number) => formatMoney(value)} />
                                                        <Legend />
                                                        <Line type="monotone" dataKey="revenue" name="Выручка" stroke="#22c55e" strokeWidth={2} dot={false} />
                                                        <Line type="monotone" dataKey="orders" name="Заказы" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                                                    </RechartsLineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-white border rounded-xl p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <PieChart className="h-5 w-5 text-green-600" />
                                            <h2 className="text-lg font-semibold">Категории продаж</h2>
                                        </div>
                                        {categoryData.length === 0 ? (
                                            <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                                                Нет данных по категориям
                                            </div>
                                        ) : (
                                            <div className="h-64">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RechartsPieChart>
                                                        <Pie
                                                            data={categoryData}
                                                            dataKey="value"
                                                            nameKey="name"
                                                            innerRadius={45}
                                                            outerRadius={80}
                                                            paddingAngle={2}
                                                        >
                                                            {categoryData.map((_, index) => (
                                                                <Cell key={index} fill={categoryColors[index % categoryColors.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip formatter={(value: number) => formatMoney(value)} />
                                                    </RechartsPieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                    <div className="bg-white border rounded-xl p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <BarChart3 className="h-5 w-5 text-green-600" />
                                            <h2 className="text-lg font-semibold">Топ продуктов</h2>
                                        </div>
                                        {topProductsData.length === 0 ? (
                                            <div className="text-sm text-gray-500">Нет данных</div>
                                        ) : (
                                            <div className="h-64">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RechartsBarChart data={topProductsData} layout="vertical" margin={{ left: 24 }}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis type="number" />
                                                        <YAxis type="category" dataKey="name" width={120} />
                                                        <Tooltip formatter={(value: number) => formatMoney(value)} />
                                                        <Bar dataKey="revenue" name="Выручка" fill="#22c55e" radius={[4, 4, 4, 4]} />
                                                    </RechartsBarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-white border rounded-xl p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Users className="h-5 w-5 text-green-600" />
                                            <h2 className="text-lg font-semibold">Клиенты</h2>
                                        </div>
                                        <div className="space-y-3 text-sm text-gray-600">
                                            <div className="flex items-center justify-between">
                                                <span>Всего клиентов в периоде</span>
                                                <span>{analytics.uniqueCustomers}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Новые клиенты</span>
                                                <span>{analytics.newCustomers}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Повторные клиенты</span>
                                                <span>{analytics.repeatCustomers}</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 text-xs text-gray-400">
                                            Повторные клиенты — 2+ заказа за период.
                                        </div>
                                    </div>

                                    <div className="bg-white border rounded-xl p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <TrendingUp className="h-5 w-5 text-green-600" />
                                            <h2 className="text-lg font-semibold">Статусы заказов</h2>
                                        </div>
                                        {analytics.statusBreakdown.length === 0 ? (
                                            <div className="text-sm text-gray-500">Нет данных</div>
                                        ) : (
                                            <div className="space-y-2 text-sm text-gray-600">
                                                {analytics.statusBreakdown.map((status) => (
                                                    <div key={status.status} className="flex items-center justify-between">
                                                        <span>{statusLabel(status.status)}</span>
                                                        <span>{status.count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                    <div className="bg-white border rounded-xl p-4">
                                        <div className="text-sm text-gray-500">Общий объем продаж</div>
                                        <div className="text-xl font-semibold text-gray-900">{analytics.itemsSoldTotal.toFixed(1)}</div>
                                        <div className="text-xs text-gray-400">кг / шт. за период</div>
                                    </div>
                                    <div className="bg-white border rounded-xl p-4">
                                        <div className="text-sm text-gray-500">Средний объем заказа</div>
                                        <div className="text-xl font-semibold text-gray-900">{analytics.averageItemsPerOrder.toFixed(1)}</div>
                                        <div className="text-xs text-gray-400">кг / шт. на заказ</div>
                                    </div>
                                    <div className="bg-white border rounded-xl p-4">
                                        <div className="text-sm text-gray-500">Завершенные заказы</div>
                                        <div className="text-xl font-semibold text-gray-900">{analytics.completedOrders}</div>
                                        <div className="text-xs text-gray-400">за период</div>
                                    </div>
                                    <div className="bg-white border rounded-xl p-4">
                                        <div className="text-sm text-gray-500">Отмененные заказы</div>
                                        <div className="text-xl font-semibold text-gray-900">{analytics.cancelledOrders}</div>
                                        <div className="text-xs text-gray-400">за период</div>
                                    </div>
                                </div>

                                <div className="bg-white border rounded-xl p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <BarChart3 className="h-5 w-5 text-green-600" />
                                        <h2 className="text-lg font-semibold">CRM-заметки и задачи</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                        <div className="border rounded-lg p-3">
                                            <div className="font-medium text-gray-900 mb-1">Повторные заказы</div>
                                            <p>Клиентов без повторной покупки за период: {Math.max(analytics.uniqueCustomers - analytics.newCustomers, 0)}</p>
                                        </div>
                                        <div className="border rounded-lg p-3">
                                            <div className="font-medium text-gray-900 mb-1">Категории роста</div>
                                            <p>Топ категория: {analytics.categoryBreakdown[0]?.categoryName || 'Нет данных'}</p>
                                        </div>
                                        <div className="border rounded-lg p-3">
                                            <div className="font-medium text-gray-900 mb-1">Заказы в ожидании</div>
                                            <p>Всего: {analytics.statusBreakdown.find((s) => s.status.toLowerCase() === 'awaitingweight')?.count || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
