import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
    CheckCircle,
    Eye,
    Filter,
    Loader2,
    Mail,
    Phone,
    RefreshCw,
    Search,
    Shield,
    Trash2,
    User,
    UserCog,
    Users,
    XCircle,
} from 'lucide-react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import AnchoredModalShell from '@/components/ui/AnchoredModalShell'
import { useRequireAdmin } from '@/hooks/useRequireAdmin'
import { useAdminStore } from '@/store/adminStore'
import { UserDto, UserRole } from '@/types/backend'
import { matchesAnyField, rankByRelevance } from '@/utils/trigramSearch'

export default function UsersManagement() {
    useRequireAdmin()

    const {
        users,
        userStats,
        isLoading,
        error,
        fetchUsers,
        fetchUserStats,
        updateUserRole,
        updateUserStatus,
        deleteUser,
        searchUsers,
    } = useAdminStore()

    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('all')
    const [selectedUser, setSelectedUser] = useState<UserDto | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
    const [roleUpdate, setRoleUpdate] = useState<{ id: number; role: string } | null>(null)
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
    const [bulkRole, setBulkRole] = useState<string>(UserRole.Customer)
    const [bulkUserStatus, setBulkUserStatus] = useState<'active' | 'inactive'>('active')
    const [isBulkUpdating, setIsBulkUpdating] = useState(false)

    useEffect(() => {
        fetchUsers()
        fetchUserStats()
    }, [fetchUsers, fetchUserStats])

    const filteredUsers = useMemo(() => {
        let filtered = users.filter((user) => roleFilter === 'all' || user.role === roleFilter)

        if (searchTerm.trim().length > 0) {
            filtered = filtered.filter((user) =>
                matchesAnyField(
                    searchTerm,
                    [
                        user.email || '',
                        user.firstName || '',
                        user.lastName || '',
                        `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                    ],
                    0.3
                )
            )

            filtered = rankByRelevance(
                searchTerm,
                filtered,
                (user) => `${user.email} ${user.firstName || ''} ${user.lastName || ''}`
            )
        }

        return filtered
    }, [users, roleFilter, searchTerm])

    const summary = useMemo(() => {
        return {
            totalUsers: userStats?.totalUsers ?? users.length,
            activeUsers: userStats?.activeUsers ?? users.filter((user) => user.isActive).length,
            farmersCount: userStats?.farmersCount ?? users.filter((user) => user.role === UserRole.Farmer).length,
            customersCount: userStats?.customersCount ?? users.filter((user) => user.role === UserRole.Customer).length,
            adminsCount: userStats?.adminsCount ?? users.filter((user) => user.role === UserRole.Admin).length,
            newUsersLastWeek: userStats?.newUsersLastWeek ?? 0,
        }
    }, [userStats, users])

    const handleSearch = async () => {
        if (searchTerm.trim()) {
            await searchUsers(searchTerm.trim())
        } else {
            await fetchUsers()
        }
    }

    const handleUpdateRole = async (id: number, role: string) => {
        await updateUserRole(id, { role })
        setRoleUpdate(null)
        await fetchUsers()
    }

    const handleDeleteUser = async (id: number) => {
        await deleteUser(id)
        setDeleteConfirm(null)
    }

    const toggleUserSelection = (userId: number) => {
        setSelectedUserIds((current) =>
            current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
        )
    }

    const toggleSelectAllFiltered = () => {
        const filteredIds = filteredUsers.map((user) => user.userId)
        const areAllSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedUserIds.includes(id))

        setSelectedUserIds((current) =>
            areAllSelected
                ? current.filter((id) => !filteredIds.includes(id))
                : Array.from(new Set([...current, ...filteredIds]))
        )
    }

    const handleBulkRoleUpdate = async () => {
        if (selectedUserIds.length === 0) return

        setIsBulkUpdating(true)
        try {
            await Promise.all(selectedUserIds.map((userId) => updateUserRole(userId, { role: bulkRole })))
            setSelectedUserIds([])
            await fetchUsers()
            await fetchUserStats()
        } finally {
            setIsBulkUpdating(false)
        }
    }

    const handleBulkStatusUpdate = async () => {
        if (selectedUserIds.length === 0) return

        setIsBulkUpdating(true)
        try {
            await Promise.all(
                selectedUserIds.map((userId) => updateUserStatus(userId, { isActive: bulkUserStatus === 'active' }))
            )
            setSelectedUserIds([])
            await fetchUsers()
            await fetchUserStats()
        } finally {
            setIsBulkUpdating(false)
        }
    }

    if (isLoading && users.length === 0) {
        return <LoadingState />
    }

    return (
        <div className="space-y-8">
            <section className="overflow-hidden rounded-[2rem] border border-green-200 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.14),_transparent_28%),linear-gradient(135deg,#FFFAF0_0%,#FFF8DC_58%,#FFEBCD_100%)] p-8 shadow-sm">
                <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-end">
                    <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">Users CRM</p>
                        <h1 className="text-4xl font-bold tracking-tight text-stone-950">Управление клиентами, ролями и доступом</h1>
                        <p className="mt-5 max-w-2xl text-base leading-8 text-stone-700">
                            Теперь это не просто список пользователей, а более живой CRM-экран с быстрым обзором базы,
                            удобным поиском и понятной работой с ролями.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <StatCard label="Всего пользователей" value={summary.totalUsers} icon={<Users className="h-5 w-5" />} />
                        <StatCard label="Активных" value={summary.activeUsers} icon={<CheckCircle className="h-5 w-5" />} />
                        <StatCard label="Фермеров" value={summary.farmersCount} icon={<User className="h-5 w-5" />} />
                        <StatCard label="Новых за неделю" value={summary.newUsersLastWeek} icon={<RefreshCw className="h-5 w-5" />} />
                    </div>
                </div>
            </section>

            {error && <ErrorBanner message={error} />}

            <section className="rounded-[1.75rem] border border-green-200 bg-white p-6 shadow-sm">
                <div className="grid gap-4 xl:grid-cols-[1fr_280px_auto]">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input
                            type="text"
                            placeholder="Поиск по email, имени или фамилии"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
                            className="w-full rounded-2xl border border-stone-300 bg-stone-50 py-3 pl-11 pr-4 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                        />
                    </div>

                    <div className="relative">
                        <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <select
                            value={roleFilter}
                            onChange={(event) => setRoleFilter(event.target.value)}
                            className="w-full appearance-none rounded-2xl border border-stone-300 bg-white py-3 pl-11 pr-4 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                        >
                            <option value="all">Все роли</option>
                            <option value={UserRole.Admin}>Администраторы</option>
                            <option value={UserRole.Farmer}>Фермеры</option>
                            <option value={UserRole.Customer}>Покупатели</option>
                        </select>
                    </div>

                    <button
                        onClick={() => {
                            setSearchTerm('')
                            setRoleFilter('all')
                            fetchUsers()
                        }}
                        className="rounded-2xl border border-stone-300 px-5 py-3 font-medium text-stone-800 transition hover:bg-stone-50"
                    >
                        Сбросить
                    </button>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                <MiniStatCard label="Покупателей" value={summary.customersCount} />
                <MiniStatCard label="Администраторов" value={summary.adminsCount} />
                <MiniStatCard label="В выборке" value={filteredUsers.length} />
            </section>

            <section className="rounded-[1.75rem] border border-green-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-medium text-stone-500">Массовые действия</p>
                            <p className="mt-1 text-sm text-stone-600">
                                Выбрано пользователей: <span className="font-semibold text-stone-900">{selectedUserIds.length}</span>
                            </p>
                        </div>
                        <button
                            onClick={toggleSelectAllFiltered}
                            className="rounded-2xl border border-stone-300 px-4 py-3 font-medium text-stone-800 transition hover:bg-stone-50"
                        >
                            {filteredUsers.length > 0 && filteredUsers.every((user) => selectedUserIds.includes(user.userId))
                                ? 'Снять выбор'
                                : 'Выбрать всех в выборке'}
                        </button>
                    </div>

                    <div className="grid gap-3 xl:grid-cols-[1fr_auto_1fr_auto]">
                        <select
                            value={bulkRole}
                            onChange={(event) => setBulkRole(event.target.value)}
                            className="rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                        >
                            <option value={UserRole.Customer}>Покупатель</option>
                            <option value={UserRole.Farmer}>Фермер</option>
                            <option value={UserRole.Admin}>Администратор</option>
                        </select>
                        <button
                            onClick={handleBulkRoleUpdate}
                            disabled={selectedUserIds.length === 0 || isBulkUpdating}
                            className="rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Изменить роли
                        </button>
                        <select
                            value={bulkUserStatus}
                            onChange={(event) => setBulkUserStatus(event.target.value as 'active' | 'inactive')}
                            className="rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                        >
                            <option value="active">Активировать</option>
                            <option value="inactive">Деактивировать</option>
                        </select>
                        <button
                            onClick={handleBulkStatusUpdate}
                            disabled={selectedUserIds.length === 0 || isBulkUpdating}
                            className="rounded-2xl border border-green-200 bg-[#FFF8DC] px-5 py-3 font-semibold text-green-800 transition hover:bg-[#FFEBCD] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Применить статус
                        </button>
                    </div>
                </div>
            </section>

            {filteredUsers.length === 0 ? (
                <EmptyState onReset={() => {
                    setSearchTerm('')
                    setRoleFilter('all')
                    fetchUsers()
                }} />
            ) : (
                <section className="space-y-4">
                    {filteredUsers.map((user) => (
                        <div key={user.userId} className="space-y-4">
                    <article className="rounded-[1.75rem] border border-green-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedUserIds.includes(user.userId)}
                                        onChange={() => toggleUserSelection(user.userId)}
                                        className="h-5 w-5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[#FFF8DC] text-stone-700">
                                        <User className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold tracking-tight text-stone-950">
                                            {user.firstName} {user.lastName}
                                        </h2>
                                        <p className="mt-2 text-sm text-stone-500">{user.email}</p>
                                        {user.phone && (
                                            <p className="mt-1 text-sm text-stone-500">{user.phone}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <RoleBadge role={user.role} />
                                    <StatusBadge isActive={user.isActive} />
                                </div>
                            </div>

                            <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_0.8fr_auto] lg:items-start">
                                <div className="rounded-[1.5rem] bg-stone-50 p-5">
                                    <InfoRow label="Email" value={user.email} />
                                    {user.phone && (
                                        <div className="mt-4">
                                            <InfoRow label="Телефон" value={user.phone} />
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-[1.5rem] bg-stone-50 p-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <InfoRow label="Заказов" value={String(user.orderCount)} />
                                        <InfoRow label="Продуктов" value={String(user.productCount)} />
                                        <InfoRow label="Создан" value={formatDate(user.createdAt)} />
                                        <InfoRow label="Обновлён" value={formatDate(user.updatedAt)} />
                                    </div>
                                </div>

                                <div className="grid gap-3">
                                    <button
                                        onClick={() =>
                                            setSelectedUser((current) =>
                                                current?.userId === user.userId ? null : user
                                            )
                                        }
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-300 px-4 py-3 font-medium text-stone-800 transition hover:bg-stone-50"
                                    >
                                        <Eye className="h-4 w-4" />
                                        Детали
                                    </button>
                                    <button
                                        onClick={() => setRoleUpdate({ id: user.userId, role: user.role })}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 font-medium text-sky-700 transition hover:bg-sky-100"
                                    >
                                        <UserCog className="h-4 w-4" />
                                        Роль
                                    </button>
                                    <button
                                        onClick={() => updateUserStatus(user.userId, { isActive: !user.isActive })}
                                        className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-medium transition ${
                                            user.isActive
                                                ? 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                                : 'border border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                                        }`}
                                    >
                                        {user.isActive ? 'Деактивировать' : 'Активировать'}
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(user.userId)}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 font-medium text-rose-700 transition hover:bg-rose-100"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Удалить
                                    </button>
                                </div>
                            </div>
                        </article>

                        {selectedUser?.userId === user.userId && (
                            <section className="rounded-[1.75rem] border border-green-200 bg-white shadow-sm">
                                <div className="border-b border-green-100 bg-[linear-gradient(135deg,#FFFAF0_0%,#FFF8DC_100%)] p-6">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">User profile</p>
                                            <h2 className="mt-2 text-2xl font-bold text-stone-950">
                                                {user.firstName} {user.lastName}
                                            </h2>
                                        </div>
                                        <button
                                            onClick={() => setSelectedUser(null)}
                                            className="rounded-2xl border border-stone-300 px-4 py-2 font-medium text-stone-700 hover:bg-stone-50"
                                        >
                                            Закрыть
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-6 p-6">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-[#FFF8DC] text-stone-700">
                                            <User className="h-9 w-9" />
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <RoleBadge role={user.role} />
                                                <StatusBadge isActive={user.isActive} />
                                            </div>
                                            <p className="mt-3 text-sm text-stone-500">
                                                Зарегистрирован {formatDate(user.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <DetailTile icon={<Mail className="h-4 w-4" />} label="Email" value={user.email} />
                                        <DetailTile icon={<Phone className="h-4 w-4" />} label="Телефон" value={user.phone || 'Не указан'} />
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                        <MetricCard label="Заказов" value={user.orderCount} />
                                        <MetricCard label="Продуктов" value={user.productCount} />
                                        <MetricCard label="Роль" value={getRoleLabel(user.role)} />
                                        <MetricCard label="Активность" value={user.isActive ? 'Активен' : 'Неактивен'} />
                                    </div>
                                </div>
                            </section>
                        )}
                        </div>
                    ))}
                </section>
            )}

            {roleUpdate && (
                <AnchoredModalShell>
                    <div className="w-full max-w-md rounded-[2rem] border border-green-200 bg-white shadow-2xl">
                        <div className="p-6">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Access control</p>
                            <h2 className="mt-2 text-2xl font-bold text-stone-950">Изменить роль пользователя</h2>

                            <div className="mt-6">
                                <label className="mb-2 block text-sm font-medium text-stone-700">Новая роль</label>
                                <select
                                    value={roleUpdate.role}
                                    onChange={(event) => setRoleUpdate({ ...roleUpdate, role: event.target.value })}
                                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                                >
                                    <option value={UserRole.Customer}>Покупатель</option>
                                    <option value={UserRole.Farmer}>Фермер</option>
                                    <option value={UserRole.Admin}>Администратор</option>
                                </select>
                            </div>

                            <div className="mt-6 flex justify-end gap-3 border-t border-stone-200 pt-6">
                                <button
                                    onClick={() => setRoleUpdate(null)}
                                    className="rounded-2xl border border-stone-300 px-4 py-2 font-medium text-stone-800 hover:bg-stone-50"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={() => handleUpdateRole(roleUpdate.id, roleUpdate.role)}
                                    className="rounded-2xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
                                >
                                    Сохранить
                                </button>
                            </div>
                        </div>
                    </div>
                </AnchoredModalShell>
            )}

            {deleteConfirm && (
                <ConfirmDialog
                    title="Удалить пользователя?"
                    message="Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить."
                    confirmText="Удалить"
                    cancelText="Отмена"
                    onConfirm={() => handleDeleteUser(deleteConfirm)}
                    onCancel={() => setDeleteConfirm(null)}
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
                <p className="mt-4 text-stone-600">Загрузка пользователей...</p>
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

function MiniStatCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-[1.5rem] border border-green-200 bg-[#FFFAF0] p-5 shadow-sm">
            <p className="text-sm font-medium text-stone-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-stone-950">{value}</p>
        </div>
    )
}

function ErrorBanner({ message }: { message: string }) {
    return (
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-rose-700">
            {message}
        </div>
    )
}

function EmptyState({ onReset }: { onReset: () => void }) {
    return (
        <div className="rounded-[1.75rem] border border-[#E6D3A7] bg-[linear-gradient(180deg,#ffffff_0%,#FFFAF0_100%)] p-12 text-center shadow-sm">
            <div className="mx-auto mb-5 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF8DC]">
                <Users className="h-10 w-10 text-stone-400" />
            </div>
            <h3 className="text-2xl font-bold text-stone-950">Пользователей не найдено</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-stone-600">
                Попробуйте изменить фильтры или сбросить поиск, чтобы увидеть больше результатов.
            </p>
            <button
                onClick={onReset}
                className="mt-6 rounded-2xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
            >
                Сбросить фильтры
            </button>
        </div>
    )
}

function RoleBadge({ role }: { role: string }) {
    const roleClasses =
        role === UserRole.Admin
            ? 'bg-red-100 text-red-800'
            : role === UserRole.Farmer
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'

    const roleIcon =
        role === UserRole.Admin
            ? <Shield className="h-4 w-4 text-red-600" />
            : <User className={`h-4 w-4 ${role === UserRole.Farmer ? 'text-green-600' : 'text-blue-600'}`} />

    return (
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${roleClasses}`}>
            {roleIcon}
            {getRoleLabel(role)}
        </span>
    )
}

function StatusBadge({ isActive }: { isActive: boolean }) {
    return isActive ? (
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            <CheckCircle className="h-4 w-4" />
            Активен
        </span>
    ) : (
        <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">
            <XCircle className="h-4 w-4" />
            Неактивен
        </span>
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

function DetailTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="rounded-[1.5rem] bg-stone-50 p-5">
            <div className="mb-3 inline-flex rounded-xl bg-white p-2 text-stone-600 shadow-sm">{icon}</div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">{label}</p>
            <p className="mt-2 text-sm leading-7 text-stone-700">{value}</p>
        </div>
    )
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-[1.5rem] bg-stone-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">{label}</p>
            <p className="mt-3 text-xl font-bold text-stone-950">{value}</p>
        </div>
    )
}

function getRoleLabel(role: string) {
    switch (role) {
        case UserRole.Admin:
            return 'Администратор'
        case UserRole.Farmer:
            return 'Фермер'
        case UserRole.Customer:
            return 'Покупатель'
        default:
            return role
    }
}

function formatDate(dateString: string) {
    return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: ru })
}
