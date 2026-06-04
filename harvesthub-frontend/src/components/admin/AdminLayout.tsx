import { Outlet, NavLink } from 'react-router-dom'
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    Star,
    FolderTree,
    LogOut,
    Menu,
    X
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { logout } = useAuthStore()

    const navItems = [
        {
            name: 'Дашборд',
            path: '/admin',
            icon: LayoutDashboard
        },
        {
            name: 'Продукты',
            path: '/admin/products',
            icon: Package
        },
        {
            name: 'Заказы',
            path: '/admin/orders',
            icon: ShoppingCart
        },
        {
            name: 'Категории',
            path: '/admin/categories',
            icon: FolderTree
        },
        {
            name: 'Отзывы',
            path: '/admin/reviews',
            icon: Star
        },
        {
            name: 'Пользователи',
            path: '/admin/users',
            icon: Users
        }
    ]

    const handleLogout = () => {
        logout()
        window.location.href = '/login'
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Мобильное меню */}
            <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b z-50">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            {sidebarOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </button>
                        <div className="font-bold text-lg">HarvestHub Admin</div>
                    </div>
                </div>

                {/* Мобильная навигация */}
                {sidebarOpen && (
                    <div className="bg-white border-t">
                        <div className="p-4">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${isActive
                                            ? 'bg-green-50 text-green-700'
                                            : 'hover:bg-gray-100'
                                        }`
                                    }
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.name}
                                </NavLink>
                            ))}

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 mt-4"
                            >
                                <LogOut className="h-5 w-5" />
                                Выйти
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="lg:flex">
                {/* Десктопная боковая панель */}
                <aside className="hidden lg:flex flex-col w-64 h-screen bg-white border-r fixed left-0 top-0">
                    <div className="p-6 border-b">
                        <div className="font-bold text-xl text-green-600">HarvestHub</div>
                        <div className="text-sm text-gray-600 mt-1">Административная панель</div>
                    </div>

                    <nav className="flex-1 p-4">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${isActive
                                        ? 'bg-green-50 text-green-700'
                                        : 'hover:bg-gray-100'
                                    }`
                                }
                            >
                                <item.icon className="h-5 w-5" />
                                {item.name}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="p-4 border-t">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50"
                        >
                            <LogOut className="h-5 w-5" />
                            Выйти
                        </button>
                    </div>
                </aside>

                {/* Основное содержимое */}
                <main className="lg:ml-64 flex-1 pt-16 lg:pt-0">
                    <div className="p-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}