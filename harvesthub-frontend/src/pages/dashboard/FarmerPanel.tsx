import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProductsStore } from '@/store/products.store'
import { imagesApi } from '@/api/images.api'
import { ru } from 'date-fns/locale'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import {
    ArrowRight,
    CheckCircle,
    Edit,
    Loader2,
    Package,
    Plus,
    Search,
    Trash2,
    Truck,
    Wallet,
    FileText,
} from 'lucide-react'
import { DashboardSidebar } from './components/Sidebar'
import { useAuthStore } from '@/store/auth.store'
import { ordersApi } from '@/api/orders.api'
import { productsApi } from '@/api/products.api'
import { productDraftsApi, ProductDraftDto } from '@/api/productDrafts.api'
import { notificationsService } from '@/api/notifications.api'
import { OrderDto, ProductDto, UpdateOrderWeightsDto } from '@/types/backend'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { matchesAnyField, rankByRelevance } from '@/utils/trigramSearch'

type TabKey = 'products' | 'orders' | 'drafts'

export default function FarmerPanel() {
    const navigate = useNavigate()
    const { user } = useAuthStore()

    const [activeTab, setActiveTab] = useState<TabKey>('products')
    const [products, setProducts] = useState<ProductDto[]>([])
    const [orders, setOrders] = useState<OrderDto[]>([])
    const [drafts, setDrafts] = useState<ProductDraftDto[]>([])
    const [searchProducts, setSearchProducts] = useState('')
    const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'date'>('date')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [isLoadingProducts, setIsLoadingProducts] = useState(false)
    const [isLoadingOrders, setIsLoadingOrders] = useState(false)
    const [isLoadingDrafts, setIsLoadingDrafts] = useState(false)
    const [productsError, setProductsError] = useState<string | null>(null)
    const [ordersError, setOrdersError] = useState<string | null>(null)
    const [draftsError, setDraftsError] = useState<string | null>(null)
    const [updateStatusError, setUpdateStatusError] = useState<string | null>(null)
    const [deleteProductConfirm, setDeleteProductConfirm] = useState<number | null>(null)
    const [deleteDraftConfirm, setDeleteDraftConfirm] = useState<number | null>(null)
    const [editingDraft, setEditingDraft] = useState<ProductDraftDto | null>(null)
    const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null)
    const [orderForWeights, setOrderForWeights] = useState<OrderDto | null>(null)
    const [orderWeights, setOrderWeights] = useState<Record<number, number>>({})
    const [isUpdatingWeights, setIsUpdatingWeights] = useState(false)

    useEffect(() => {
        if (activeTab === 'products') loadProducts()
    }, [activeTab])

    useEffect(() => {
        if (activeTab === 'orders') loadOrders()
    }, [activeTab])

    useEffect(() => {
        if (activeTab === 'drafts') loadDrafts()
    }, [activeTab])

    const loadDrafts = async () => {
        setIsLoadingDrafts(true)
        setDraftsError(null)
        try {
            const response = await productDraftsApi.getMyDrafts()
            setDrafts(response.data)
        } catch (error) {
            setDraftsError(error instanceof Error ? error.message : 'Не удалось загрузить черновики')
        } finally {
            setIsLoadingDrafts(false)
        }
    }

    const loadProducts = async () => {
        setIsLoadingProducts(true)
        setProductsError(null)
        try {
            setProducts(await productsApi.getMyProducts())
        } catch (error) {
            setProductsError(error instanceof Error ? error.message : 'Не удалось загрузить продукты')
        } finally {
            setIsLoadingProducts(false)
        }
    }

    const loadOrders = async () => {
        setIsLoadingOrders(true)
        setOrdersError(null)
        try {
            setOrders(await ordersApi.getFarmerOrders())
        } catch (error) {
            setOrdersError(error instanceof Error ? error.message : 'Не удалось загрузить заказы')
        } finally {
            setIsLoadingOrders(false)
        }
    }

    const handleDeleteProduct = async (id: number) => {
        await productsApi.deleteProduct(id)
        await loadProducts()
        setDeleteProductConfirm(null)
        toast.success('Продукт удалён')
    }

    const handleDeleteDraft = async (id: number) => {
        await productDraftsApi.deleteDraft(id)
        await loadDrafts()
        setDeleteDraftConfirm(null)
        toast.success('Черновик удалён')
    }

    const convertDraftToProduct = (draft: ProductDraftDto) => {
        // Navigate to add-product page with draft data pre-filled
        navigate('/dashboard/farmer/add-product', { state: { draft } })
    }

    const handleUpdateDraft = async (draftId: number, updates: Partial<ProductDraftDto>) => {
        try {
            await productDraftsApi.updateDraft(draftId, updates)
            await loadDrafts()
            setEditingDraft(null)
            toast.success('Черновик обновлён')
        } catch (error) {
            toast.error('Не удалось обновить черновик')
        }
    }

    const handleUpdateOrderStatus = async (orderId: number, status: string) => {
        try {
            setUpdateStatusError(null)
            const order = orders.find(o => o.orderId === orderId)
            await ordersApi.updateOrderStatus(orderId, { status })

            // Send notification to user about status change
            if (order) {
                await notificationsService.showOrderStatusNotification(order.orderNumber, status)
            }

            await loadOrders()
            setSelectedOrder(null)
        } catch (error) {
            setUpdateStatusError(error instanceof Error ? error.message : 'Не удалось обновить статус заказа')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-amber-100 text-amber-800'
            case 'confirmed': return 'bg-sky-100 text-sky-800'
            case 'processing': return 'bg-violet-100 text-violet-800'
            case 'awaitingweight': return 'bg-orange-100 text-orange-800'
            case 'readytoship': return 'bg-cyan-100 text-cyan-800'
            case 'shipped': return 'bg-indigo-100 text-indigo-800'
            case 'delivered': return 'bg-emerald-100 text-emerald-800'
            case 'completed': return 'bg-green-100 text-green-800'
            case 'cancelled': return 'bg-rose-100 text-rose-800'
            default: return 'bg-stone-100 text-stone-700'
        }
    }

    const getStatusText = (status: string) => {
        const labels: Record<string, string> = {
            pending: 'Ожидает подтверждения',
            confirmed: 'Подтверждён',
            processing: 'В обработке',
            awaitingweight: 'Ожидает указания веса',
            readytoship: 'Готов к отправке',
            shipped: 'Отправлен',
            delivered: 'Доставлен',
            completed: 'Завершён',
            cancelled: 'Отменён',
        }
        return labels[status.toLowerCase()] || status
    }

    const filteredProducts = useMemo(() => {
        if (searchProducts.trim().length === 0) return products
        const filtered = products.filter((product) =>
            matchesAnyField(searchProducts, [product.name, product.description || '', product.categoryName || ''], 0.3)
        )
        return rankByRelevance(
            searchProducts,
            filtered,
            (product) => `${product.name} ${product.description || ''} ${product.categoryName || ''}`
        )
    }, [products, searchProducts])

    const sortedProducts = useMemo(() => {
        return [...filteredProducts].sort((a, b) => {
            let comparison = 0
            switch (sortBy) {
                case 'name': comparison = a.name.localeCompare(b.name); break
                case 'price': comparison = a.basePrice - b.basePrice; break
                case 'stock': comparison = a.currentStock - b.currentStock; break
                case 'date': comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break
            }
            return sortOrder === 'asc' ? comparison : -comparison
        })
    }, [filteredProducts, sortBy, sortOrder])

    const summary = useMemo(() => {
        const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)
        return {
            productsCount: products.length,
            availableProducts: products.filter((product) => product.status === 'Available').length,
            ordersCount: orders.length,
            awaitingWeight: orders.filter((order) => order.status === 'AwaitingWeight').length,
            revenue,
        }
    }, [orders, products])

    if (!user || (user.role !== 'Farmer' && user.role !== 'Admin')) {
        return <AccessDenied />
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-3 py-3 md:flex-row md:px-4 md:py-4">
                <DashboardSidebar />
                <main className="min-w-0 flex-1 space-y-6">
                    <section className="overflow-hidden rounded-[2rem] border border-[#E6D3A7] bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.14),_transparent_26%),linear-gradient(135deg,#FFFAF0_0%,#FFF8DC_58%,#FFEBCD_100%)] p-8 text-stone-900 shadow-2xl shadow-amber-200/35">
                        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
                            <div>
                                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">Farmer CRM</p>
                                <h1 className="text-4xl font-bold tracking-tight">Фермерская панель нового уровня</h1>
                                <p className="mt-5 max-w-2xl text-base leading-8 text-stone-700">
                                    Здесь собраны товары, заказы и рабочие статусы в более чистом и уверенном интерфейсе.
                                    Логика осталась прежней, но визуально панель теперь ближе к настоящей CRM.
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <KpiGlassCard label="Товаров" value={summary.productsCount} />
                                <KpiGlassCard label="Заказов" value={summary.ordersCount} />
                                <KpiGlassCard label="Нужно указать вес" value={summary.awaitingWeight} />
                                <KpiGlassCard label="Выручка" value={`₽ ${summary.revenue.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}`} />
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatTile title="Доступно в продаже" value={summary.availableProducts} subtitle="активных товарных карточек" />
                        <StatTile title="Всего продуктов" value={summary.productsCount} subtitle="в фермерском каталоге" />
                        <StatTile title="Заказы в системе" value={summary.ordersCount} subtitle="включая завершённые" />
                        <StatTile title="Нужен контроль веса" value={summary.awaitingWeight} subtitle="заказы AwaitingWeight" />
                    </section>

                    <section className="rounded-[1.75rem] border border-stone-200 bg-white p-3 shadow-sm">
                        <div className="grid gap-3 md:grid-cols-3">
                            <TabButton
                                active={activeTab === 'products'}
                                label="Мои продукты"
                                description="Карточки, цены, остатки и редактура"
                                icon={<Package className="h-5 w-5" />}
                                onClick={() => setActiveTab('products')}
                            />
                            <TabButton
                                active={activeTab === 'orders'}
                                label="Мои заказы"
                                description="Статусы, вес, исполнение и доставка"
                                icon={<Truck className="h-5 w-5" />}
                                onClick={() => setActiveTab('orders')}
                            />
                            <TabButton
                                active={activeTab === 'drafts'}
                                label="Черновики"
                                description="Товары с мобильного устройства"
                                icon={<FileText className="h-5 w-5" />}
                                onClick={() => setActiveTab('drafts')}
                            />
                        </div>
                    </section>

                    {activeTab === 'products' ? (
                        <ProductsSection
                            navigate={navigate}
                            searchProducts={searchProducts}
                            setSearchProducts={setSearchProducts}
                            sortBy={sortBy}
                            setSortBy={setSortBy}
                            sortOrder={sortOrder}
                            setSortOrder={setSortOrder}
                            productsError={productsError}
                            isLoadingProducts={isLoadingProducts}
                            sortedProducts={sortedProducts}
                            setDeleteProductConfirm={setDeleteProductConfirm}
                        />
                    ) : activeTab === 'orders' ? (
                        <OrdersSection
                            ordersError={ordersError}
                            updateStatusError={updateStatusError}
                            isLoadingOrders={isLoadingOrders}
                            orders={orders}
                            getStatusColor={getStatusColor}
                            getStatusText={getStatusText}
                            setOrderForWeights={setOrderForWeights}
                            setOrderWeights={setOrderWeights}
                            handleUpdateOrderStatus={handleUpdateOrderStatus}
                            setSelectedOrder={setSelectedOrder}
                        />
                    ) : (
                        <DraftsSection
                            draftsError={draftsError}
                            isLoadingDrafts={isLoadingDrafts}
                            drafts={drafts}
                            setDeleteDraftConfirm={setDeleteDraftConfirm}
                            convertDraftToProduct={convertDraftToProduct}
                            setEditingDraft={setEditingDraft}
                        />
                    )}
                </main>
            </div>

            {deleteProductConfirm && (
                <ConfirmDialog
                    title="Удалить продукт?"
                    message="Вы уверены, что хотите удалить этот продукт? Это действие нельзя отменить."
                    confirmText="Удалить"
                    cancelText="Отмена"
                    onConfirm={() => handleDeleteProduct(deleteProductConfirm)}
                    onCancel={() => setDeleteProductConfirm(null)}
                    variant="danger"
                />
            )}

            {deleteDraftConfirm && (
                <ConfirmDialog
                    title="Удалить черновик?"
                    message="Вы уверены, что хотите удалить этот черновик? Это действие нельзя отменить."
                    confirmText="Удалить"
                    cancelText="Отмена"
                    onConfirm={() => handleDeleteDraft(deleteDraftConfirm)}
                    onCancel={() => setDeleteDraftConfirm(null)}
                    variant="danger"
                />
            )}

            {orderForWeights && (
                <WeightDialog
                    order={orderForWeights}
                    orderWeights={orderWeights}
                    setOrderWeights={setOrderWeights}
                    isUpdatingWeights={isUpdatingWeights}
                    onClose={() => {
                        setOrderForWeights(null)
                        setOrderWeights({})
                    }}
                    onSave={async () => {
                        setIsUpdatingWeights(true)
                        try {
                            const weightsData: UpdateOrderWeightsDto = {
                                items: orderForWeights.items.map((item, index) => {
                                    const itemId = getOrderItemId(item, index)
                                    return { orderItemId: itemId, actualWeight: orderWeights[itemId] || 0 }
                                }),
                            }
                            await ordersApi.updateOrderWeights(orderForWeights.orderId, weightsData)

                            // Send notification to user about weight update
                            for (const item of orderForWeights.items) {
                                const itemId = getOrderItemId(item, orderForWeights.items.indexOf(item))
                                await notificationsService.showWeightUpdatedNotification(
                                    orderForWeights.orderNumber,
                                    item.productName || `Товар #${item.productId}`,
                                    orderWeights[itemId] || 0
                                )
                            }

                            await loadOrders()
                            setOrderForWeights(null)
                            setOrderWeights({})
                            toast.success('Вес заказа обновлён')
                        } catch (error) {
                            alert(error instanceof Error ? error.message : 'Не удалось обновить вес заказа')
                        } finally {
                            setIsUpdatingWeights(false)
                        }
                    }}
                />
            )}

            {selectedOrder && (
                <StatusDialog
                    order={selectedOrder}
                    getStatusText={getStatusText}
                    onClose={() => setSelectedOrder(null)}
                    onPick={async (status) => {
                        await handleUpdateOrderStatus(selectedOrder.orderId, status)
                        toast.success(`Статус заказа изменён на "${getStatusText(status)}"`)
                    }}
                />
            )}

            {editingDraft && (
                <EditDraftModal
                    draft={editingDraft}
                    onClose={() => setEditingDraft(null)}
                    onSave={handleUpdateDraft}
                />
            )}
        </div>
    )
}

