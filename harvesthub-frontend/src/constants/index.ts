export const APP_NAME = 'HarvestHub'
export const APP_DESCRIPTION = 'Fresh farm products delivered to your door'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    PRODUCTS: '/products',
    PRODUCT_DETAIL: '/products/:id',
    CART: '/cart',
    CHECKOUT: '/checkout',
    DASHBOARD: '/dashboard',
    ORDERS: '/dashboard/orders',
    PROFILE: '/dashboard/profile',
    SETTINGS: '/dashboard/settings',
}

export const PRODUCT_CATEGORIES = [
    { id: 'vegetables', name: 'Овощи', icon: '🥦' },
    { id: 'fruits', name: 'Фрукты', icon: '🍎' },
    { id: 'dairy', name: 'Молочные продукты', icon: '🥛' },
    { id: 'meat', name: 'Мясо и птица', icon: '🍗' },
    { id: 'bakery', name: 'Хлеб и выпечка', icon: '🥖' },
    { id: 'eggs', name: 'Яйца', icon: '🥚' },
    { id: 'honey', name: 'Мёд', icon: '🍯' },
    { id: 'herbs', name: 'Травы и специи', icon: '🌿' },
]

export const ORDER_STATUSES = {
    pending: { label: 'В ожидании', color: 'bg-yellow-100 text-yellow-800' },
    confirmed: { label: 'Подтвержден', color: 'bg-blue-100 text-blue-800' },
    processing: { label: 'В обработке', color: 'bg-purple-100 text-purple-800' },
    shipped: { label: 'Отправлен', color: 'bg-indigo-100 text-indigo-800' },
    delivered: { label: 'Доставлен', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Отменен', color: 'bg-red-100 text-red-800' },
}