import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, User, Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth.store";
import { APP_NAME } from "@/constants";
import { CartButton } from "@/components/cart/CartButton";
import { notificationsApi, notificationsService } from "@/api/notifications.api";
import toast from "react-hot-toast";

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);
    const [previousUnreadCount, setPreviousUnreadCount] = useState(0);
    const navigate = useNavigate();

    // ИЗМЕНИЛ: useAuthStore вместо useAuth
    const { user, isAuthenticated, logout } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) return;

        const loadNotifications = async () => {
            try {
                const allNotifications = await notificationsApi.getNotifications();
                const unread = allNotifications.filter(n => !n.isRead).length;
                const newUnread = unread - previousUnreadCount;

                // Show notification for new unread messages
                if (newUnread > 0) {
                    const newNotifications = allNotifications
                        .filter(n => !n.isRead)
                        .slice(0, newUnread);

                    newNotifications.forEach(notification => {
                        toast(`${notification.title}: ${notification.body}`, {
                            duration: 5000,
                            icon: '🔔',
                        });

                        // Also show browser notification if permission granted
                        if (notificationsService.hasPermission()) {
                            notificationsService.showLocalNotification(
                                notification.title,
                                notification.body,
                                notification.data
                            );
                        }
                    });
                }

                setUnreadCount(unread);
                setPreviousUnreadCount(unread);
            } catch (error) {
                console.error('Failed to load notifications:', error);
            }
        };

        // Initial load
        loadNotifications();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated, previousUnreadCount]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
            setSearchQuery("");
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    {/* Логотип и навигация */}
                    <div className="flex items-center gap-8">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600" />
                            <span className="text-xl font-bold text-gray-900">{APP_NAME}</span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-6">
                            <Link to="/" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                                Главная
                            </Link>
                            <Link to="/products" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                                Продукты
                            </Link>
                            <Link to="/farmers" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                                Ферма
                            </Link>
                            <Link to="/about" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                                О нас
                            </Link>
                        </nav>
                    </div>

                    {/* Поиск и действия */}
                    <div className="flex items-center gap-4">
                        {/* Поиск */}
                        <form onSubmit={handleSearch} className="hidden md:block">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="search"
                                    placeholder="Поиск продуктов..."
                                    className="pl-10 pr-4 py-2 w-64 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </form>

                        {/* Корзина */}
                        <CartButton />

                        {/* Уведомления */}
                        {isAuthenticated && (
                            <Link to="/dashboard/notifications" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <Bell className="h-5 w-5 text-gray-700" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </Link>
                        )}

                        {/* Аккаунт */}
                        {isAuthenticated ? (
                            <div className="hidden md:flex items-center gap-4">
                                <Link to="/dashboard">
                                    <Button variant="ghost" size="sm" className="gap-2">
                                        <User className="h-4 w-4" />
                                        {user?.email?.split('@')[0] || "Аккаунт"}
                                    </Button>
                                </Link>
                                <Button variant="outline" size="sm" onClick={handleLogout}>
                                    Выйти
                                </Button>
                            </div>
                        ) : (
                            <div className="hidden md:flex items-center gap-4">
                                <Link to="/login">
                                    <Button variant="ghost" size="sm">
                                        Войти
                                    </Button>
                                </Link>
                                <Link to="/register">
                                    <Button size="sm">Регистрация</Button>
                                </Link>
                            </div>
                        )}

                        {/* Мобильное меню */}
                        <button
                            className="md:hidden p-2"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Мобильное меню */}
                {isMenuOpen && (
                    <div className="md:hidden border-t py-4">
                        <nav className="flex flex-col gap-4">
                            <Link to="/" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                                Главная
                            </Link>
                            <Link to="/products" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                                Продукты
                            </Link>
                            <Link to="/farmers" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                                Ферма
                            </Link>
                            <Link to="/about" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                                О нас
                            </Link>

                            {isAuthenticated ? (
                                <>
                                    <Link to="/dashboard" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                                        Личный кабинет
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="text-sm font-medium text-gray-700 hover:text-gray-900 text-left"
                                    >
                                        Выйти
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                                        Войти
                                    </Link>
                                    <Link to="/register" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                                        Регистрация
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}
