import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './contexts/ThemeContext'
import { Layout } from './components/layout/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ProductsPage from './pages/products/ProductsPage'
import ProductDetailPage from './pages/products/ProductDetailPage'
import CartPage from './pages/cart/CartPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import AboutPage from './pages/AboutPage'
import FarmersPage from './pages/FarmersPage'
import FarmerDetailPage from './pages/FarmerDetailPage'
import NotFoundPage from './pages/NotFoundPage'
import CheckoutPage from '@/pages/checkout/CheckoutPage'
import CheckoutSuccessPage from '@/pages/checkout/SuccessPage'
import TestPage from '@/pages/TestPage'
import { notificationsService } from './api/notifications.api'
import { useEffect } from 'react'

// Дочерние страницы Dashboard
import OrdersPage from '@/pages/dashboard/OrdersPage'
import OrderDetailPage from '@/pages/dashboard/OrderDetailPage'
import FarmerPanel from '@/pages/dashboard/FarmerPanel'
import FarmerAnalyticsPage from '@/pages/dashboard/FarmerAnalyticsPage'
import AddProductPage from '@/pages/dashboard/AddProductPage'
import EditProductPage from '@/pages/dashboard/EditProductPage'
import ProfilePage from '@/pages/dashboard/ProfilePage'
import AddressesPage from '@/pages/dashboard/AddressesPage'
import FavoritesPage from '@/pages/dashboard/FavoritesPage'
import NotificationsPage from '@/pages/dashboard/NotificationsPage'

// Админские компоненты
import AdminLayout from '@/components/layout/AdminLayout'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import ProductsManagement from '@/pages/admin/ProductsManagement'
import OrdersManagement from '@/pages/admin/OrdersManagement'
import UsersManagement from '@/pages/admin/UsersManagement'
import CategoriesManagement from '@/pages/admin/CategoriesManagement'
import ReviewsManagement from '@/pages/admin/ReviewsManagement'
import FarmerApplicationsManagement from '@/pages/admin/FarmerApplicationsManagement'
import ContentManagement from '@/pages/admin/ContentManagement'
import TermsPage from '@/pages/TermsPage'
import FaqPage from '@/pages/FaqPage'

function App() {
    // Initialize notifications on app mount
    useEffect(() => {
        const initNotifications = async () => {
            try {
                await notificationsService.requestPermission();
            } catch (error) {
                console.error('Failed to initialize notifications:', error);
            }
        };
        initNotifications();
    }, []);

    return (
        <ThemeProvider>
            <Router>
                <Routes>
                    {/* Основной layout для обычных пользователей */}
                    <Route path="/" element={<Layout />}>
                        <Route index element={<HomePage />} />
                        <Route path="login" element={<LoginPage />} />
                        <Route path="register" element={<RegisterPage />} />
                        <Route path="products">
                            <Route index element={<ProductsPage />} />
                            <Route path=":id" element={<ProductDetailPage />} />
                        </Route>
                        <Route path="cart" element={<CartPage />} />
                        <Route path="checkout">
                            <Route index element={<CheckoutPage />} />
                            <Route path="success/:orderId" element={<CheckoutSuccessPage />} />
                        </Route>
                        <Route path="about" element={<AboutPage />} />
                        <Route path="terms" element={<TermsPage />} />
                        <Route path="faq" element={<FaqPage />} />
                        <Route path="farmers">
                            <Route index element={<FarmersPage />} />
                            <Route path=":id" element={<FarmerDetailPage />} />
                        </Route>
                        <Route path="dashboard" element={<DashboardPage />} />
                        <Route path="dashboard/orders" element={<OrdersPage />} />
                        <Route path="dashboard/orders/:orderId" element={<OrderDetailPage />} />
                        <Route path="dashboard/farmer" element={<FarmerPanel />} />
                        <Route path="dashboard/farmer-analytics" element={<FarmerAnalyticsPage />} />
                        <Route path="dashboard/farmer/add-product" element={<AddProductPage />} />
                        <Route path="dashboard/farmer/edit-product/:id" element={<EditProductPage />} />
                        <Route path="dashboard/profile" element={<ProfilePage />} />
                        <Route path="dashboard/addresses" element={<AddressesPage />} />
                        <Route path="dashboard/favorites" element={<FavoritesPage />} />
                        <Route path="dashboard/notifications" element={<NotificationsPage />} />
                        <Route path="/test" element={<TestPage />} />
                    </Route>

                    {/* ВАЖНО: Админские маршруты ВНЕ основного Layout */}
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="products" element={<ProductsManagement />} />
                        <Route path="orders" element={<OrdersManagement />} />
                        <Route path="users" element={<UsersManagement />} />
                        <Route path="categories" element={<CategoriesManagement />} />
                        <Route path="reviews" element={<ReviewsManagement />} />
                        <Route path="farmer-applications" element={<FarmerApplicationsManagement />} />
                        <Route path="content" element={<ContentManagement />} />
                    </Route>

                    {/* 404  */}
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Router>
            <Toaster position="top-right" />
        </ThemeProvider>
    )
}

export default App
