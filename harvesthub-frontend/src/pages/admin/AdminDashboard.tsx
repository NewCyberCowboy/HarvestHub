import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    AlertTriangle,
    ArrowRight,
    Banknote,
    Boxes,
    Clock3,
    ListTodo,
    LayoutDashboard,
    MessageSquareQuote,
    Plus,
    Package,
    ShoppingCart,
    Sparkles,
    Target,
    Users,
} from 'lucide-react'
import { farmerApplicationsApi } from '@/api/farmerApplications.api'
import { useRequireAdmin } from '@/hooks/useRequireAdmin'
import { useAdminStore } from '@/store/adminStore'

type AdminReminder = {
    id: string
    text: string
    done: boolean
}

const ADMIN_NOTES_KEY = 'harvesthub-admin-dashboard-notes'
const ADMIN_REMINDERS_KEY = 'harvesthub-admin-dashboard-reminders'

function getStoredNotes() {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem(ADMIN_NOTES_KEY) ?? ''
}

function getStoredReminders(): AdminReminder[] {
    if (typeof window === 'undefined') return []

    const storedReminders = window.localStorage.getItem(ADMIN_REMINDERS_KEY)
    if (!storedReminders) return []

    try {
        return JSON.parse(storedReminders) as AdminReminder[]
    } catch {
        return []
    }
}

