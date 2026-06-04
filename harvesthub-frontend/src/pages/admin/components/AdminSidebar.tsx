import { NavLink } from 'react-router-dom';
import {
    Home, Package, ShoppingCart, Users,
    FolderTree, Star, Settings, LogOut, FileText
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

export const AdminSidebar = () => {
    const { logout } = useAuthStore();

    const navItems = [
        { path: '/admin', icon: Home, label: 'Дашборд' },
        { path: '/admin/products', icon: Package, label: 'Продукты' },
        { path: '/admin/orders', icon: ShoppingCart, label: 'Заказы' },
        { path: '/admin/users', icon: Users, label: 'Пользователи' },
        { path: '/admin/categories', icon: FolderTree, label: 'Категории' },
        { path: '/admin/reviews', icon: Star, label: 'Отзывы' },
        { path: '/admin/farmer-applications', icon: FileText, label: 'Заявки фермеров' },
        { path: '/admin/settings', icon: Settings, label: 'Настройки' },
    ];

    return (
        <div className="w-64 bg-white border-r min-h-screen p-4">
            <div className="mb-8">
                <h1 className="text-xl font-bold text-gray-900">HarvestHub Admin</h1>
                <p className="text-sm text-gray-600">Панель управления</p>
            </div>

            <nav className="space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                                    ? 'bg-green-50 text-green-700 border-l-4 border-green-600'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`
                            }
                        >
                            <Icon className="h-5 w-5" />
                            <span>{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            <div className="mt-8 pt-6 border-t">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg w-full"
                >
                    <LogOut className="h-5 w-5" />
                    <span>Выйти</span>
                </button>
            </div>
        </div>
    );
};