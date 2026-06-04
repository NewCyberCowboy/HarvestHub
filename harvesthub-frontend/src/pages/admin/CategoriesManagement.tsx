import { useEffect, useMemo, useState } from 'react'
import {
    ChevronDown,
    ChevronRight,
    Edit,
    FolderTree,
    Loader2,
    Plus,
    Search,
    Trash2,
} from 'lucide-react'
import CategoryForm from '@/components/admin/CategoryForm'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useRequireAdmin } from '@/hooks/useRequireAdmin'
import { useAdminStore } from '@/store/adminStore'
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from '@/types/backend'
import { matchesAnyField, rankByRelevance } from '@/utils/trigramSearch'

export default function CategoriesManagement() {
    useRequireAdmin()

    const {
        categories,
        isLoading,
        error,
        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory,
    } = useAdminStore()

    const [search, setSearch] = useState('')
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
    const [deleteError, setDeleteError] = useState<string | null>(null)
    const [formError, setFormError] = useState<string | null>(null)
    const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())
    const [viewMode, setViewMode] = useState<'list' | 'tree'>('list')

    useEffect(() => {
        fetchCategories()
    }, [fetchCategories])

    const filteredCategories = useMemo(() => {
        if (search.trim().length === 0) {
            return categories
        }

        const matched = categories.filter((category) =>
            matchesAnyField(search, [category.name || '', category.description || '', category.parentName || ''], 0.3)
        )

        return rankByRelevance(
            search,
            matched,
            (category) => `${category.name || ''} ${category.description || ''} ${category.parentName || ''}`
        )
    }, [categories, search])

    const stats = useMemo(() => {
        const roots = categories.filter((category) => !category.parentId).length
        const children = categories.filter((category) => Boolean(category.parentId)).length

        return {
            total: categories.length,
            roots,
            children,
            visible: filteredCategories.length,
        }
    }, [categories, filteredCategories])

    const toggleExpand = (categoryId: number) => {
        setExpandedCategories((prev) => {
            const next = new Set(prev)
            if (next.has(categoryId)) {
                next.delete(categoryId)
            } else {
                next.add(categoryId)
            }
            return next
        })
    }

    const handleCreateCategory = async (data: CreateCategoryDto) => {
        try {
            setFormError(null)
            await createCategory(data)
            setIsFormOpen(false)
        } catch (error) {
            setFormError(error instanceof Error ? error.message : 'Не удалось создать категорию')
        }
    }

    const handleUpdateCategory = async (id: number, data: UpdateCategoryDto) => {
        try {
            setFormError(null)
            await updateCategory(id, data)
            setEditingCategory(null)
            setIsFormOpen(false)
        } catch (error) {
            setFormError(error instanceof Error ? error.message : 'Не удалось обновить категорию')
        }
    }

    const handleDeleteCategory = async (id: number) => {
        try {
            setDeleteError(null)
            await deleteCategory(id)
            setDeleteConfirm(null)
        } catch (error) {
            setDeleteError(error instanceof Error ? error.message : 'Не удалось удалить категорию')
        }
    }

    if (isLoading && categories.length === 0) {
        return <LoadingState />
    }

    return (
        <div className="space-y-8">
            <section className="overflow-hidden rounded-[2rem] border border-green-200 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.14),_transparent_28%),linear-gradient(135deg,#FFFAF0_0%,#FFF8DC_58%,#FFEBCD_100%)] p-8 shadow-sm">
                <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
                    <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-green-700">Categories CRM</p>
                        <h1 className="text-4xl font-bold tracking-tight text-stone-950">Управление структурой категорий</h1>
                        <p className="mt-5 max-w-2xl text-base leading-8 text-stone-700">
                            Здесь видно дерево каталога, корневые и дочерние разделы, а также все быстрые действия для
                            редактирования структуры витрины.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <StatCard label="Всего категорий" value={stats.total} icon={<FolderTree className="h-5 w-5" />} />
                        <StatCard label="Корневых" value={stats.roots} icon={<ChevronRight className="h-5 w-5" />} />
                        <StatCard label="Дочерних" value={stats.children} icon={<ChevronDown className="h-5 w-5" />} />
                        <StatCard label="В выборке" value={stats.visible} icon={<Search className="h-5 w-5" />} />
                    </div>
                </div>
            </section>

            {error && <ErrorBanner message={error} />}

            <section className="rounded-[1.75rem] border border-green-200 bg-white p-6 shadow-sm">
                <div className="grid gap-4 xl:grid-cols-[1fr_auto_auto]">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input
                            type="text"
                            placeholder="Поиск по названию, описанию или родительской категории"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="w-full rounded-2xl border border-stone-300 bg-stone-50 py-3 pl-11 pr-4 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                        />
                    </div>

                    <button
                        onClick={() => setViewMode(viewMode === 'list' ? 'tree' : 'list')}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-300 px-5 py-3 font-medium text-stone-800 transition hover:bg-stone-50"
                    >
                        <FolderTree className="h-4 w-4" />
                        {viewMode === 'list' ? 'Дерево' : 'Список'}
                    </button>

                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
                    >
                        <Plus className="h-4 w-4" />
                        Добавить категорию
                    </button>
                </div>
            </section>

            {isFormOpen && !editingCategory && (
                <CategoryForm
                    embedded
                    categories={categories}
                    error={formError}
                    onSubmit={async (data: CreateCategoryDto | UpdateCategoryDto) => {
                        await handleCreateCategory(data as CreateCategoryDto)
                    }}
                    onClose={() => {
                        setIsFormOpen(false)
                        setEditingCategory(null)
                        setFormError(null)
                    }}
                />
            )}

            {filteredCategories.length === 0 ? (
                <EmptyState
                    hasFilters={Boolean(search)}
                    onReset={() => setSearch('')}
                    onCreate={() => setIsFormOpen(true)}
                />
            ) : viewMode === 'list' ? (
                <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {filteredCategories.map((category) => (
                        <div key={category.categoryId} className="contents">
                        <article className="rounded-[1.75rem] border border-green-200 bg-white p-6 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700">Category ID {category.categoryId}</p>
                                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-950">{category.name}</h2>
                                    <p className="mt-2 text-sm text-stone-500">
                                        {category.parentName ? `Родитель: ${category.parentName}` : 'Корневая категория'}
                                    </p>
                                </div>
                                <span className="rounded-full bg-[#FFF8DC] px-3 py-1 text-xs font-semibold text-green-700">
                                    {category.children?.length || 0} дочерних
                                </span>
                            </div>

                            <div className="mt-6 rounded-[1.5rem] bg-stone-50 p-5">
                                <InfoRow label="Описание" value={category.description || 'Описание пока не добавлено'} />
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => setEditingCategory(category)}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 font-medium text-sky-700 transition hover:bg-sky-100"
                                >
                                    <Edit className="h-4 w-4" />
                                    Редактировать
                                </button>
                                <button
                                    onClick={() => setDeleteConfirm(category.categoryId)}
                                    className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 transition hover:bg-rose-100"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </article>
                        {editingCategory?.categoryId === category.categoryId && (
                            <div className="md:col-span-2 2xl:col-span-3">
                                <CategoryForm
                                    embedded
                                    category={editingCategory}
                                    categories={categories}
                                    error={formError}
                                    onSubmit={async (data: CreateCategoryDto | UpdateCategoryDto) => {
                                        await handleUpdateCategory(editingCategory.categoryId, data as UpdateCategoryDto)
                                    }}
                                    onClose={() => {
                                        setIsFormOpen(false)
                                        setEditingCategory(null)
                                        setFormError(null)
                                    }}
                                />
                            </div>
                        )}
                        </div>
                    ))}
                </section>
            ) : (
                <section className="rounded-[1.75rem] border border-green-200 bg-white p-6 shadow-sm">
                    <div className="space-y-3">{renderCategoryTree(filteredCategories, expandedCategories, toggleExpand, setEditingCategory, setDeleteConfirm)}</div>
                </section>
            )}

            {deleteConfirm && (
                <ConfirmDialog
                    title="Удалить категорию?"
                    message={
                        <div>
                            <p className="mb-2">Вы уверены, что хотите удалить эту категорию? Все дочерние категории также будут удалены.</p>
                            {deleteError && (
                                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    <strong>Ошибка:</strong> {deleteError}
                                </div>
                            )}
                        </div>
                    }
                    confirmText="Удалить"
                    cancelText="Отмена"
                    onConfirm={() => handleDeleteCategory(deleteConfirm)}
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
                <p className="mt-4 text-stone-600">Загрузка категорий...</p>
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
                <FolderTree className="h-10 w-10 text-green-700" />
            </div>
            <h3 className="text-2xl font-bold text-stone-950">Категории не найдены</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-stone-600">
                {hasFilters
                    ? 'Попробуйте изменить поисковый запрос, чтобы увидеть другие категории.'
                    : 'Каталог категорий пока пуст. Добавьте первую структуру для товаров.'}
            </p>
            <div className="mt-6 flex justify-center gap-3">
                {hasFilters && (
                    <button onClick={onReset} className="rounded-2xl border border-stone-300 px-5 py-3 font-medium text-stone-800 hover:bg-stone-50">
                        Сбросить поиск
                    </button>
                )}
                <button onClick={onCreate} className="rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700">
                    Добавить категорию
                </button>
            </div>
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

function renderCategoryTree(
    categories: CategoryDto[],
    expandedCategories: Set<number>,
    toggleExpand: (categoryId: number) => void,
    setEditingCategory: (category: CategoryDto) => void,
    setDeleteConfirm: (id: number) => void,
    parentId?: number,
    level = 0
): React.ReactNode {
    const children = categories.filter((category) => category.parentId === parentId)

    return children.map((category) => {
        const hasChildren = categories.some((item) => item.parentId === category.categoryId)
        const isExpanded = expandedCategories.has(category.categoryId)

        return (
            <div key={category.categoryId} className="space-y-3">
                <article
                    className="rounded-[1.5rem] border border-green-200 bg-[linear-gradient(180deg,#ffffff_0%,#FFFAF0_100%)] p-5"
                    style={{ marginLeft: `${level * 20}px` }}
                >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            {hasChildren ? (
                                <button
                                    onClick={() => toggleExpand(category.categoryId)}
                                    className="mt-1 rounded-xl border border-stone-200 bg-white p-2 text-stone-600 hover:bg-stone-50"
                                >
                                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </button>
                            ) : (
                                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF8DC] text-green-700">
                                    <FolderTree className="h-4 w-4" />
                                </div>
                            )}

                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700">Category ID {category.categoryId}</p>
                                <h3 className="mt-2 text-xl font-bold text-stone-950">{category.name}</h3>
                                <p className="mt-2 text-sm text-stone-500">
                                    {category.parentName ? `Родитель: ${category.parentName}` : 'Корневая категория'}
                                </p>
                                {category.description && <p className="mt-3 text-sm leading-7 text-stone-700">{category.description}</p>}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setEditingCategory(category)}
                                className="inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 font-medium text-sky-700 transition hover:bg-sky-100"
                            >
                                <Edit className="h-4 w-4" />
                                Редактировать
                            </button>
                            <button
                                onClick={() => setDeleteConfirm(category.categoryId)}
                                className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 font-medium text-rose-700 transition hover:bg-rose-100"
                            >
                                <Trash2 className="h-4 w-4" />
                                Удалить
                            </button>
                        </div>
                    </div>
                </article>

                {hasChildren &&
                    isExpanded &&
                    renderCategoryTree(categories, expandedCategories, toggleExpand, setEditingCategory, setDeleteConfirm, category.categoryId, level + 1)}
            </div>
        )
    })
}