export default function AdminDashboard() {
    useRequireAdmin()

    const {
        products,
        orders,
        categories,
        pendingReviews,
        userStats,
        fetchProducts,
        fetchOrders,
        fetchCategories,
        fetchPendingReviews,
        fetchUserStats,
    } = useAdminStore()
    const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0)
    const [dashboardTimestamp] = useState(() => Date.now())
    const [adminNotes, setAdminNotes] = useState(() => getStoredNotes())
    const [reminders, setReminders] = useState<AdminReminder[]>(() => getStoredReminders())
    const [newReminder, setNewReminder] = useState('')

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(ADMIN_NOTES_KEY, adminNotes)
    }, [adminNotes])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(ADMIN_REMINDERS_KEY, JSON.stringify(reminders))
    }, [reminders])

    useEffect(() => {
        fetchProducts()
        fetchOrders()
        fetchCategories()
        fetchPendingReviews()
        fetchUserStats()
        farmerApplicationsApi
            .getPendingApplications()
            .then((items) => setPendingApplicationsCount(items.length))
            .catch(() => setPendingApplicationsCount(0))
    }, [fetchProducts, fetchOrders, fetchCategories, fetchPendingReviews, fetchUserStats])

    const stats = useMemo(() => {
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)
        const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0
        const pendingOrders = orders.filter((order) => ['Pending', 'Processing', 'AwaitingWeight'].includes(order.status)).length
        const completedOrders = orders.filter((order) => ['Completed', 'Delivered'].includes(order.status)).length
        const lowStockProducts = products.filter((product) => product.currentStock > 0 && product.currentStock < 10).length
        const overdueOrders = orders.filter((order) => {
            const createdAt = new Date(order.createdAt).getTime()
            const ageHours = (dashboardTimestamp - createdAt) / (1000 * 60 * 60)

            return ['Pending', 'AwaitingWeight', 'Processing'].includes(order.status) && ageHours > 24
        }).length

        return {
            totalRevenue,
            averageOrderValue,
            pendingOrders,
            completedOrders,
            lowStockProducts,
            overdueOrders,
        }
    }, [orders, products, dashboardTimestamp])

    const kpis = [
        {
            title: 'Выручка',
            value: `₽ ${stats.totalRevenue.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}`,
            description: 'Суммарно по всем заказам',
            icon: Banknote,
            accent: 'from-emerald-500 to-lime-400',
        },
        {
            title: 'Заказы в работе',
            value: stats.pendingOrders,
            description: 'Нуждаются в контроле команды',
            icon: ShoppingCart,
            accent: 'from-amber-400 to-orange-400',
        },
        {
            title: 'Средний чек',
            value: `₽ ${averageCurrency(stats.averageOrderValue)}`,
            description: 'Срез по актуальным данным',
            icon: Sparkles,
            accent: 'from-sky-500 to-cyan-400',
        },
        {
            title: 'Товары с низким остатком',
            value: stats.lowStockProducts,
            description: 'Сигнал для пополнения запасов',
            icon: AlertTriangle,
            accent: 'from-rose-500 to-orange-400',
        },
    ]

    const modules = [
        {
            title: 'Каталог',
            description: 'Управляйте карточками продуктов, ценами, остатками и витриной.',
            link: '/admin/products',
            icon: Package,
        },
        {
            title: 'Заказы',
            description: 'Смотрите цепочку статусов и контролируйте исполнение без лишних переходов.',
            link: '/admin/orders',
            icon: ShoppingCart,
        },
        {
            title: 'Пользователи',
            description: 'Работайте с ролями, историей активности и базой клиентов.',
            link: '/admin/users',
            icon: Users,
        },
        {
            title: 'Контент сайта',
            description: 'Обновляйте условия, FAQ и тексты публичной части прямо из CRM.',
            link: '/admin/content',
            icon: LayoutDashboard,
        },
    ]

    const liveFeed = [
        `${orders.length} заказов в базе`,
        `${stats.completedOrders} завершённых или доставленных`,
        `${pendingReviews.length} отзывов ждут модерации`,
        `${categories.length} категорий в каталоге`,
        `${pendingApplicationsCount} заявок фермера ждут решения`,
    ]

    const actionCenter = [
        {
            title: 'Разобрать проблемные заказы',
            value: stats.overdueOrders,
            description: 'Заказы старше суток в статусах ожидания или обработки.',
            to: '/admin/orders',
            priority: stats.overdueOrders >= 5 ? 'critical' : stats.overdueOrders > 0 ? 'high' : 'normal',
        },
        {
            title: 'Проверить новые отзывы',
            value: pendingReviews.length,
            description: 'Очередь модерации влияет на доверие и конверсию.',
            to: '/admin/reviews',
            priority: pendingReviews.length >= 8 ? 'high' : pendingReviews.length > 0 ? 'medium' : 'normal',
        },
        {
            title: 'Решить заявки фермеров',
            value: pendingApplicationsCount,
            description: 'Новые партнёры и роли не должны простаивать без ответа.',
            to: '/admin/farmer-applications',
            priority: pendingApplicationsCount >= 3 ? 'high' : pendingApplicationsCount > 0 ? 'medium' : 'normal',
        },
        {
            title: 'Пополнить low-stock позиции',
            value: stats.lowStockProducts,
            description: 'Товары с низким остатком требуют внимания каталога.',
            to: '/admin/products',
            priority: stats.lowStockProducts >= 10 ? 'high' : stats.lowStockProducts > 0 ? 'medium' : 'normal',
        },
    ]

    const savedSegments = [
        {
            title: 'Операционный фокус',
            description: 'Заказы в работе, overdue-сигналы и очередь модерации.',
            to: '/admin/orders',
            meta: `${stats.pendingOrders} заказов в работе`,
        },
        {
            title: 'Риск по каталогу',
            description: 'Low-stock позиции и структура категорий.',
            to: '/admin/products',
            meta: `${stats.lowStockProducts} товаров с низким остатком`,
        },
        {
            title: 'Контроль качества',
            description: 'Отзывы, публичный контент и репутационные сигналы.',
            to: '/admin/reviews',
            meta: `${pendingReviews.length} отзывов ждут решения`,
        },
        {
            title: 'База клиентов',
            description: 'Пользователи, роли и активность аккаунтов.',
            to: '/admin/users',
            meta: `${userStats?.activeUsers ?? 0} активных пользователей`,
        },
    ]

    const reminderStats = useMemo(() => {
        const open = reminders.filter((item) => !item.done).length
        const completed = reminders.filter((item) => item.done).length

        return { open, completed }
    }, [reminders])

    const handleAddReminder = () => {
        const text = newReminder.trim()
        if (!text) return

        setReminders((current) => [
            {
                id: `${Date.now()}-${current.length}`,
                text,
                done: false,
            },
            ...current,
        ])
        setNewReminder('')
    }

    const toggleReminder = (id: string) => {
        setReminders((current) =>
            current.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
        )
    }

    const removeReminder = (id: string) => {
        setReminders((current) => current.filter((item) => item.id !== id))
    }

    return (
        <div className="space-y-8">
            <section className="overflow-hidden rounded-[2rem] border border-[#E6D3A7] bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.14),_transparent_28%),linear-gradient(135deg,#FFFAF0_0%,#FFF8DC_58%,#FFEBCD_100%)] p-8 text-stone-900 shadow-2xl shadow-amber-200/35">
                <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
                    <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">HarvestHub CRM</p>
                        <h1 className="max-w-3xl text-4xl font-bold tracking-tight">Управляйте всей платформой из одного сильного админ-контура</h1>
                        <p className="mt-5 max-w-2xl text-base leading-8 text-stone-700">
                            Новый дашборд концентрирует ключевые показатели, быстрые переходы и операционные сигналы,
                            чтобы админка ощущалась как современная CRM, а не набор разрозненных экранов.
                        </p>
                    </div>

                    <div className="rounded-[1.75rem] border border-[#E6D3A7] bg-white/70 p-5 backdrop-blur">
                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Live snapshot</p>
                        <div className="space-y-3">
                            {liveFeed.map((item) => (
                                <div key={item} className="rounded-2xl border border-[#E6D3A7] bg-[#FFF8DC] px-4 py-3 text-sm text-stone-800">
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {kpis.map(({ title, value, description, icon: Icon, accent }) => (
                    <div key={title} className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm">
                        <div className={`h-1.5 bg-gradient-to-r ${accent}`} />
                        <div className="p-6">
                            <div className="mb-5 flex items-center justify-between">
                                <div className="rounded-2xl bg-stone-100 p-3 text-stone-700">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">KPI</span>
                            </div>
                            <p className="text-sm font-medium text-stone-500">{title}</p>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-stone-950">{value}</p>
                            <p className="mt-3 text-sm leading-6 text-stone-600">{description}</p>
                        </div>
                    </div>
                ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Core modules</p>
                            <h2 className="mt-2 text-2xl font-bold text-stone-950">Навигация по CRM</h2>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {modules.map(({ title, description, link, icon: Icon }) => (
                            <Link
                                key={title}
                                to={link}
                                className="group rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5 transition hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-lg"
                            >
                                <div className="mb-5 inline-flex rounded-2xl bg-white p-3 text-emerald-700 shadow-sm">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <h3 className="text-xl font-semibold text-stone-950">{title}</h3>
                                <p className="mt-3 leading-7 text-stone-600">{description}</p>
                                <div className="mt-5 inline-flex items-center gap-2 font-medium text-emerald-700">
                                    Открыть раздел
                                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
                    <div className="mb-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Operational focus</p>
                        <h2 className="mt-2 text-2xl font-bold text-stone-950">Что требует внимания сейчас</h2>
                    </div>

                    <div className="space-y-4">
                        <SignalRow
                            title="Заказы в обработке"
                            value={stats.pendingOrders}
                            note="Чем выше значение, тем важнее оперативно пройтись по статусам."
                            tone="amber"
                        />
                        <SignalRow
                            title="Отзывы на модерации"
                            value={pendingReviews.length}
                            note="Социальное доказательство влияет на конверсию, не затягивайте с разбором."
                            tone="emerald"
                        />
                        <SignalRow
                            title="Категории"
                            value={categories.length}
                            note="Следите, чтобы структура каталога оставалась простой и понятной."
                            tone="sky"
                        />
                        <SignalRow
                            title="Товары в системе"
                            value={products.length}
                            note="Используйте контент и остатки, чтобы витрина выглядела живой."
                            tone="violet"
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-[1.75rem] border border-green-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-2xl bg-[#FFF8DC] p-3 text-green-700">
                            <Target className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-stone-950">Центр действий</h2>
                            <p className="text-sm text-stone-500">Что требует реакции прямо сейчас</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {actionCenter.map((item) => (
                            <Link
                                key={item.title}
                                to={item.to}
                                className="group flex items-start justify-between gap-4 rounded-[1.5rem] border border-green-200 bg-[linear-gradient(180deg,#ffffff_0%,#FFFAF0_100%)] p-5 transition hover:-translate-y-1 hover:shadow-lg"
                            >
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-semibold text-stone-950">{item.title}</h3>
                                        <PriorityBadge priority={item.priority} />
                                    </div>
                                    <p className="mt-3 text-sm leading-7 text-stone-600">{item.description}</p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">Queue</p>
                                        <p className="mt-1 text-2xl font-bold text-stone-950">{item.value}</p>
                                    </div>
                                    <ArrowRight className="mt-3 h-5 w-5 text-emerald-700 transition group-hover:translate-x-1" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="rounded-[1.75rem] border border-green-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-2xl bg-[#FFF8DC] p-3 text-green-700">
                            <Clock3 className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-stone-950">Сохранённые сегменты</h2>
                            <p className="text-sm text-stone-500">Быстрые рабочие сценарии для операционного дня</p>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {savedSegments.map((segment) => (
                            <Link
                                key={segment.title}
                                to={segment.to}
                                className="group rounded-[1.5rem] border border-green-200 bg-[linear-gradient(180deg,#ffffff_0%,#FFFAF0_100%)] p-5 transition hover:-translate-y-1 hover:shadow-lg"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-stone-950">{segment.title}</h3>
                                        <p className="mt-3 text-sm leading-7 text-stone-600">{segment.description}</p>
                                        <p className="mt-4 text-sm font-medium text-green-700">{segment.meta}</p>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-emerald-700 transition group-hover:translate-x-1" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
                <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                            <Boxes className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-stone-950">Быстрые действия</h2>
                            <p className="text-sm text-stone-500">Самые частые CRM-задачи без лишних переходов</p>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <QuickActionCard to="/admin/products" title="Открыть каталог" subtitle="Товары, остатки, цены" />
                        <QuickActionCard to="/admin/orders" title="Разобрать заказы" subtitle="Статусы, веса, доставка" />
                        <QuickActionCard to="/admin/reviews" title="Проверить отзывы" subtitle="Модерация покупательского фидбэка" />
                        <QuickActionCard to="/admin/content" title="Обновить контент" subtitle="Условия, FAQ, публичные тексты" />
                        <QuickActionCard to="/admin/farmer-applications" title="Решить заявки" subtitle="Новые фермеры и доступы" />
                        <QuickActionCard to="/admin/users" title="Контроль пользователей" subtitle="Роли, активность, клиентская база" />
                    </div>
                </div>

                <div className="rounded-[1.75rem] border border-stone-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_55%,#f8fafc_100%)] p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="rounded-2xl bg-white p-3 text-emerald-700 shadow-sm">
                            <MessageSquareQuote className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-stone-950">CRM-note</h2>
                            <p className="text-sm text-stone-500">Как пользоваться этой панелью эффективнее</p>
                        </div>
                    </div>

                    <div className="space-y-4 text-sm leading-7 text-stone-700">
                        <p>
                            Начинайте день с блока заказов в работе, затем переходите к отзывам и только после этого
                            обновляйте каталог или контент. Так CRM будет поддерживать продажи, а не отвлекать от них.
                        </p>
                        <p>
                            Следующим шагом можно перевести и остальные административные страницы в этот же визуальный язык,
                            чтобы весь backend-office ощущался как единый продукт.
                        </p>
                    </div>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-[1.75rem] border border-green-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-2xl bg-[#FFF8DC] p-3 text-green-700">
                            <MessageSquareQuote className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-stone-950">Admin Notes</h2>
                            <p className="text-sm text-stone-500">Локальные заметки администратора прямо в CRM</p>
                        </div>
                    </div>

                    <textarea
                        value={adminNotes}
                        onChange={(event) => setAdminNotes(event.target.value)}
                        placeholder="Например: проверить причину задержки заказов, согласовать новый контент, созвон с фермером..."
                        className="min-h-[240px] w-full rounded-[1.5rem] border border-green-200 bg-[linear-gradient(180deg,#ffffff_0%,#FFFAF0_100%)] px-5 py-4 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    />
                </div>

                <div className="rounded-[1.75rem] border border-green-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-[#FFF8DC] p-3 text-green-700">
                                <ListTodo className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-stone-950">Follow-up List</h2>
                                <p className="text-sm text-stone-500">Открыто: {reminderStats.open} • Выполнено: {reminderStats.completed}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-5 flex gap-3">
                        <input
                            type="text"
                            value={newReminder}
                            onChange={(event) => setNewReminder(event.target.value)}
                            onKeyDown={(event) => event.key === 'Enter' && handleAddReminder()}
                            placeholder="Добавить follow-up задачу"
                            className="flex-1 rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                        />
                        <button
                            onClick={handleAddReminder}
                            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
                        >
                            <Plus className="h-4 w-4" />
                            Добавить
                        </button>
                    </div>

                    <div className="space-y-3">
                        {reminders.length === 0 ? (
                            <div className="rounded-[1.5rem] border border-green-200 bg-[linear-gradient(180deg,#ffffff_0%,#FFFAF0_100%)] p-5 text-sm text-stone-600">
                                Follow-up список пока пуст. Добавь сюда короткие действия, чтобы не терять операционный контекст.
                            </div>
                        ) : (
                            reminders.map((item) => (
                                <div
                                    key={item.id}
                                    className={`flex items-center gap-3 rounded-[1.5rem] border p-4 ${
                                        item.done
                                            ? 'border-stone-200 bg-stone-50 text-stone-500'
                                            : 'border-green-200 bg-[linear-gradient(180deg,#ffffff_0%,#FFFAF0_100%)] text-stone-800'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={item.done}
                                        onChange={() => toggleReminder(item.id)}
                                        className="h-5 w-5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <p className={`flex-1 text-sm leading-7 ${item.done ? 'line-through' : ''}`}>{item.text}</p>
                                    <button
                                        onClick={() => removeReminder(item.id)}
                                        className="rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium text-stone-600 transition hover:bg-white"
                                    >
                                        Удалить
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>
        </div>
    )
}

function SignalRow({
    title,
    value,
    note,
    tone,
}: {
    title: string
    value: number
    note: string
    tone: 'amber' | 'emerald' | 'sky' | 'violet'
}) {
    const tones = {
        amber: 'bg-amber-100 text-amber-800',
        emerald: 'bg-emerald-100 text-emerald-800',
        sky: 'bg-sky-100 text-sky-800',
        violet: 'bg-violet-100 text-violet-800',
    }

    return (
        <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-stone-950">{title}</h3>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${tones[tone]}`}>{value}</span>
            </div>
            <p className="text-sm leading-7 text-stone-600">{note}</p>
        </div>
    )
}

function QuickActionCard({ to, title, subtitle }: { to: string; title: string; subtitle: string }) {
    return (
        <Link
            to={to}
            className="group rounded-[1.5rem] border border-stone-200 bg-white p-5 transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-stone-950">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{subtitle}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-emerald-700 transition group-hover:translate-x-1" />
            </div>
        </Link>
    )
}

function PriorityBadge({ priority }: { priority: 'critical' | 'high' | 'medium' | 'normal' }) {
    const config = {
        critical: 'bg-rose-100 text-rose-800',
        high: 'bg-amber-100 text-amber-800',
        medium: 'bg-sky-100 text-sky-800',
        normal: 'bg-emerald-100 text-emerald-800',
    }

    const label = {
        critical: 'Критично',
        high: 'Высокий',
        medium: 'Средний',
        normal: 'Норма',
    }

    return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${config[priority]}`}>{label[priority]}</span>
}

function averageCurrency(value: number) {
    return value.toLocaleString('ru-RU', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })
}
