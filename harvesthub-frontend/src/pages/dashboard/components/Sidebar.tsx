import { NavLink } from 'react-router-dom'
import {
    BarChart3,
    Heart,
    Home,
    LogOut,
    MapPin,
    Package,
    Store,
    User,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'

export function DashboardSidebar() {
    const { user, logout } = useAuthStore()

    const isFarmer = user?.role === 'Farmer' || user?.role === 'Admin'
    const menuItems = [
        { path: '/dashboard', icon: Home, label: 'Главная' },
        { path: '/dashboard/orders', icon: Package, label: 'Мои заказы' },
        ...(isFarmer
            ? [
                { path: '/dashboard/farmer-analytics', icon: BarChart3, label: 'Аналитика продаж' },
                { path: '/dashboard/farmer', icon: Store, label: 'Фермерская CRM' },
            ]
            : []),
        { path: '/dashboard/profile', icon: User, label: 'Профиль' },
        { path: '/dashboard/addresses', icon: MapPin, label: 'Адреса' },
        { path: '/dashboard/favorites', icon: Heart, label: 'Избранное' },
    ]

    return (
        <aside className="w-full md:w-80 md:shrink-0">
            <div className="overflow-hidden rounded-[2rem] border border-[#E6D3A7] bg-[#FFFAF0] text-stone-900 shadow-2xl shadow-amber-200/40">
                <div className="border-b border-[#E6D3A7] bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.16),_transparent_35%),linear-gradient(135deg,#FFF8DC_0%,#FFEBCD_100%)] p-6">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Workspace</p>
                    <h3 className="text-xl font-bold">Личный кабинет</h3>
                    <p className="mt-3 text-sm leading-6 text-stone-700">
                        Управляйте заказами, профилем и фермерскими задачами из единого пространства.
                    </p>
                </div>

                <div className="border-b border-[#E6D3A7] p-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF8DC]">
                            <User className="h-6 w-6 text-stone-700" />
                        </div>
                        <div className="min-w-0">
                            <h4 className="truncate font-semibold text-stone-900">
                                {user?.firstName} {user?.lastName}
                            </h4>
                            <p className="truncate text-sm text-stone-600">{user?.email}</p>
                        </div>
                    </div>
                </div>

                <nav className="p-4">
                    <ul className="space-y-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon

                            return (
                                <li key={item.path}>
                                    <NavLink
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 rounded-2xl px-4 py-3 transition ${isActive
                                                ? 'bg-white text-stone-950 shadow-lg shadow-amber-200/45'
                                                : 'text-stone-700 hover:bg-white/75 hover:text-stone-950'
                                            }`
                                        }
                                    >
                                        <span className="rounded-xl bg-white/75 p-2">
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <span className="font-medium">{item.label}</span>
                                    </NavLink>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                <div className="p-4 pt-0">
                    <button
                        onClick={logout}
                        className="flex w-full items-center gap-3 rounded-2xl border border-[#E6D3A7] bg-[#FFF8DC] px-4 py-3 text-stone-800 transition hover:bg-white"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="font-medium">Выйти</span>
                    </button>
                </div>
            </div>
        </aside>
    )
}
