import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { farmerApplicationsApi, FarmerApplicationDto, ReviewFarmerApplicationDto } from '@/api/farmerApplications.api'
import { CheckCircle, Clock, Eye, FileText, Loader2, MessageSquare, XCircle } from 'lucide-react'
import AnchoredModalShell from '@/components/ui/AnchoredModalShell'
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

const APPLICATION_ANNOTATIONS_NAMESPACE = 'farmer-applications'

export default function FarmerApplicationsManagement() {
    const [applications, setApplications] = useState<FarmerApplicationDto[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [actionError, setActionError] = useState<string | null>(null)
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
    const [selectedApplication, setSelectedApplication] = useState<FarmerApplicationDto | null>(null)
    const [reviewNotes, setReviewNotes] = useState('')
    const [isReviewing, setIsReviewing] = useState(false)
    const [selectedApplicationIds, setSelectedApplicationIds] = useState<number[]>([])
    const [isBulkReviewing, setIsBulkReviewing] = useState(false)
    const [annotations, setAnnotations] = useState<Record<string, CrmAnnotation>>(() =>
        loadCrmAnnotations(APPLICATION_ANNOTATIONS_NAMESPACE)
    )
    const [draftTags, setDraftTags] = useState<Record<string, string>>({})

    const loadApplications = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const data =
                filter === 'pending'
                    ? await farmerApplicationsApi.getPendingApplications()
                    : await farmerApplicationsApi.getAllApplications()
            setApplications(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось загрузить заявки')
        } finally {
            setIsLoading(false)
        }
    }, [filter])

    useEffect(() => {
        loadApplications()
    }, [loadApplications])

    useEffect(() => {
        saveCrmAnnotations(APPLICATION_ANNOTATIONS_NAMESPACE, annotations)
    }, [annotations])

    const stats = useMemo(() => {
        return {
            total: applications.length,
            pending: applications.filter((application) => application.status === 'Pending').length,
            approved: applications.filter((application) => application.status === 'Approved').length,
            rejected: applications.filter((application) => application.status === 'Rejected').length,
        }
    }, [applications])

    const filteredApplications =
        filter === 'all' ? applications : applications.filter((application) => application.status.toLowerCase() === filter)

    const handleReview = async (applicationId: number, status: 'Approved' | 'Rejected') => {
        setIsReviewing(true)
        try {
            setActionError(null)
            const reviewDto: ReviewFarmerApplicationDto = {
                status,
                adminNotes: reviewNotes.trim() || undefined,
            }
            await farmerApplicationsApi.reviewApplication(applicationId, reviewDto)
            setSelectedApplication(null)
            setReviewNotes('')
            await loadApplications()
        } catch (err) {
            setActionError(err instanceof Error ? err.message : 'Не удалось обработать заявку')
        } finally {
            setIsReviewing(false)
        }
    }

    const pendingApplications = filteredApplications.filter((application) => application.status === 'Pending')

    const toggleApplicationSelection = (applicationId: number) => {
        setSelectedApplicationIds((current) =>
            current.includes(applicationId) ? current.filter((id) => id !== applicationId) : [...current, applicationId]
        )
    }

    const toggleSelectAllPending = () => {
        const pendingIds = pendingApplications.map((application) => application.applicationId)
        const areAllSelected = pendingIds.length > 0 && pendingIds.every((id) => selectedApplicationIds.includes(id))

        setSelectedApplicationIds((current) =>
            areAllSelected
                ? current.filter((id) => !pendingIds.includes(id))
                : Array.from(new Set([...current, ...pendingIds]))
        )
    }

    const handleBulkReview = async (status: 'Approved' | 'Rejected') => {
        if (selectedApplicationIds.length === 0) return

        setIsBulkReviewing(true)
        try {
            setActionError(null)
            await Promise.all(
                selectedApplicationIds.map((applicationId) =>
                    farmerApplicationsApi.reviewApplication(applicationId, { status })
                )
            )
            setSelectedApplicationIds([])
            await loadApplications()
        } catch (err) {
            setActionError(err instanceof Error ? err.message : 'Не удалось обработать выбранные заявки')
        } finally {
            setIsBulkReviewing(false)
        }
    }

    const updatePriority = (applicationId: number, priority: CrmPriority) => {
        setAnnotations((current) => setCrmPriority(current, applicationId, priority))
    }

    const addTag = (applicationId: number) => {
        const value = draftTags[String(applicationId)] || ''
        setAnnotations((current) => addCrmTag(current, applicationId, value))
        setDraftTags((current) => ({ ...current, [String(applicationId)]: '' }))
    }

    const removeTag = (applicationId: number, tag: string) => {
        setAnnotations((current) => removeCrmTag(current, applicationId, tag))
    }

    if (isLoading && applications.length === 0) {
        return <LoadingState />
    }

    return (
        <div className="space-y-8">
            <section className="overflow-hidden rounded-[2rem] border border-green-200 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.14),_transparent_28%),linear-gradient(135deg,#FFFAF0_0%,#FFF8DC_58%,#FFEBCD_100%)] p-8 shadow-sm">
                <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
                    <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-green-700">Applications CRM</p>
                        <h1 className="text-4xl font-bold tracking-tight text-stone-950">Управление заявками на роль фермера</h1>
                        <p className="mt-5 max-w-2xl text-base leading-8 text-stone-700">
                            Экран собран как операционная CRM-зона: сразу видно очередь на рассмотрение, статусы по
                            заявкам и можно быстро перейти к решению по каждой карточке.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <StatCard label="Всего заявок" value={stats.total} icon={<FileText className="h-5 w-5" />} />
                        <StatCard label="На рассмотрении" value={stats.pending} icon={<Clock className="h-5 w-5" />} />
                        <StatCard label="Одобрено" value={stats.approved} icon={<CheckCircle className="h-5 w-5" />} />
                        <StatCard label="Отклонено" value={stats.rejected} icon={<XCircle className="h-5 w-5" />} />
                    </div>
                </div>
            </section>

            {error && <ErrorBanner message={error} />}
            {actionError && <ErrorBanner message={actionError} />}

            <section className="rounded-[1.75rem] border border-green-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap gap-3">
                    <FilterButton label="Все" isActive={filter === 'all'} onClick={() => setFilter('all')} />
                    <FilterButton
                        label={`На рассмотрении${stats.pending > 0 ? ` (${stats.pending})` : ''}`}
                        isActive={filter === 'pending'}
                        onClick={() => setFilter('pending')}
                    />
                    <FilterButton
                        label={`Одобренные${stats.approved > 0 ? ` (${stats.approved})` : ''}`}
                        isActive={filter === 'approved'}
                        onClick={() => setFilter('approved')}
                    />
                    <FilterButton
                        label={`Отклонённые${stats.rejected > 0 ? ` (${stats.rejected})` : ''}`}
                        isActive={filter === 'rejected'}
                        onClick={() => setFilter('rejected')}
                    />
                </div>
            </section>

            <section className="rounded-[1.75rem] border border-green-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-stone-500">Массовое рассмотрение</p>
                        <p className="mt-1 text-sm text-stone-600">
                            Выбрано заявок: <span className="font-semibold text-stone-900">{selectedApplicationIds.length}</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={toggleSelectAllPending}
                            className="rounded-2xl border border-stone-300 px-4 py-3 font-medium text-stone-800 transition hover:bg-stone-50"
                        >
                            {pendingApplications.length > 0 && pendingApplications.every((application) => selectedApplicationIds.includes(application.applicationId))
                                ? 'Снять выбор'
                                : 'Выбрать все pending'}
                        </button>
                        <button
                            onClick={() => handleBulkReview('Approved')}
                            disabled={selectedApplicationIds.length === 0 || isBulkReviewing}
                            className="rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Одобрить выбранные
                        </button>
                        <button
                            onClick={() => handleBulkReview('Rejected')}
                            disabled={selectedApplicationIds.length === 0 || isBulkReviewing}
                            className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Отклонить выбранные
                        </button>
                    </div>
                </div>
            </section>

            {isLoading ? (
                <LoadingState />
            ) : filteredApplications.length === 0 ? (
                <EmptyState filter={filter} />
            ) : (
                <section className="space-y-4">
                    {filteredApplications.map((application) => (
                        <article key={application.applicationId} className="rounded-[1.75rem] border border-green-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    {application.status === 'Pending' ? (
                                        <input
                                            type="checkbox"
                                            checked={selectedApplicationIds.includes(application.applicationId)}
                                            onChange={() => toggleApplicationSelection(application.applicationId)}
                                            className="mt-1 h-5 w-5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                    ) : (
                                        <div className="h-5 w-5" />
                                    )}
                                    <div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700">
                                            Application #{application.applicationId}
                                        </p>
                                        <StatusBadge status={application.status} />
                                        <PriorityBadge priority={getCrmAnnotation(annotations, application.applicationId).priority} />
                                    </div>
                                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-950">
                                        {application.userName || application.userEmail}
                                    </h2>
                                    <p className="mt-2 text-sm text-stone-500">{application.userEmail}</p>
                                    </div>
                                </div>

                                {application.status === 'Pending' && (
                                    <button
                                        onClick={() => setSelectedApplication(application)}
                                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
                                    >
                                        <Eye className="h-4 w-4" />
                                        Рассмотреть
                                    </button>
                                )}
                            </div>

                            <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                                <div className="rounded-[1.5rem] bg-stone-50 p-5">
                                    <InfoRow label="Подана" value={formatDate(application.createdAt)} />
                                    {application.reviewedAt && (
                                        <div className="mt-4">
                                            <InfoRow label="Рассмотрена" value={formatDate(application.reviewedAt)} />
                                        </div>
                                    )}
                                    {application.reviewerName && (
                                        <div className="mt-4">
                                            <InfoRow label="Рассмотрел" value={application.reviewerName} />
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-[1.5rem] bg-stone-50 p-5">
                                    <div className="flex items-start gap-2">
                                        <MessageSquare className="mt-1 h-4 w-4 text-stone-400" />
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">Сообщение пользователя</p>
                                            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-stone-700">{application.message}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {application.adminNotes && (
                                <div className="mt-4 rounded-[1.5rem] border border-sky-200 bg-sky-50 p-5">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Комментарий администратора</p>
                                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-sky-900">{application.adminNotes}</p>
                                </div>
                            )}

                            <div className="mt-4 rounded-[1.5rem] border border-green-200 bg-[linear-gradient(180deg,#ffffff_0%,#FFFAF0_100%)] p-5">
                                <div className="grid gap-4 xl:grid-cols-[220px_1fr]">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">CRM приоритет</p>
                                        <select
                                            value={getCrmAnnotation(annotations, application.applicationId).priority}
                                            onChange={(event) => updatePriority(application.applicationId, event.target.value as CrmPriority)}
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
                                            {getCrmAnnotation(annotations, application.applicationId).tags.map((tag) => (
                                                <button
                                                    key={tag}
                                                    onClick={() => removeTag(application.applicationId, tag)}
                                                    className="rounded-full bg-[#FFF8DC] px-3 py-1 text-xs font-semibold text-green-800"
                                                >
                                                    {tag} ×
                                                </button>
                                            ))}
                                            {getCrmAnnotation(annotations, application.applicationId).tags.length === 0 && (
                                                <span className="text-sm text-stone-500">Тегов пока нет</span>
                                            )}
                                        </div>
                                        <div className="mt-3 flex gap-3">
                                            <input
                                                type="text"
                                                value={draftTags[String(application.applicationId)] || ''}
                                                onChange={(event) =>
                                                    setDraftTags((current) => ({ ...current, [String(application.applicationId)]: event.target.value }))
                                                }
                                                onKeyDown={(event) => event.key === 'Enter' && addTag(application.applicationId)}
                                                placeholder="Например: нужен созвон"
                                                className="flex-1 rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                                            />
                                            <button
                                                onClick={() => addTag(application.applicationId)}
                                                className="rounded-2xl border border-green-200 bg-[#FFF8DC] px-4 py-3 font-semibold text-green-800 transition hover:bg-[#FFEBCD]"
                                            >
                                                Добавить тег
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </section>
            )}

            {selectedApplication && (
                <AnchoredModalShell>
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-green-200 bg-white shadow-2xl">
                        <div className="p-6">
                            <div className="mb-6 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700">Review application</p>
                                    <h2 className="mt-2 text-2xl font-bold text-stone-950">
                                        {selectedApplication.userName || selectedApplication.userEmail}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedApplication(null)
                                        setReviewNotes('')
                                    }}
                                    className="rounded-2xl border border-stone-300 px-4 py-2 font-medium text-stone-700 hover:bg-stone-50"
                                    disabled={isReviewing}
                                >
                                    Закрыть
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="rounded-[1.5rem] bg-stone-50 p-5">
                                    <InfoRow label="Email" value={selectedApplication.userEmail} />
                                    <div className="mt-4">
                                        <InfoRow label="Дата заявки" value={formatDate(selectedApplication.createdAt)} />
                                    </div>
                                </div>

                                <div className="rounded-[1.5rem] bg-stone-50 p-5">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">Сообщение пользователя</p>
                                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-stone-700">{selectedApplication.message}</p>
                                </div>

                                <label className="grid gap-2">
                                    <span className="text-sm font-medium text-stone-700">Комментарий администратора</span>
                                    <textarea
                                        value={reviewNotes}
                                        onChange={(event) => setReviewNotes(event.target.value)}
                                        placeholder="Добавьте комментарий к решению"
                                        className="min-h-[120px] w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                                        disabled={isReviewing}
                                        maxLength={500}
                                    />
                                </label>
                            </div>

                            <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-stone-200 pt-6">
                                <button
                                    onClick={() => handleReview(selectedApplication.applicationId, 'Rejected')}
                                    disabled={isReviewing}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isReviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                    Отклонить
                                </button>
                                <button
                                    onClick={() => handleReview(selectedApplication.applicationId, 'Approved')}
                                    disabled={isReviewing}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isReviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                    Одобрить
                                </button>
                            </div>
                        </div>
                    </div>
                </AnchoredModalShell>
            )}
        </div>
    )
}

