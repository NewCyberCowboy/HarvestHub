import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
    Clock,
    Eye,
    Filter,
    Loader2,
    Package,
    Search,
    ShoppingCart,
    Truck,
    Wallet,
} from 'lucide-react'
import { useRequireAdmin } from '@/hooks/useRequireAdmin'
import { useAdminStore } from '@/store/adminStore'
import { OrderDto, OrderStatus } from '@/types/backend'
import {
    addCrmTag,
    CrmAnnotation,
    CrmPriority,
    getCrmAnnotation,
    loadCrmAnnotations,
    removeCrmTag,
    saveCrmAnnotations,
    setCrmPriority,
} from '@/utils/crmAnnotations'
import { matchesAnyField, rankByRelevance } from '@/utils/trigramSearch'

const statusOptions = [
    OrderStatus.Pending,
    OrderStatus.Confirmed,
    OrderStatus.Processing,
    OrderStatus.Shipped,
    OrderStatus.Delivered,
    OrderStatus.Cancelled,
] as const

const ORDER_ANNOTATIONS_NAMESPACE = 'orders'

export default function OrdersManagement() {
    useRequireAdmin()

    const { orders, isLoading, error, fetchOrders, updateOrderStatus } = useAdminStore()

    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [dateFilter, setDateFilter] = useState<string>('all')
    const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null)
    const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null)
    const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([])
    const [bulkStatus, setBulkStatus] = useState<string>(OrderStatus.Processing)
    const [isBulkUpdating, setIsBulkUpdating] = useState(false)
    const [annotations, setAnnotations] = useState<Record<string, CrmAnnotation>>(() =>
        loadCrmAnnotations(ORDER_ANNOTATIONS_NAMESPACE)
    )
    const [draftTags, setDraftTags] = useState<Record<string, string>>({})

    useEffect(() => {
        fetchOrders()
    }, [fetchOrders])

    useEffect(() => {
        saveCrmAnnotations(ORDER_ANNOTATIONS_NAMESPACE, annotations)
    }, [annotations])

    const filteredOrders = useMemo(() => {
        let filtered = orders.filter((order) => {
            const matchesStatus = statusFilter === 'all' || order.status === statusFilter
            const orderDate = new Date(order.createdAt)
            const now = new Date()
            const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)

            const matchesDate = (() => {
                if (dateFilter === 'all') return true
                if (dateFilter === 'today') return diffDays < 1
                if (dateFilter === 'week') return diffDays < 7
                if (dateFilter === 'month') return diffDays < 30
                return true
            })()

            return matchesStatus && matchesDate
        })

        if (search.trim().length > 0) {
            filtered = filtered.filter((order) =>
                matchesAnyField(search, [order.orderNumber || '', order.deliveryAddress || ''], 0.3)
            )

            filtered = rankByRelevance(
                search,
                filtered,
                (order) => `${order.orderNumber} ${order.deliveryAddress || ''}`
            )
        }

        return filtered
    }, [orders, search, statusFilter, dateFilter])

    const stats = useMemo(() => {
        const revenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0)
        const pending = filteredOrders.filter((order) => order.status === OrderStatus.Pending).length
        const inProgress = filteredOrders.filter((order) =>
            [OrderStatus.Confirmed, OrderStatus.Processing, 'AwaitingWeight', 'ReadyToShip', OrderStatus.Shipped].includes(order.status as OrderStatus)
        ).length

        return { revenue, pending, inProgress }
    }, [filteredOrders])

    const handleUpdateStatus = async (orderId: number, status: string) => {
        try {
            setStatusUpdateError(null)
            await updateOrderStatus(orderId, { status })
            await fetchOrders()
        } catch (updateError) {
            const errorMessage =
                updateError instanceof Error ? updateError.message : 'Не удалось обновить статус заказа'
            setStatusUpdateError(errorMessage)
        }
    }

    const toggleOrderSelection = (orderId: number) => {
        setSelectedOrderIds((current) =>
            current.includes(orderId) ? current.filter((id) => id !== orderId) : [...current, orderId]
        )
    }

    const toggleSelectAllFiltered = () => {
        const filteredIds = filteredOrders.map((order) => order.orderId)
        const areAllSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedOrderIds.includes(id))

        setSelectedOrderIds((current) =>
            areAllSelected
                ? current.filter((id) => !filteredIds.includes(id))
                : Array.from(new Set([...current, ...filteredIds]))
        )
    }

    const handleBulkStatusUpdate = async () => {
        if (selectedOrderIds.length === 0) return

        setIsBulkUpdating(true)
        try {
            setStatusUpdateError(null)
            await Promise.all(selectedOrderIds.map((orderId) => updateOrderStatus(orderId, { status: bulkStatus })))
            setSelectedOrderIds([])
            await fetchOrders()
        } catch (updateError) {
            const errorMessage =
                updateError instanceof Error ? updateError.message : 'Не удалось массово обновить статусы'
            setStatusUpdateError(errorMessage)
        } finally {
            setIsBulkUpdating(false)
        }
    }

    const updatePriority = (orderId: number, priority: CrmPriority) => {
        setAnnotations((current) => setCrmPriority(current, orderId, priority))
    }

    const addTag = (orderId: number) => {
        const value = draftTags[String(orderId)] || ''
        setAnnotations((current) => addCrmTag(current, orderId, value))
        setDraftTags((current) => ({ ...current, [String(orderId)]: '' }))
    }

    const removeTag = (orderId: number, tag: string) => {
        setAnnotations((current) => removeCrmTag(current, orderId, tag))
    }

    if (isLoading && orders.length === 0) {
        return <LoadingState />
    }

    return (
        <div className="space-y-8">
            <section className="overflow-hidden rounded-[2rem] border border-green-200 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.14),_transparent_28%),linear-gradient(135deg,#FFFAF0_0%,#FFF8DC_58%,#FFEBCD_100%)] p-8 shadow-sm">
                <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-end">
                    <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">Orders CRM</p>
                        <h1 className="text-4xl font-bold tracking-tight text-stone-950">Управление заказами без перегруза таблицами</h1>
                        <p className="mt-5 max-w-2xl text-base leading-8 text-stone-700">
                            Здесь заказы удобнее вести как очередь кейсов: быстрые сигналы, понятные статусы, приоритеты и детали прямо в ленте.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <StatCard label="В выборке" value={filteredOrders.length} icon={<ShoppingCart className="h-5 w-5" />} />
                        <StatCard label="Ожидают" value={stats.pending} icon={<Clock className="h-5 w-5" />} />
                        <StatCard label="В работе" value={stats.inProgress} icon={<Truck className="h-5 w-5" />} />
                        <StatCard
                            label="Выручка"
                            value={`₽ ${stats.revenue.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}`}
                            icon={<Wallet className="h-5 w-5" />}
                        />
                    </div>
                </div>
            </section>

            {error && <ErrorBanner message={error} />}
            {statusUpdateError && <ErrorBanner message={`Ошибка обновления статуса: ${statusUpdateError}`} />}

            <section className="rounded-[1.75rem] border border-green-200 bg-white p-6 shadow-sm">
                <div className="grid gap-4 xl:grid-cols-[1fr_260px_220px]">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input
                            type="text"
                            placeholder="Поиск по номеру заказа или адресу"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="w-full rounded-2xl border border-stone-300 bg-stone-50 py-3 pl-11 pr-4 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                        />
                    </div>

                    <div className="relative">
                        <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className="w-full appearance-none rounded-2xl border border-stone-300 bg-white py-3 pl-11 pr-4 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                        >
                            <option value="all">Все статусы</option>
                            {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                    {getStatusLabel(status)}
                                </option>
                            ))}
                            <option value="Completed">Завершён</option>
                            <option value="AwaitingWeight">Ожидает указания веса</option>
                            <option value="ReadyToShip">Готов к отправке</option>
                        </select>
                    </div>

                    <select
                        value={dateFilter}
                        onChange={(event) => setDateFilter(event.target.value)}
                        className="rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    >
                        <option value="all">За всё время</option>
                        <option value="today">Сегодня</option>
                        <option value="week">За неделю</option>
                        <option value="month">За месяц</option>
                    </select>
                </div>
            </section>

            <section className="rounded-[1.75rem] border border-green-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-stone-500">Массовые действия</p>
                        <p className="mt-1 text-sm text-stone-600">
                            Выбрано заказов: <span className="font-semibold text-stone-900">{selectedOrderIds.length}</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={toggleSelectAllFiltered}
                            className="rounded-2xl border border-stone-300 px-4 py-3 font-medium text-stone-800 transition hover:bg-stone-50"
                        >
                            {filteredOrders.length > 0 && filteredOrders.every((order) => selectedOrderIds.includes(order.orderId))
                                ? 'Снять выбор'
                                : 'Выбрать все в выборке'}
                        </button>
                        <select
                            value={bulkStatus}
                            onChange={(event) => setBulkStatus(event.target.value)}
                            className="rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                        >
                            {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                    {getStatusLabel(status)}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleBulkStatusUpdate}
                            disabled={selectedOrderIds.length === 0 || isBulkUpdating}
                            className="rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isBulkUpdating ? 'Обновление...' : 'Изменить статусы'}
                        </button>
                    </div>
                </div>
            </section>

            {filteredOrders.length === 0 ? (
                <EmptyState
                    isFiltered={Boolean(search || statusFilter !== 'all' || dateFilter !== 'all')}
                    onReset={() => {
                        setSearch('')
                        setStatusFilter('all')
                        setDateFilter('all')
                    }}
                />
            ) : (
                <section className="space-y-4">
                    {filteredOrders.map((order) => (
                        <div key={order.orderId} className="space-y-4">
                            <article className="rounded-[1.75rem] border border-green-200 bg-white p-6 shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedOrderIds.includes(order.orderId)}
                                            onChange={() => toggleOrderSelection(order.orderId)}
                                            className="mt-1 h-5 w-5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Заказ</p>
                                            <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-950">#{order.orderNumber}</h2>
                                            <p className="mt-2 text-sm text-stone-500">{formatDate(order.createdAt)}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        <StatusBadge status={order.status} />
                                        <PriorityBadge priority={getCrmAnnotation(annotations, order.orderId).priority} />
                                        <div className="rounded-2xl bg-[#FFF8DC] px-4 py-2 text-sm font-semibold text-stone-800">
                                            ₽ {order.totalAmount.toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr_auto] lg:items-start">
                                    <div className="rounded-[1.5rem] bg-stone-50 p-5">
                                        <InfoRow label="Адрес доставки" value={order.deliveryAddress} />
                                        <div className="mt-4">
                                            <InfoRow label="Позиции" value={`${order.items.length} товар(ов)`} />
                                        </div>
                                    </div>

                                    <div className="rounded-[1.5rem] bg-stone-50 p-5">
                                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">Состав заказа</p>
                                        <div className="space-y-3">
                                            {order.items.slice(0, 3).map((item, index) => (
                                                <div key={`${order.orderId}-${index}`} className="rounded-2xl bg-white px-4 py-3">
                                                    <p className="font-medium text-stone-900">{item.productName || `Товар #${item.productId}`}</p>
                                                    <p className="mt-1 text-sm text-stone-600">
                                                        {item.expectedWeight ? `${item.expectedWeight} кг` : `${item.quantity} шт.`}
                                                    </p>
                                                </div>
                                            ))}
                                            {order.items.length > 3 && (
                                                <div className="text-sm font-medium text-emerald-700">
                                                    Ещё {order.items.length - 3} позиций
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid gap-3">
                                        <button
                                            onClick={() =>
                                                setSelectedOrder((current) =>
                                                    current?.orderId === order.orderId ? null : order
                                                )
                                            }
                                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-300 px-4 py-3 font-medium text-stone-800 transition hover:bg-stone-50"
                                        >
                                            <Eye className="h-4 w-4" />
                                            Детали
                                        </button>

                                        <select
                                            value={order.status}
                                            onChange={(event) => handleUpdateStatus(order.orderId, event.target.value)}
                                            className="rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                                        >
                                            {statusOptions.map((status) => (
                                                <option key={status} value={status}>
                                                    {getStatusLabel(status)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-4 rounded-[1.5rem] border border-green-200 bg-[linear-gradient(180deg,#ffffff_0%,#FFFAF0_100%)] p-5">
                                    <div className="grid gap-4 xl:grid-cols-[220px_1fr]">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">CRM приоритет</p>
                                            <select
                                                value={getCrmAnnotation(annotations, order.orderId).priority}
                                                onChange={(event) => updatePriority(order.orderId, event.target.value as CrmPriority)}
                                                className="mt-3 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                                            >
                                                <option value="normal">Норма</option>
                                                <option value="medium">Средний</option>
                                                <option value="high">Высокий</option>
                                                <option value="critical">Критично</option>
                                            </select>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">Теги кейса</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {getCrmAnnotation(annotations, order.orderId).tags.map((tag) => (
                                                    <button
                                                        key={tag}
                                                        onClick={() => removeTag(order.orderId, tag)}
                                                        className="rounded-full bg-[#FFF8DC] px-3 py-1 text-xs font-semibold text-green-800"
                                                    >
                                                        {tag} x
                                                    </button>
                                                ))}
                                                {getCrmAnnotation(annotations, order.orderId).tags.length === 0 && (
                                                    <span className="text-sm text-stone-500">Тегов пока нет</span>
                                                )}
                                            </div>
                                            <div className="mt-3 flex gap-3">
                                                <input
                                                    type="text"
                                                    value={draftTags[String(order.orderId)] || ''}
                                                    onChange={(event) =>
                                                        setDraftTags((current) => ({
                                                            ...current,
                                                            [String(order.orderId)]: event.target.value,
                                                        }))
                                                    }
                                                    onKeyDown={(event) => event.key === 'Enter' && addTag(order.orderId)}
                                                    placeholder="Например: срочная доставка"
                                                    className="flex-1 rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                                                />
                                                <button
                                                    onClick={() => addTag(order.orderId)}
                                                    className="rounded-2xl border border-green-200 bg-[#FFF8DC] px-4 py-3 font-semibold text-green-800 transition hover:bg-[#FFEBCD]"
                                                >
                                                    Добавить тег
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </article>

                            {selectedOrder?.orderId === order.orderId && (
                                <section className="rounded-[1.75rem] border border-green-200 bg-white shadow-sm">
                                    <div className="border-b border-green-100 bg-[linear-gradient(135deg,#FFFAF0_0%,#FFF8DC_100%)] p-6">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Order details</p>
                                                <h2 className="mt-2 text-2xl font-bold text-stone-950">Заказ #{order.orderNumber}</h2>
                                                <p className="mt-2 text-sm text-stone-500">{formatDate(order.createdAt)}</p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedOrder(null)}
                                                className="rounded-2xl border border-stone-300 px-4 py-2 font-medium text-stone-700 hover:bg-stone-50"
                                            >
                                                Закрыть
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-6 p-6">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="rounded-[1.5rem] bg-stone-50 p-5">
                                                <InfoRow label="Статус" value={getStatusLabel(order.status)} />
                                                <div className="mt-4">
                                                    <InfoRow label="Сумма" value={`₽ ${order.totalAmount.toFixed(2)}`} />
                                                </div>
                                            </div>
                                            <div className="rounded-[1.5rem] bg-stone-50 p-5">
                                                <InfoRow label="Адрес доставки" value={order.deliveryAddress} />
                                            </div>
                                        </div>

                                        {order.customerNotes && (
                                            <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50 p-5">
                                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Комментарий клиента</p>
                                                <p className="mt-3 text-sm leading-7 text-stone-700">{order.customerNotes}</p>
                                            </div>
                                        )}

                                        <div className="rounded-[1.5rem] bg-stone-50 p-5">
                                            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
                                                Товары в заказе ({order.items.length})
                                            </p>
                                            <div className="space-y-3">
                                                {order.items.map((item, index) => (
                                                    <div key={`${order.orderId}-detail-${index}`} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                                                        <div>
                                                            <p className="font-medium text-stone-900">{item.productName || `Товар ID: ${item.productId}`}</p>
                                                            <p className="mt-1 text-sm text-stone-600">
                                                                {item.expectedWeight ? `${item.expectedWeight} кг` : `Количество: ${item.quantity}`}
                                                            </p>
                                                        </div>
                                                        <div className="text-lg font-semibold text-stone-900">
                                                            ₽ {item.price ? (item.price * item.quantity).toFixed(2) : '0.00'}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="rounded-[1.5rem] bg-stone-50 p-5">
                                            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">История статусов</p>
                                            <div className="space-y-3">
                                                {order.statusHistory?.map((history, index) => (
                                                    <div key={`${history.changedAt}-${index}`} className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3">
                                                        <span className={`mt-1 h-3 w-3 rounded-full ${getStatusDotColor(history.status)}`} />
                                                        <div className="flex-1">
                                                            <p className="font-medium text-stone-900">{getStatusLabel(history.status)}</p>
                                                            <p className="mt-1 text-sm text-stone-600">{formatDate(history.changedAt)}</p>
                                                        </div>
                                                        {history.notes && <p className="max-w-xs text-sm text-stone-500">{history.notes}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>
                    ))}
                </section>
            )}
        </div>
    )
}

function LoadingState() {
    return (
        <div className="rounded-[1.75rem] border border-green-200 bg-white p-12 shadow-sm">
            <div className="flex items-center justify-center gap-3 text-stone-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Загружаем заказы...</span>
            </div>
        </div>
    )
}

function ErrorBanner({ message }: { message: string }) {
    return (
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 shadow-sm">
            {message}
        </div>
    )
}

function EmptyState({
    isFiltered,
    onReset,
}: {
    isFiltered: boolean
    onReset: () => void
}) {
    return (
        <section className="rounded-[1.75rem] border border-dashed border-green-200 bg-white px-6 py-14 text-center shadow-sm">
            <Package className="mx-auto h-10 w-10 text-stone-300" />
            <h2 className="mt-4 text-2xl font-semibold text-stone-900">
                {isFiltered ? 'По этим фильтрам заказов нет' : 'Заказов пока нет'}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-stone-600">
                {isFiltered
                    ? 'Попробуй сбросить фильтры или изменить поисковый запрос, чтобы вернуть больше заказов в ленту.'
                    : 'Когда появятся первые заказы, они будут отображаться здесь как рабочая очередь CRM.'}
            </p>
            {isFiltered && (
                <button
                    onClick={onReset}
                    className="mt-6 rounded-2xl border border-stone-300 px-5 py-3 font-medium text-stone-800 transition hover:bg-stone-50"
                >
                    Сбросить фильтры
                </button>
            )}
        </section>
    )
}

function StatCard({
    label,
    value,
    icon,
}: {
    label: string
    value: string | number
    icon: React.ReactNode
}) {
    return (
        <div className="rounded-[1.5rem] border border-green-200 bg-white/85 p-5 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{label}</p>
                    <p className="mt-3 text-2xl font-bold tracking-tight text-stone-950">{value}</p>
                </div>
                <div className="rounded-2xl bg-[#FFF8DC] p-3 text-green-700">{icon}</div>
            </div>
        </div>
    )
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">{label}</p>
            <p className="mt-2 text-sm leading-7 text-stone-800">{value || 'Не указано'}</p>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const tones: Record<string, string> = {
        [OrderStatus.Pending]: 'border-amber-200 bg-amber-50 text-amber-700',
        [OrderStatus.Confirmed]: 'border-sky-200 bg-sky-50 text-sky-700',
        [OrderStatus.Processing]: 'border-blue-200 bg-blue-50 text-blue-700',
        AwaitingWeight: 'border-violet-200 bg-violet-50 text-violet-700',
        ReadyToShip: 'border-cyan-200 bg-cyan-50 text-cyan-700',
        [OrderStatus.Shipped]: 'border-indigo-200 bg-indigo-50 text-indigo-700',
        [OrderStatus.Delivered]: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        Completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        [OrderStatus.Cancelled]: 'border-rose-200 bg-rose-50 text-rose-700',
    }

    return (
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tones[status] || 'border-stone-200 bg-stone-100 text-stone-700'}`}>
            {getStatusLabel(status)}
        </span>
    )
}

function PriorityBadge({ priority }: { priority: CrmPriority }) {
    const tones: Record<CrmPriority, string> = {
        normal: 'border-stone-200 bg-stone-100 text-stone-700',
        medium: 'border-amber-200 bg-amber-50 text-amber-700',
        high: 'border-orange-200 bg-orange-50 text-orange-700',
        critical: 'border-rose-200 bg-rose-50 text-rose-700',
    }

    const labels: Record<CrmPriority, string> = {
        normal: 'Норма',
        medium: 'Средний',
        high: 'Высокий',
        critical: 'Критично',
    }

    return (
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tones[priority]}`}>
            {labels[priority]}
        </span>
    )
}

function getStatusLabel(status: string) {
    switch (status) {
        case OrderStatus.Pending:
            return 'Ожидает'
        case OrderStatus.Confirmed:
            return 'Подтвержден'
        case OrderStatus.Processing:
            return 'В обработке'
        case 'AwaitingWeight':
            return 'Ожидает вес'
        case 'ReadyToShip':
            return 'Готов к отправке'
        case OrderStatus.Shipped:
            return 'Отправлен'
        case OrderStatus.Delivered:
            return 'Доставлен'
        case 'Completed':
            return 'Завершен'
        case OrderStatus.Cancelled:
            return 'Отменен'
        default:
            return status
    }
}

function getStatusDotColor(status: string) {
    switch (status) {
        case OrderStatus.Pending:
            return 'bg-amber-400'
        case OrderStatus.Confirmed:
            return 'bg-sky-400'
        case OrderStatus.Processing:
            return 'bg-blue-400'
        case 'AwaitingWeight':
            return 'bg-violet-400'
        case 'ReadyToShip':
            return 'bg-cyan-400'
        case OrderStatus.Shipped:
            return 'bg-indigo-400'
        case OrderStatus.Delivered:
        case 'Completed':
            return 'bg-emerald-400'
        case OrderStatus.Cancelled:
            return 'bg-rose-400'
        default:
            return 'bg-stone-400'
    }
}

function formatDate(value?: string | null) {
    if (!value) return 'Дата не указана'

    try {
        return format(new Date(value), 'd MMMM yyyy, HH:mm', { locale: ru })
    } catch {
        return value
    }
}
