import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
    Calendar,
    CheckCircle2,
    Loader2,
    MessageSquare,
    Search,
    Star,
    ThumbsDown,
    ThumbsUp,
    User,
} from 'lucide-react'
import { useRequireAdmin } from '@/hooks/useRequireAdmin'
import { useAdminStore } from '@/store/adminStore'
import { ReviewDto } from '@/types/backend'
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

const REVIEW_ANNOTATIONS_NAMESPACE = 'reviews'

export default function ReviewsManagement() {
    useRequireAdmin()

    const {
        pendingReviews,
        isLoading,
        error,
        fetchPendingReviews,
        approveReview,
        rejectReview,
    } = useAdminStore()

    const [search, setSearch] = useState('')
    const [selectedReview, setSelectedReview] = useState<ReviewDto | null>(null)
    const [actionError, setActionError] = useState<string | null>(null)
    const [selectedReviewIds, setSelectedReviewIds] = useState<number[]>([])
    const [isBulkUpdating, setIsBulkUpdating] = useState(false)
    const [annotations, setAnnotations] = useState<Record<string, CrmAnnotation>>(() =>
        loadCrmAnnotations(REVIEW_ANNOTATIONS_NAMESPACE)
    )
    const [draftTags, setDraftTags] = useState<Record<string, string>>({})

    useEffect(() => {
        fetchPendingReviews()
    }, [fetchPendingReviews])

    useEffect(() => {
        saveCrmAnnotations(REVIEW_ANNOTATIONS_NAMESPACE, annotations)
    }, [annotations])

    const filteredReviews = useMemo(() => {
        if (search.trim().length === 0) {
            return pendingReviews
        }

        const matched = pendingReviews.filter((review) =>
            matchesAnyField(search, [review.customerName || '', review.comment || '', review.productName || ''], 0.3)
        )

        return rankByRelevance(
            search,
            matched,
            (review) => `${review.customerName || ''} ${review.comment || ''} ${review.productName || ''}`
        )
    }, [pendingReviews, search])

    const stats = useMemo(() => {
        const averageRating =
            filteredReviews.length > 0
                ? filteredReviews.reduce((sum, review) => sum + review.rating, 0) / filteredReviews.length
                : 0

        return {
            total: filteredReviews.length,
            withComment: filteredReviews.filter((review) => Boolean(review.comment?.trim())).length,
            highRating: filteredReviews.filter((review) => review.rating >= 4).length,
            averageRating,
        }
    }, [filteredReviews])

    const handleApprove = async (id: number) => {
        try {
            setActionError(null)
            await approveReview(id)
        } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Не удалось одобрить отзыв')
        }
    }

    const handleReject = async (id: number) => {
        try {
            setActionError(null)
            await rejectReview(id)
            if (selectedReview?.reviewId === id) {
                setSelectedReview(null)
            }
        } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Не удалось отклонить отзыв')
        }
    }

    const toggleReviewSelection = (reviewId: number) => {
        setSelectedReviewIds((current) =>
            current.includes(reviewId) ? current.filter((id) => id !== reviewId) : [...current, reviewId]
        )
    }

    const toggleSelectAllFiltered = () => {
        const filteredIds = filteredReviews.map((review) => review.reviewId)
        const areAllSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedReviewIds.includes(id))

        setSelectedReviewIds((current) =>
            areAllSelected
                ? current.filter((id) => !filteredIds.includes(id))
                : Array.from(new Set([...current, ...filteredIds]))
        )
    }

    const handleBulkAction = async (action: 'approve' | 'reject') => {
        if (selectedReviewIds.length === 0) return

        setIsBulkUpdating(true)
        try {
            setActionError(null)
            await Promise.all(
                selectedReviewIds.map((reviewId) =>
                    action === 'approve' ? approveReview(reviewId) : rejectReview(reviewId)
                )
            )
            setSelectedReviewIds([])
        } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Не удалось выполнить массовое действие')
        } finally {
            setIsBulkUpdating(false)
        }
    }

    const updatePriority = (reviewId: number, priority: CrmPriority) => {
        setAnnotations((current) => setCrmPriority(current, reviewId, priority))
    }

    const addTag = (reviewId: number) => {
        const value = draftTags[String(reviewId)] || ''
        setAnnotations((current) => addCrmTag(current, reviewId, value))
        setDraftTags((current) => ({ ...current, [String(reviewId)]: '' }))
    }

    const removeTag = (reviewId: number, tag: string) => {
        setAnnotations((current) => removeCrmTag(current, reviewId, tag))
    }

    if (isLoading && pendingReviews.length === 0) {
        return <LoadingState />
    }

    return (
        <div className="space-y-8">
            <section className="overflow-hidden rounded-[2rem] border border-green-200 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.14),_transparent_28%),linear-gradient(135deg,#FFFAF0_0%,#FFF8DC_58%,#FFEBCD_100%)] p-8 shadow-sm">
                <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-end">
                    <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-green-700">Reviews CRM</p>
                        <h1 className="text-4xl font-bold tracking-tight text-stone-950">Модерация отзывов без перегруза таблицами</h1>
                        <p className="mt-5 max-w-2xl text-base leading-8 text-stone-700">
                            Экран собран как рабочая CRM-зона: видно очередь на модерацию, качество отзывов и можно
                            быстро принимать решения без переходов по десятку окон.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <StatCard label="На модерации" value={stats.total} icon={<MessageSquare className="h-5 w-5" />} />
                        <StatCard label="С комментарием" value={stats.withComment} icon={<CheckCircle2 className="h-5 w-5" />} />
                        <StatCard label="Оценка 4+" value={stats.highRating} icon={<ThumbsUp className="h-5 w-5" />} />
                        <StatCard label="Средний рейтинг" value={stats.averageRating.toFixed(1)} icon={<Star className="h-5 w-5" />} />
                    </div>
                </div>
            </section>

            {error && <ErrorBanner message={error} />}
            {actionError && <ErrorBanner message={actionError} />}

            <section className="rounded-[1.75rem] border border-green-200 bg-white p-6 shadow-sm">
                <div className="relative max-w-xl">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                        type="text"
                        placeholder="Поиск по имени, продукту или комментарию"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="w-full rounded-2xl border border-stone-300 bg-stone-50 py-3 pl-11 pr-4 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                </div>
            </section>

            <section className="rounded-[1.75rem] border border-green-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-stone-500">Массовая модерация</p>
                        <p className="mt-1 text-sm text-stone-600">
                            Выбрано отзывов: <span className="font-semibold text-stone-900">{selectedReviewIds.length}</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={toggleSelectAllFiltered}
                            className="rounded-2xl border border-stone-300 px-4 py-3 font-medium text-stone-800 transition hover:bg-stone-50"
                        >
                            {filteredReviews.length > 0 && filteredReviews.every((review) => selectedReviewIds.includes(review.reviewId))
                                ? 'Снять выбор'
                                : 'Выбрать все в выборке'}
                        </button>
                        <button
                            onClick={() => handleBulkAction('approve')}
                            disabled={selectedReviewIds.length === 0 || isBulkUpdating}
                            className="rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Одобрить выбранные
                        </button>
                        <button
                            onClick={() => handleBulkAction('reject')}
                            disabled={selectedReviewIds.length === 0 || isBulkUpdating}
                            className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Отклонить выбранные
                        </button>
                    </div>
                </div>
            </section>

            {filteredReviews.length === 0 ? (
                <EmptyState hasFilters={Boolean(search)} onReset={() => setSearch('')} />
            ) : (
                <section className="space-y-4">
                    {filteredReviews.map((review) => (
                        <div key={review.reviewId} className="space-y-4">
                        <article className="rounded-[1.75rem] border border-green-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedReviewIds.includes(review.reviewId)}
                                        onChange={() => toggleReviewSelection(review.reviewId)}
                                        className="h-5 w-5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-[#FFF8DC] text-green-700">
                                        <User className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700">Отзыв #{review.reviewId}</p>
                                        <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-950">
                                            {review.customerName || 'Анонимный пользователь'}
                                        </h2>
                                        <p className="mt-2 text-sm text-stone-500">
                                            Заказ #{review.orderId}
                                            {review.productName ? ` • ${review.productName}` : ''}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <RatingBadge rating={review.rating} />
                                    <PriorityBadge priority={getCrmAnnotation(annotations, review.reviewId).priority} />
                                    <div className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                                        <Calendar className="h-4 w-4" />
                                        {formatDate(review.createdAt)}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]">
                                <div className="rounded-[1.5rem] bg-stone-50 p-5">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">Комментарий</p>
                                    <p className="mt-3 text-sm leading-7 text-stone-700">
                                        {review.comment?.trim() || 'Пользователь не оставил текстовый комментарий.'}
                                    </p>
                                </div>

                                <div className="grid gap-3 lg:w-[220px]">
                                    <button
                                        onClick={() => handleApprove(review.reviewId)}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700"
                                    >
                                        <ThumbsUp className="h-4 w-4" />
                                        Одобрить
                                    </button>
                                    <button
                                        onClick={() => handleReject(review.reviewId)}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 font-semibold text-rose-700 transition hover:bg-rose-100"
                                    >
                                        <ThumbsDown className="h-4 w-4" />
                                        Отклонить
                                    </button>
                                    <button
                                        onClick={() =>
                                            setSelectedReview((current) =>
                                                current?.reviewId === review.reviewId ? null : review
                                            )
                                        }
                                        className="inline-flex items-center justify-center rounded-2xl border border-stone-300 px-4 py-3 font-medium text-stone-800 transition hover:bg-stone-50"
                                    >
                                        Подробнее
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 rounded-[1.5rem] border border-green-200 bg-[linear-gradient(180deg,#ffffff_0%,#FFFAF0_100%)] p-5">
                                <div className="grid gap-4 xl:grid-cols-[220px_1fr]">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">CRM приоритет</p>
                                        <select
                                            value={getCrmAnnotation(annotations, review.reviewId).priority}
                                            onChange={(event) => updatePriority(review.reviewId, event.target.value as CrmPriority)}
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
                                            {getCrmAnnotation(annotations, review.reviewId).tags.map((tag) => (
                                                <button
                                                    key={tag}
                                                    onClick={() => removeTag(review.reviewId, tag)}
                                                    className="rounded-full bg-[#FFF8DC] px-3 py-1 text-xs font-semibold text-green-800"
                                                >
                                                    {tag} ×
                                                </button>
                                            ))}
                                            {getCrmAnnotation(annotations, review.reviewId).tags.length === 0 && (
                                                <span className="text-sm text-stone-500">Тегов пока нет</span>
                                            )}
                                        </div>
                                        <div className="mt-3 flex gap-3">
                                            <input
                                                type="text"
                                                value={draftTags[String(review.reviewId)] || ''}
                                                onChange={(event) =>
                                                    setDraftTags((current) => ({ ...current, [String(review.reviewId)]: event.target.value }))
                                                }
                                                onKeyDown={(event) => event.key === 'Enter' && addTag(review.reviewId)}
                                                placeholder="Например: токсичный комментарий"
                                                className="flex-1 rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                                            />
                                            <button
                                                onClick={() => addTag(review.reviewId)}
                                                className="rounded-2xl border border-green-200 bg-[#FFF8DC] px-4 py-3 font-semibold text-green-800 transition hover:bg-[#FFEBCD]"
                                            >
                                                Добавить тег
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </article>

                        {selectedReview?.reviewId === review.reviewId && (
                            <section className="rounded-[1.75rem] border border-green-200 bg-white shadow-sm">
                                <div className="border-b border-green-100 bg-[linear-gradient(135deg,#FFFAF0_0%,#FFF8DC_100%)] p-6">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700">Review details</p>
                                            <h2 className="mt-2 text-2xl font-bold text-stone-950">
                                                {review.customerName || 'Анонимный пользователь'}
                                            </h2>
                                        </div>
                                        <button
                                            onClick={() => setSelectedReview(null)}
                                            className="rounded-2xl border border-stone-300 px-4 py-2 font-medium text-stone-700 hover:bg-stone-50"
                                        >
                                            Закрыть
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-6 p-6">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <DetailTile
                                            label="Продукт"
                                            value={review.productName || 'Не указан'}
                                            icon={<MessageSquare className="h-4 w-4" />}
                                        />
                                        <DetailTile
                                            label="Дата"
                                            value={formatDate(review.createdAt)}
                                            icon={<Calendar className="h-4 w-4" />}
                                        />
                                    </div>

                                    <div className="rounded-[1.5rem] bg-stone-50 p-5">
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">Оценка</p>
                                        <div className="mt-3 flex items-center gap-3">
                                            <Stars rating={review.rating} />
                                            <span className="text-xl font-bold text-stone-950">{review.rating}.0</span>
                                        </div>
                                    </div>

                                    <div className="rounded-[1.5rem] bg-stone-50 p-5">
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">Комментарий</p>
                                        <p className="mt-3 text-sm leading-7 text-stone-700">
                                            {review.comment?.trim() || 'Пользователь не оставил текстовый комментарий.'}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap justify-end gap-3 border-t border-stone-200 pt-6">
                                        <button
                                            onClick={() => handleReject(review.reviewId)}
                                            className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 font-semibold text-rose-700 transition hover:bg-rose-100"
                                        >
                                            <ThumbsDown className="h-4 w-4" />
                                            Отклонить
                                        </button>
                                        <button
                                            onClick={() => handleApprove(review.reviewId)}
                                            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700"
                                        >
                                            <ThumbsUp className="h-4 w-4" />
                                            Одобрить
                                        </button>
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
        <div className="flex h-64 items-center justify-center">
            <div className="text-center">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-600" />
                <p className="mt-4 text-stone-600">Загрузка отзывов...</p>
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

function EmptyState({ hasFilters, onReset }: { hasFilters: boolean; onReset: () => void }) {
    return (
        <div className="rounded-[1.75rem] border border-green-200 bg-[linear-gradient(180deg,#ffffff_0%,#FFFAF0_100%)] p-12 text-center shadow-sm">
            <div className="mx-auto mb-5 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF8DC]">
                <CheckCircle2 className="h-10 w-10 text-green-700" />
            </div>
            <h3 className="text-2xl font-bold text-stone-950">
                {hasFilters ? 'Ничего не найдено по запросу' : 'Очередь модерации сейчас пуста'}
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-stone-600">
                {hasFilters
                    ? 'Попробуйте изменить поисковый запрос, чтобы увидеть другие отзывы.'
                    : 'Все отзывы обработаны. Новые карточки появятся здесь автоматически.'}
            </p>
            {hasFilters && (
                <button
                    onClick={onReset}
                    className="mt-6 rounded-2xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
                >
                    Сбросить поиск
                </button>
            )}
        </div>
    )
}

function DetailTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="rounded-[1.5rem] bg-stone-50 p-5">
            <div className="mb-3 inline-flex rounded-xl bg-white p-2 text-stone-600 shadow-sm">{icon}</div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">{label}</p>
            <p className="mt-2 text-sm leading-7 text-stone-700">{value}</p>
        </div>
    )
}

function RatingBadge({ rating }: { rating: number }) {
    return (
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
            <Stars rating={rating} />
            {rating}.0
        </div>
    )
}

function PriorityBadge({ priority }: { priority: CrmPriority }) {
    const config = {
        normal: 'bg-emerald-100 text-emerald-800',
        medium: 'bg-sky-100 text-sky-800',
        high: 'bg-amber-100 text-amber-800',
        critical: 'bg-rose-100 text-rose-800',
    }

    const label = {
        normal: 'Норма',
        medium: 'Средний',
        high: 'Высокий',
        critical: 'Критично',
    }

    return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${config[priority]}`}>{label[priority]}</span>
}

function Stars({ rating }: { rating: number }) {
    return (
        <div className="flex">
            {[...Array(5)].map((_, index) => (
                <Star
                    key={index}
                    className={`h-4 w-4 ${index < rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`}
                />
            ))}
        </div>
    )
}

function formatDate(dateString: string) {
    return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: ru })
}