function AccessDenied() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-stone-100">
            <div className="rounded-[2rem] border border-stone-200 bg-white p-10 text-center shadow-sm">
                <h1 className="text-2xl font-bold text-stone-950">Доступ запрещён</h1>
                <p className="mt-3 text-stone-600">Эта страница доступна только для фермеров и администраторов.</p>
            </div>
        </div>
    )
}

function getOrderItemId(item: unknown, fallbackIndex: number) {
    if (
        typeof item === 'object' &&
        item !== null &&
        'orderItemId' in item &&
        typeof (item as { orderItemId?: unknown }).orderItemId === 'number'
    ) {
        return (item as { orderItemId: number }).orderItemId
    }

    return fallbackIndex
}

function getActualWeight(item: unknown) {
    if (
        typeof item === 'object' &&
        item !== null &&
        'actualWeight' in item &&
        typeof (item as { actualWeight?: unknown }).actualWeight === 'number'
    ) {
        return (item as { actualWeight: number }).actualWeight
    }

    return 0
}

function ProductsSection({
    navigate,
    searchProducts,
    setSearchProducts,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    productsError,
    isLoadingProducts,
    sortedProducts,
    setDeleteProductConfirm,
}: {
    navigate: ReturnType<typeof useNavigate>
    searchProducts: string
    setSearchProducts: (value: string) => void
    sortBy: 'name' | 'price' | 'stock' | 'date'
    setSortBy: (value: 'name' | 'price' | 'stock' | 'date') => void
    sortOrder: 'asc' | 'desc'
    setSortOrder: (value: 'asc' | 'desc') => void
    productsError: string | null
    isLoadingProducts: boolean
    sortedProducts: ProductDto[]
    setDeleteProductConfirm: (value: number | null) => void
}) {
    return (
        <section className="space-y-6">
            <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
                <div className="grid gap-4 xl:grid-cols-[1fr_auto_auto_auto] xl:items-center">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input
                            type="text"
                            placeholder="Поиск по названию, описанию и категории"
                            value={searchProducts}
                            onChange={(event) => setSearchProducts(event.target.value)}
                            className="w-full rounded-2xl border border-stone-300 bg-stone-50 py-3 pl-11 pr-4 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                        />
                    </div>

                    <select
                        value={sortBy}
                        onChange={(event) => setSortBy(event.target.value as 'name' | 'price' | 'stock' | 'date')}
                        className="rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    >
                        <option value="date">По дате</option>
                        <option value="name">По названию</option>
                        <option value="price">По цене</option>
                        <option value="stock">По остатку</option>
                    </select>

                    <select
                        value={sortOrder}
                        onChange={(event) => setSortOrder(event.target.value as 'asc' | 'desc')}
                        className="rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    >
                        <option value="desc">По убыванию</option>
                        <option value="asc">По возрастанию</option>
                    </select>

                    <button
                        onClick={() => navigate('/dashboard/farmer/add-product')}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
                    >
                        <Plus className="h-5 w-5" />
                        Добавить продукт
                    </button>
                </div>
            </div>

            {productsError && <ErrorBanner message={productsError} />}

            {isLoadingProducts ? (
                <LoadingPanel label="Загружаю продукты..." />
            ) : sortedProducts.length > 0 ? (
                <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                    {sortedProducts.map((product) => (
                        <article key={product.productId} className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                            <div className="relative h-52 overflow-hidden bg-[linear-gradient(135deg,#ecfccb_0%,#dcfce7_45%,#f8fafc_100%)]">
                                {product.imageUrl ? (
                                    <img
                                        src={imagesApi.getImageUrl(product.imageUrl)}
                                        alt={product.name}
                                        className="h-full w-full object-cover"
                                        onError={(event) => {
                                            event.currentTarget.style.display = 'none'
                                            const placeholder = event.currentTarget.parentElement?.querySelector('.placeholder')
                                            if (placeholder) (placeholder as HTMLElement).style.display = 'flex'
                                        }}
                                    />
                                ) : null}
                                <div className={`placeholder absolute inset-0 items-center justify-center ${product.imageUrl ? 'hidden' : 'flex'}`}>
                                    <span className="text-5xl">🥬</span>
                                </div>
                            </div>

                            <div className="space-y-5 p-6">
                                <div>
                                    <div className="mb-3 flex flex-wrap items-center gap-2">
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${product.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                            {product.status === 'Available' ? 'В продаже' : 'Нет в наличии'}
                                        </span>
                                        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                                            {product.categoryName || 'Без категории'}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-bold tracking-tight text-stone-950">{product.name}</h3>
                                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-stone-600">
                                        {product.description || 'Описание ещё не добавлено.'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <MetricCard label="Цена" value={`₽ ${product.basePrice.toFixed(2)}`} />
                                    <MetricCard label="Остаток" value={`${product.currentStock} ${product.unit || 'кг'}`} />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => navigate(`/dashboard/farmer/edit-product/${product.productId}`)}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-stone-300 px-4 py-3 font-medium text-stone-800 transition hover:bg-stone-50"
                                    >
                                        <Edit className="h-4 w-4" />
                                        Редактировать
                                    </button>
                                    <button
                                        onClick={() => setDeleteProductConfirm(product.productId)}
                                        className="flex items-center justify-center rounded-2xl border border-rose-200 px-4 py-3 text-rose-600 transition hover:bg-rose-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={<Package className="h-14 w-14 text-stone-400" />}
                    title="Продуктов пока нет"
                    description="Добавьте первую карточку товара, чтобы оживить фермерский каталог."
                    actionLabel="Создать продукт"
                    onAction={() => navigate('/dashboard/farmer/add-product')}
                />
            )}
        </section>
    )
}

function OrdersSection({
    ordersError,
    updateStatusError,
    isLoadingOrders,
    orders,
    getStatusColor,
    getStatusText,
    setOrderForWeights,
    setOrderWeights,
    handleUpdateOrderStatus,
    setSelectedOrder,
}: {
    ordersError: string | null
    updateStatusError: string | null
    isLoadingOrders: boolean
    orders: OrderDto[]
    getStatusColor: (status: string) => string
    getStatusText: (status: string) => string
    setOrderForWeights: (value: OrderDto | null) => void
    setOrderWeights: React.Dispatch<React.SetStateAction<Record<number, number>>>
    handleUpdateOrderStatus: (orderId: number, status: string) => Promise<void>
    setSelectedOrder: (value: OrderDto | null) => void
}) {
    return (
        <section className="space-y-6">
            {ordersError && <ErrorBanner message={ordersError} />}
            {updateStatusError && <ErrorBanner message={updateStatusError} />}

            {isLoadingOrders ? (
                <LoadingPanel label="Загружаю заказы..." />
            ) : orders.length > 0 ? (
                <div className="space-y-5">
                    {orders.map((order) => (
                        <article key={order.orderId} className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Заказ</p>
                                    <h3 className="mt-2 text-2xl font-bold tracking-tight text-stone-950">#{order.orderNumber}</h3>
                                    <p className="mt-2 text-sm text-stone-500">
                                        {format(new Date(order.createdAt), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                                    </p>
                                </div>
                                <span className={`rounded-full px-4 py-2 text-sm font-semibold ${getStatusColor(order.status)}`}>
                                    {getStatusText(order.status)}
                                </span>
                            </div>

                            <div className="mt-6 grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
                                <div className="rounded-[1.5rem] bg-stone-50 p-5">
                                    <div className="space-y-4 text-sm">
                                        <InfoRow label="Сумма" value={`₽ ${order.totalAmount.toFixed(2)}`} />
                                        <InfoRow label="Адрес" value={order.deliveryAddress} />
                                    </div>
                                </div>

                                <div className="rounded-[1.5rem] bg-stone-50 p-5">
                                    <div className="mb-3 flex items-center justify-between">
                                        <h4 className="font-semibold text-stone-900">Состав заказа</h4>
                                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">{order.items.length} поз.</span>
                                    </div>

                                    <div className="space-y-3">
                                        {order.items.map((item, index) => (
                                            <div key={`${order.orderId}-${index}`} className="rounded-2xl bg-white px-4 py-3">
                                                <p className="font-medium text-stone-900">{item.productName || `Товар #${item.productId}`}</p>
                                                <p className="mt-1 text-sm text-stone-600">
                                                    {item.expectedWeight ? `${item.expectedWeight} кг` : `${item.quantity} кг`}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                {order.status === 'AwaitingWeight' && (
                                    <button
                                        onClick={() => {
                                            setOrderForWeights(order)
                                            const initialWeights: Record<number, number> = {}
                                            order.items.forEach((item, index) => {
                                                const itemId = getOrderItemId(item, index)
                                                initialWeights[itemId] = getActualWeight(item) || item.expectedWeight || 0
                                            })
                                            setOrderWeights(initialWeights)
                                        }}
                                        className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-700"
                                    >
                                        <Wallet className="h-4 w-4" />
                                        Указать реальный вес
                                    </button>
                                )}

                                {order.status === 'Delivered' && (
                                    <button
                                        onClick={() => handleUpdateOrderStatus(order.orderId, 'Completed')}
                                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        Закрыть заказ
                                    </button>
                                )}

                                {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                                    <button
                                        onClick={() => setSelectedOrder(order)}
                                        className="inline-flex items-center gap-2 rounded-2xl border border-stone-300 px-5 py-3 font-medium text-stone-800 transition hover:bg-stone-50"
                                    >
                                        Изменить статус
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={<Truck className="h-14 w-14 text-stone-400" />}
                    title="Заказов пока нет"
                    description="Когда покупатели начнут оформлять заказы, здесь появится ваша операционная лента."
                />
            )}
        </section>
    )
}

function WeightDialog({
    order,
    orderWeights,
    setOrderWeights,
    isUpdatingWeights,
    onClose,
    onSave,
}: {
    order: OrderDto
    orderWeights: Record<number, number>
    setOrderWeights: React.Dispatch<React.SetStateAction<Record<number, number>>>
    isUpdatingWeights: boolean
    onClose: () => void
    onSave: () => Promise<void>
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/70 bg-white p-6 shadow-2xl">
                <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Весовой контроль</p>
                    <h2 className="mt-2 text-2xl font-bold text-stone-950">Указать реальный вес заказа #{order.orderNumber}</h2>
                </div>

                <div className="space-y-4">
                    {order.items.map((item, index) => {
                        const itemId = getOrderItemId(item, index)
                        const expectedWeight = item.expectedWeight || 0
                        const currentWeight = orderWeights[itemId] || expectedWeight

                        return (
                            <div key={itemId} className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold text-stone-950">{item.productName || `Товар #${item.productId}`}</h3>
                                    <p className="mt-2 text-sm text-stone-500">Ожидаемый вес: {expectedWeight.toFixed(2)} кг</p>
                                    <p className="text-sm text-stone-500">Цена за кг: ₽ {item.price?.toFixed(2) || '0.00'}</p>
                                </div>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-medium text-stone-700">Реальный вес (кг)</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={currentWeight}
                                        onChange={(event) => {
                                            const weight = parseFloat(event.target.value) || 0
                                            setOrderWeights((prev) => ({ ...prev, [itemId]: weight }))
                                        }}
                                        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                                    />
                                </label>

                                {currentWeight > 0 && (
                                    <p className="mt-3 text-sm font-medium text-emerald-700">Итого: ₽ {(currentWeight * (item.price || 0)).toFixed(2)}</p>
                                )}
                            </div>
                        )
                    })}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isUpdatingWeights}
                        className="rounded-2xl border border-stone-300 px-5 py-3 font-medium text-stone-800 transition hover:bg-stone-50"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={onSave}
                        disabled={isUpdatingWeights}
                        className="rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                        {isUpdatingWeights ? 'Сохранение...' : 'Сохранить вес'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function StatusDialog({
    order,
    getStatusText,
    onClose,
    onPick,
}: {
    order: OrderDto
    getStatusText: (status: string) => string
    onClose: () => void
    onPick: (status: string) => Promise<void>
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white p-6 shadow-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Статус заказа</p>
                <h2 className="mt-2 text-2xl font-bold text-stone-950">Заказ #{order.orderNumber}</h2>
                <p className="mt-2 text-sm text-stone-500">Выберите новый этап исполнения</p>

                <div className="mt-6 space-y-2">
                    {['Pending', 'Confirmed', 'Processing', 'AwaitingWeight', 'ReadyToShip', 'Shipped', 'Delivered', 'Completed', 'Cancelled'].map((status) => (
                        <button
                            key={status}
                            onClick={() => onPick(status)}
                            className={`w-full rounded-2xl px-4 py-3 text-left transition ${order.status.toLowerCase() === status.toLowerCase() ? 'bg-emerald-100 font-semibold text-emerald-800' : 'bg-stone-50 text-stone-700 hover:bg-stone-100'}`}
                        >
                            {getStatusText(status)}
                        </button>
                    ))}
                </div>

                <button
                    onClick={onClose}
                    className="mt-5 w-full rounded-2xl border border-stone-300 px-5 py-3 font-medium text-stone-800 transition hover:bg-stone-50"
                >
                    Отмена
                </button>
            </div>
        </div>
    )
}

function KpiGlassCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-[1.5rem] border border-[#E6D3A7] bg-white/75 p-4 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{label}</p>
            <p className="mt-3 text-2xl font-bold text-stone-900">{value}</p>
        </div>
    )
}

function StatTile({ title, value, subtitle }: { title: string; value: string | number; subtitle: string }) {
    return (
        <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-stone-500">{title}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-stone-950">{value}</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">{subtitle}</p>
        </div>
    )
}

function TabButton({
    active,
    label,
    description,
    icon,
    onClick,
}: {
    active: boolean
    label: string
    description: string
    icon: React.ReactNode
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            className={`rounded-[1.5rem] border px-5 py-4 text-left transition ${active ? 'border-emerald-200 bg-emerald-50 shadow-sm' : 'border-transparent bg-stone-50 hover:border-stone-200 hover:bg-white'}`}
        >
            <div className="flex items-start gap-4">
                <div className={`rounded-2xl p-3 ${active ? 'bg-white text-emerald-700 shadow-sm' : 'bg-white text-stone-600'}`}>{icon}</div>
                <div>
                    <h3 className="text-lg font-semibold text-stone-950">{label}</h3>
                    <p className="mt-1 text-sm leading-6 text-stone-600">{description}</p>
                </div>
            </div>
        </button>
    )
}

function MetricCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-stone-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">{label}</p>
            <p className="mt-2 text-lg font-semibold text-stone-950">{value}</p>
        </div>
    )
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">{label}</p>
            <p className="mt-1 text-sm leading-7 text-stone-700">{value}</p>
        </div>
    )
}

function ErrorBanner({ message }: { message: string }) {
    return <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-rose-700">{message}</div>
}

function LoadingPanel({ label }: { label: string }) {
    return (
        <div className="flex h-64 flex-col items-center justify-center rounded-[1.75rem] border border-stone-200 bg-white shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="mt-4 text-sm text-stone-500">{label}</p>
        </div>
    )
}

function DraftsSection({
    draftsError,
    isLoadingDrafts,
    drafts,
    setDeleteDraftConfirm,
    convertDraftToProduct,
    setEditingDraft,
}: {
    draftsError: string | null
    isLoadingDrafts: boolean
    drafts: ProductDraftDto[]
    setDeleteDraftConfirm: (id: number | null) => void
    convertDraftToProduct: (draft: ProductDraftDto) => void
    setEditingDraft: (draft: ProductDraftDto | null) => void
}) {
    const getStatusColor = (status?: string) => {
        if (!status) return 'text-stone-600 bg-stone-50 border-stone-200'
        switch (status.toLowerCase()) {
            case 'pending':
                return 'text-amber-600 bg-amber-50 border-amber-200'
            case 'syncing':
                return 'text-blue-600 bg-blue-50 border-blue-200'
            case 'synced':
                return 'text-emerald-600 bg-emerald-50 border-emerald-200'
            case 'error':
                return 'text-rose-600 bg-rose-50 border-rose-200'
            default:
                return 'text-stone-600 bg-stone-50 border-stone-200'
        }
    }

    const getStatusText = (status?: string) => {
        if (!status) return 'Неизвестно'
        switch (status.toLowerCase()) {
            case 'pending':
                return 'Ожидает отправки'
            case 'syncing':
                return 'Отправляется'
            case 'synced':
                return 'Отправлен'
            case 'error':
                return 'Ошибка'
            default:
                return status
        }
    }

    if (isLoadingDrafts) return <LoadingPanel label="Загрузка черновиков..." />
    if (draftsError) return <ErrorBanner message={draftsError} />
    if (drafts.length === 0) {
        return (
            <EmptyState
                icon={<FileText className="h-12 w-12 text-stone-300" />}
                title="Черновики отсутствуют"
                description="Создайте черновики на мобильном устройстве для синхронизации"
                actionLabel=""
                onAction={() => { }}
            />
        )
    }

    return (
        <section className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-stone-950">Черновики ({drafts.length})</h2>
                <p className="text-sm text-stone-500">Товары с мобильного устройства</p>
            </div>
            <div className="grid gap-4">
                {drafts.map((draft) => (
                    <div
                        key={draft.draftId}
                        className="rounded-2xl border border-stone-200 bg-stone-50 p-4 transition-all hover:border-stone-300 hover:shadow-sm"
                    >
                        <div className="flex items-start gap-4">
                            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-green-100">
                                {draft.imageUrl ? (
                                    <img
                                        src={imagesApi.getImageUrl(draft.imageUrl)}
                                        alt={draft.name}
                                        className="h-full w-full object-cover"
                                        onError={(event) => {
                                            event.currentTarget.style.display = 'none'
                                            const placeholder = event.currentTarget.parentElement?.querySelector('.placeholder')
                                            if (placeholder) (placeholder as HTMLElement).style.display = 'flex'
                                        }}
                                    />
                                ) : null}
                                <div className={`placeholder absolute inset-0 flex items-center justify-center ${draft.imageUrl ? 'hidden' : 'flex'}`}>
                                    <span className="text-3xl">🥬</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-stone-950">{draft.name}</h3>
                                {draft.description && (
                                    <p className="mt-1 text-sm text-stone-600">{draft.description}</p>
                                )}
                                <div className="mt-3 flex flex-wrap gap-4">
                                    <InfoRow label="Цена" value={`${draft.basePrice.toFixed(2)} ₽`} />
                                    <InfoRow label="Остаток" value={`${draft.currentStock} ${draft.unit}`} />
                                    <InfoRow label="Категория" value={`ID: ${draft.categoryId}`} />
                                </div>
                                {draft.storageConditions && (
                                    <InfoRow label="Условия хранения" value={draft.storageConditions} />
                                )}
                                <div className="mt-3 flex items-center gap-3">
                                    <span
                                        className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(draft.status)}`}
                                    >
                                        {getStatusText(draft.status)}
                                    </span>
                                    {draft.lastError && (
                                        <span className="text-xs text-rose-600">{draft.lastError}</span>
                                    )}
                                </div>
                                <p className="mt-2 text-xs text-stone-400">
                                    Создан: {format(new Date(draft.createdAt), 'dd MMM yyyy, HH:mm', { locale: ru })}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => convertDraftToProduct(draft)}
                                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Опубликовать
                                </button>
                                <button
                                    onClick={() => setEditingDraft(draft)}
                                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                                >
                                    <Edit className="h-4 w-4" />
                                    Редактировать
                                </button>
                                <button
                                    onClick={() => setDeleteDraftConfirm(draft.draftId)}
                                    className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Удалить
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}

function EditDraftModal({
    draft,
    onClose,
    onSave,
}: {
    draft: ProductDraftDto
    onClose: () => void
    onSave: (draftId: number, updates: Partial<ProductDraftDto>) => Promise<void>
}) {
    const [formData, setFormData] = useState<Partial<ProductDraftDto>>({
        name: draft.name,
        description: draft.description,
        basePrice: draft.basePrice,
        currentStock: draft.currentStock,
        unit: draft.unit,
        storageConditions: draft.storageConditions,
        imageUrl: draft.imageUrl,
    })
    const [isUploading, setIsUploading] = useState(false)

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const imageUrl = await imagesApi.upload(file)
            setFormData({ ...formData, imageUrl })
        } catch (error) {
            toast.error('Не удалось загрузить изображение')
        } finally {
            setIsUploading(false)
        }
    }

    const handleImageRemove = () => {
        setFormData({ ...formData, imageUrl: undefined })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-xl font-semibold text-stone-950">Редактировать черновик</h2>
                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-stone-700">Изображение</label>
                        <div className="mt-2 flex items-center gap-4">
                            {formData.imageUrl ? (
                                <div className="relative h-24 w-24 overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-green-100">
                                    <img
                                        src={imagesApi.getImageUrl(formData.imageUrl)}
                                        alt="Preview"
                                        className="h-full w-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleImageRemove}
                                        className="absolute right-1 top-1 rounded-full bg-rose-600 p-1 text-white hover:bg-rose-700"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            ) : (
                                <div className="h-24 w-24 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 flex items-center justify-center">
                                    <span className="text-2xl">🥬</span>
                                </div>
                            )}
                            <div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={isUploading}
                                    className="hidden"
                                    id="image-upload"
                                />
                                <label
                                    htmlFor="image-upload"
                                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-200 disabled:opacity-50"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Загрузка...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4" />
                                            Загрузить изображение
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-stone-700">Название</label>
                        <input
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full rounded-xl border border-stone-200 px-4 py-2 text-stone-900 focus:border-emerald-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-stone-700">Описание</label>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full rounded-xl border border-stone-200 px-4 py-2 text-stone-900 focus:border-emerald-500 focus:outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-stone-700">Цена (₽)</label>
                            <input
                                type="number"
                                value={formData.basePrice || 0}
                                onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                                className="w-full rounded-xl border border-stone-200 px-4 py-2 text-stone-900 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-stone-700">Остаток</label>
                            <input
                                type="number"
                                value={formData.currentStock || 0}
                                onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                                className="w-full rounded-xl border border-stone-200 px-4 py-2 text-stone-900 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-stone-700">Единица измерения</label>
                        <input
                            type="text"
                            value={formData.unit || ''}
                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                            className="w-full rounded-xl border border-stone-200 px-4 py-2 text-stone-900 focus:border-emerald-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-stone-700">Условия хранения</label>
                        <textarea
                            value={formData.storageConditions || ''}
                            onChange={(e) => setFormData({ ...formData, storageConditions: e.target.value })}
                            rows={2}
                            className="w-full rounded-xl border border-stone-200 px-4 py-2 text-stone-900 focus:border-emerald-500 focus:outline-none"
                        />
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={() => onSave(draft.draftId, formData)}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    )
}

function EmptyState({
    icon,
    title,
    description,
    actionLabel,
    onAction,
}: {
    icon: React.ReactNode
    title: string
    description: string
    actionLabel?: string
    onAction?: () => void
}) {
    return (
        <div className="rounded-[1.75rem] border border-stone-200 bg-white p-12 text-center shadow-sm">
            <div className="flex justify-center">{icon}</div>
            <h3 className="mt-5 text-2xl font-bold text-stone-950">{title}</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-stone-600">{description}</p>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
                >
                    <Plus className="h-5 w-5" />
                    {actionLabel}
                </button>
            )}
        </div>
    )
}
