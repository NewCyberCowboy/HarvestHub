import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
    BookOpen,
    ChevronRight,
    FileText,
    LayoutDashboard,
    Menu,
    Package,
    ShoppingCart,
    Star,
    Users,
    X,
} from 'lucide-react'
import { useRequireAdmin } from '@/hooks/useRequireAdmin'
import { useAuthStore } from '@/store/auth.store'

const navigation = [
    { name: 'Обзор', href: '/admin', icon: LayoutDashboard },
    { name: 'Продукты', href: '/admin/products', icon: Package },
    { name: 'Категории', href: '/admin/categories', icon: Menu },
    { name: 'Заказы', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Отзывы', href: '/admin/reviews', icon: Star },
    { name: 'Пользователи', href: '/admin/users', icon: Users },
    { name: 'Заявки фермеров', href: '/admin/farmer-applications', icon: FileText },
    { name: 'Контент сайта', href: '/admin/content', icon: BookOpen },
]

export default function AdminLayout() {
    useRequireAdmin()

    const { user, isLoading } = useAuthStore()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#FFFAF0]">
                <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#E6D3A7] border-t-amber-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white text-stone-900">
            <div className="lg:hidden">
                <div className="sticky top-0 z-40 flex items-center justify-between border-b border-green-200 bg-[#FFFAF0]/90 px-4 py-4 backdrop-blur-xl">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-green-700">HarvestHub CRM</p>
                        <h1 className="text-lg font-bold text-stone-950">Админ-панель</h1>
                    </div>

                    <button
                        onClick={() => setSidebarOpen((current) => !current)}
                        className="rounded-2xl border border-green-200 bg-white/70 p-3 shadow-sm"
                    >
                        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>

                {sidebarOpen && (
                    <div className="border-b border-green-200 bg-[#FFFAF0]/95 px-4 py-4 shadow-lg backdrop-blur-xl">
                        <AdminSidebarContent
                            userName={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()}
                            role={user?.role ?? 'Admin'}
                            onNavigate={() => setSidebarOpen(false)}
                        />
                    </div>
                )}
            </div>

            <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-3 py-3 lg:px-4 lg:py-4">
                <aside className="hidden w-[300px] shrink-0 lg:block">
                    <div className="sticky top-4 overflow-hidden rounded-[2rem] border border-green-200 bg-[#FFFAF0] text-stone-900 shadow-2xl shadow-amber-200/40">
                        <div className="border-b border-green-200 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_35%),linear-gradient(135deg,#FFF8DC_0%,#FFEBCD_100%)] p-7">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.26em] text-green-700">Control Center</p>
                            <h1 className="text-2xl font-bold">HarvestHub Admin</h1>
                            <p className="mt-3 max-w-xs text-sm leading-6 text-stone-700">
                                Управление каталогом, заказами, пользователями и контентом в одном CRM-интерфейсе.
                            </p>
                        </div>

                        <div className="p-4">
                            <AdminSidebarContent
                                userName={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()}
                                role={user?.role ?? 'Admin'}
                            />
                        </div>
                    </div>
                </aside>

                <main className="min-w-0 flex-1">
                    <div className="rounded-[2rem] border border-green-200 bg-white shadow-xl shadow-amber-200/20 backdrop-blur-xl">
                        <div className="border-b border-green-200 px-5 py-5 sm:px-8">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-green-700">
                                        CRM Workspace
                                    </p>
                                    <h2 className="text-2xl font-bold tracking-tight text-stone-950">Административный контур</h2>
                                </div>

                                <div className="rounded-2xl border border-green-200 bg-[#FFF8DC] px-4 py-3 text-sm text-green-900">
                                    <span className="font-semibold">В работе:</span> каталог, заказы, отзывы, контент, пользователи
                                </div>
                            </div>
                        </div>

                        <div className="p-4 sm:p-8">
                            <Outlet />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

function AdminSidebarContent({
    userName,
    role,
    onNavigate,
}: {
    userName: string
    role: string
    onNavigate?: () => void
}) {
    return (
        <>
            <nav className="space-y-2">
                {navigation.map((item) => {
                    const Icon = item.icon

                    return (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            onClick={onNavigate}
                            className={({ isActive }) =>
                                `group flex items-center justify-between rounded-2xl px-4 py-3 transition ${isActive
                                    ? 'bg-white text-stone-950 shadow-lg shadow-green-100/60'
                                    : 'text-stone-700 hover:bg-white/75 hover:text-stone-950'
                                }`
                            }
                        >
                            <span className="flex items-center gap-3">
                                <span className="rounded-xl bg-white/70 p-2">
                                    <Icon className="h-5 w-5" />
                                </span>
                                <span className="font-medium">{item.name}</span>
                            </span>
                            <ChevronRight className="h-4 w-4 opacity-60" />
                        </NavLink>
                    )
                })}
            </nav>

            <div className="mt-6 rounded-[1.5rem] border border-green-200 bg-[#FFF8DC] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Текущий профиль</p>
                <p className="mt-3 text-base font-semibold text-stone-900">{userName || 'Администратор'}</p>
                <p className="mt-1 text-sm text-stone-600">{role}</p>
            </div>
        </>
    )
}
