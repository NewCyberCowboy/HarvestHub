import { useEffect, useMemo, useState } from 'react'
import { Edit, Eye, Loader2, Package, Plus, Search, Tag, Trash2 } from 'lucide-react'
import ProductForm from '@/components/admin/ProductForm'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useRequireAdmin } from '@/hooks/useRequireAdmin'
import { useAdminStore } from '@/store/adminStore'
import { useCategoriesStore } from '@/store/categoriesStore'
import { CreateProductDto, ProductDto, ProductStatus, UpdateProductDto } from '@/types/backend'
import { matchesAnyField, rankByRelevance } from '@/utils/trigramSearch'

export default function ProductsManagement() {
    useRequireAdmin()

    const {
        products,
        isLoading,
        error,
        fetchProducts,
        createProduct,
        updateProduct,
        deleteProduct,
    } = useAdminStore()

    const { categories, fetchCategories } = useCategoriesStore()

    const [search, setSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [selectedStatus, setSelectedStatus] = useState<string>('all')
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    useEffect(() => {
        fetchProducts()
        fetchCategories()
    }, [fetchProducts, fetchCategories])

    const filteredProducts = useMemo(() => {
        let filtered = products.filter((product) => {
            const matchesCategory = selectedCategory === 'all' || product.categoryId.toString() === selectedCategory
            const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus
            return matchesCategory && matchesStatus
        })

        if (search.trim().length > 0) {
            filtered = filtered.filter((product) =>
                matchesAnyField(search, [product.name, product.description || '', product.categoryName || ''], 0.3)
            )

            filtered = rankByRelevance(
                search,
                filtered,
                (product) => `${product.name} ${product.description || ''} ${product.categoryName || ''}`
            )
        }

        return filtered
    }, [products, search, selectedCategory, selectedStatus])

    const stats = useMemo(() => {
        return {
            total: filteredProducts.length,
            available: filteredProducts.filter((product) => product.status === ProductStatus.Available).length,
            lowStock: filteredProducts.filter((product) => product.currentStock > 0 && product.currentStock < 10).length,
            categories: new Set(filteredProducts.map((product) => product.categoryId)).size,
        }
    }, [filteredProducts])

    const handleCreateProduct = async (data: CreateProductDto) => {
        await createProduct(data)
        setIsFormOpen(false)
    }

    const handleUpdateProduct = async (id: number, data: UpdateProductDto) => {
        await updateProduct(id, data)
        setEditingProduct(null)
    }

    const handleDeleteProduct = async (id: number) => {
        try {
            setDeleteError(null)
            await deleteProduct(id)
            setDeleteConfirm(null)
        } catch (error) {
            setDeleteError(error instanceof Error ? error.message : 'Не удалось удалить продукт')
        }
    }

    if (isLoading && products.length === 0) {
        return <LoadingState />
    }

    return (
        <div className="space-y-8">
            <section className="overflow-hidden rounded-[2rem] border border-green-200 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.14),_transparent_28%),linear-gradient(135deg,#FFFAF0_0%,#FFF8DC_58%,#FFEBCD_100%)] p-8 shadow-sm">
                <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-end">
                    <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-green-700">Catalog CRM</p>
                        <h1 className="text-4xl font-bold tracking-tight text-stone-950">Управление каталогом и товарной витриной</h1>
                        <p className="mt-5 max-w-2xl text-base leading-8 text-stone-700">
                            Смотри остатки, статусы и структуру ассортимента без тяжёлой таблицы. Основные сигналы и действия
                            собраны на одном экране.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <StatCard label="В выборке" value={stats.total} icon={<Package className="h-5 w-5" />} />
                        <StatCard label="В продаже" value={stats.available} icon={<Tag className="h-5 w-5" />} />
                        <StatCard label="Низкий остаток" value={stats.lowStock} icon={<Search className="h-5 w-5" />} />
                        <StatCard label="Категорий" value={stats.categories} icon={<Tag className="h-5 w-5" />} />
                    </div>
                </div>
            </section>

            {error && <ErrorBanner message={error} />}

            <section className="rounded-[1.75rem] border border-green-200 bg-white p-6 shadow-sm">
                <div className="grid gap-4 xl:grid-cols-[1fr_260px_260px_auto]">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input
                            type="text"
                            placeholder="Поиск по названию, описанию и категории"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="w-full rounded-2xl border border-stone-300 bg-stone-50 py-3 pl-11 pr-4 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                        />
                    </div>

                    <select
                        value={selectedCategory}
                        onChange={(event) => setSelectedCategory(event.target.value)}
                        className="rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    >
                        <option value="all">Все категории</option>
                        {categories.map((category) => (
                            <option key={category.categoryId} value={category.categoryId}>
                                {category.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={selectedStatus}
                        onChange={(event) => setSelectedStatus(event.target.value)}
                        className="rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    >
                        <option value="all">Все статусы</option>
                        {Object.values(ProductStatus).map((status) => (
                            <option key={status} value={status}>
                                {getStatusLabel(status)}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
                    >
                        <Plus className="h-5 w-5" />
                        Добавить продукт
                    </button>
                </div>
            </section>

            {isFormOpen && !editingProduct && (
                <ProductForm
                    embedded
                    onSubmit={async (data: CreateProductDto | UpdateProductDto) => {
                        await handleCreateProduct(data as CreateProductDto)
                    }}
                    onClose={() => {
                        setIsFormOpen(false)
                        setEditingProduct(null)
                    }}
                />
            )}

            {filteredProducts.length === 0 ? (
                <EmptyState
                    hasFilters={Boolean(search || selectedCategory !== 'all' || selectedStatus !== 'all')}
                    onReset={() => {
                        setSearch('')
                        setSelectedCategory('all')
                        setSelectedStatus('all')
                    }}
                    onCreate={() => setIsFormOpen(true)}
                />
            ) : (
                <section className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                    {filteredProducts.map((product) => (
                        <div key={product.productId} className="contents">
                        <article className="overflow-hidden rounded-[1.75rem] border border-green-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                            <div className="flex items-start justify-between border-b border-green-100 bg-[linear-gradient(135deg,#FFFAF0_0%,#FFF8DC_100%)] p-5">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-700">
                                        ID {product.productId}
                                    </p>
                                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-950">{product.name}</h2>
                                </div>
                                <StatusBadge status={product.status} />
                            </div>

                            <div className="space-y-5 p-6">
                                <div className="rounded-[1.5rem] bg-stone-50 p-5">
                                    <InfoRow label="Категория" value={product.categoryName || 'Без категории'} />
                                    <div className="mt-4">
                                        <InfoRow label="Описание" value={product.description || 'Описание пока не добавлено'} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <MetricCard label="Цена" value={`₽ ${product.basePrice.toFixed(2)}`} />
                                    <MetricCard label="Остаток" value={`${product.currentStock} ${product.unit || 'кг'}`} />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => window.open(`/products/${product.productId}`, '_blank')}
                                        className="flex items-center justify-center rounded-2xl border border-stone-300 px-4 py-3 text-stone-700 transition hover:bg-stone-50"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setEditingProduct(product)}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 font-medium text-sky-700 transition hover:bg-sky-100"
                                    >
                                        <Edit className="h-4 w-4" />
                                        Редактировать
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(product.productId)}
                                        className="flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 transition hover:bg-rose-100"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </article>
                        {editingProduct?.productId === product.productId && (
                            <div className="md:col-span-2 2xl:col-span-3">
                                <ProductForm
                                    embedded
                                    product={editingProduct}
                                    onSubmit={async (data: CreateProductDto | UpdateProductDto) => {
                                        await handleUpdateProduct(editingProduct.productId, data as UpdateProductDto)
                                    }}
                                    onClose={() => {
                                        setEditingProduct(null)
                                        setIsFormOpen(false)
                                    }}
                                />
                            </div>
                        )}
                        </div>
                    ))}
                </section>
            )}

            {deleteConfirm && (
                <ConfirmDialog
                    title="Удалить продукт?"
                    message={
                        <div>
                            <p className="mb-2">Вы уверены, что хотите удалить этот продукт? Это действие нельзя отменить.</p>
                            {deleteError && (
                                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    <strong>Ошибка:</strong> {deleteError}
                                </div>
                            )}
                        </div>
                    }
                    confirmText="Удалить"
                    cancelText="Отмена"
                    onConfirm={() => handleDeleteProduct(deleteConfirm)}
                    onCancel={() => {
                        setDeleteConfirm(null)
                        setDeleteError(null)
                    }}
                    variant="danger"
                />
            )}
        </div>
    )
}

function LoadingState() {
    return (
        <div className="flex h-64 items-center justify-center">
            <div className="text-center">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-600" />
                <p className="mt-4 text-stone-600">Загрузка продуктов...</p>
            </div>
        </div>
    )
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
    return (
        <div className="rounded-[1.5rem] border border-green-200 bg-white/75 p-4">
            <div className="mb-3 inline-flex rounded-2xl bg-[#FFF8DC] p-3 text-green-700">{icon}</div>
            <p className="text-sm font-medium text-stone-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-stone-950">{value}</p>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    return (
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(status)}`}>
            {getStatusLabel(status)}
        </span>
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
            <p className="mt-2 text-sm leading-7 text-stone-700">{value}</p>
        </div>
    )
}

function ErrorBanner({ message }: { message: string }) {
    return <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-rose-700">{message}</div>
}

function EmptyState({
    hasFilters,
    onReset,
    onCreate,
}: {
    hasFilters: boolean
    onReset: () => void
    onCreate: () => void
}) {
    return (
        <div className="rounded-[1.75rem] border border-green-200 bg-[linear-gradient(180deg,#ffffff_0%,#FFFAF0_100%)] p-12 text-center shadow-sm">
            <div className="mx-auto mb-5 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF8DC]">
                <Package className="h-10 w-10 text-stone-400" />
            </div>
            <h3 className="text-2xl font-bold text-stone-950">Продуктов не найдено</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-stone-600">
                {hasFilters
                    ? 'Попробуйте изменить фильтры или поисковый запрос.'
                    : 'Каталог пока пуст. Добавьте первую карточку товара.'}
            </p>
            <div className="mt-6 flex justify-center gap-3">
                {hasFilters && (
                    <button onClick={onReset} className="rounded-2xl border border-stone-300 px-5 py-3 font-medium text-stone-800 hover:bg-stone-50">
                        Сбросить фильтры
                    </button>
                )}
                <button onClick={onCreate} className="rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700">
                    Добавить продукт
                </button>
            </div>
        </div>
    )
}

function getStatusColor(status: string) {
    switch (status) {
        case ProductStatus.Available:
            return 'bg-green-100 text-green-800'
        case ProductStatus.OutOfStock:
            return 'bg-red-100 text-red-800'
        case ProductStatus.ComingSoon:
            return 'bg-blue-100 text-blue-800'
        case ProductStatus.Discontinued:
            return 'bg-stone-100 text-stone-700'
        default:
            return 'bg-stone-100 text-stone-700'
    }
}

function getStatusLabel(status: string) {
    switch (status) {
        case ProductStatus.Available:
            return 'В наличии'
        case ProductStatus.OutOfStock:
            return 'Нет в наличии'
        case ProductStatus.ComingSoon:
            return 'Скоро в продаже'
        case ProductStatus.Discontinued:
            return 'Снят с продажи'
        default:
            return status
    }
}