function LoadingState() {
    return (
        <div className="flex h-64 items-center justify-center">
            <div className="text-center">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-600" />
                <p className="mt-4 text-stone-600">Загрузка заявок...</p>
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

function FilterButton({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive ? 'bg-emerald-600 text-white' : 'border border-stone-300 bg-white text-stone-800 hover:bg-stone-50'
            }`}
        >
            {label}
        </button>
    )
}

function EmptyState({ filter }: { filter: 'all' | 'pending' | 'approved' | 'rejected' }) {
    const textByFilter = {
        all: 'Сейчас в системе нет заявок.',
        pending: 'Нет заявок, ожидающих рассмотрения.',
        approved: 'Нет одобренных заявок.',
        rejected: 'Нет отклонённых заявок.',
    }

    return (
        <div className="rounded-[1.75rem] border border-green-200 bg-[linear-gradient(180deg,#ffffff_0%,#FFFAF0_100%)] p-12 text-center shadow-sm">
            <div className="mx-auto mb-5 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF8DC]">
                <FileText className="h-10 w-10 text-green-700" />
            </div>
            <h3 className="text-2xl font-bold text-stone-950">Заявки не найдены</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-stone-600">{textByFilter[filter]}</p>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'Pending':
            return (
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    <Clock className="h-4 w-4" />
                    На рассмотрении
                </span>
            )
        case 'Approved':
            return (
                <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    Одобрена
                </span>
            )
        case 'Rejected':
            return (
                <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">
                    <XCircle className="h-4 w-4" />
                    Отклонена
                </span>
            )
        default:
            return <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">{status}</span>
    }
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

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">{label}</p>
            <p className="mt-2 text-sm leading-7 text-stone-700">{value}</p>
        </div>
    )
}

function formatDate(dateString: string) {
    return format(new Date(dateString), 'dd MMMM yyyy, HH:mm', { locale: ru })
}
