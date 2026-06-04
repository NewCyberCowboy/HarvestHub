import axios from 'axios'
import { useAuthStore } from '@/store/auth.store'

// Базовый URL вашего C# бэкенда
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5272/api'

// Функция для получения токена
const getToken = () => {
    // 1. Пробуем получить из localStorage напрямую
    const token = localStorage.getItem('token') ||
        localStorage.getItem('auth_token') ||
        sessionStorage.getItem('token')

    // 2. Если не нашли в localStorage, пробуем получить из store
    if (!token) {
        try {
            const storeToken = useAuthStore.getState().token
            if (storeToken) {
                console.log('Токен найден в store')
                return storeToken
            }
        } catch (error) {
            console.warn('Ошибка при получении токена из store:', error)
        }
    }

    console.log('Токен из хранилища:', token ? 'есть' : 'нет')
    return token
}

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor для добавления JWT токена
api.interceptors.request.use(
    (config) => {
        const token = getToken()
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
            console.log('Добавлен токен в заголовок для:', config.url)
        } else {
            console.warn('Токен не найден для запроса:', config.url)
        }
        return config
    },
    (error) => {
        console.error('Ошибка в request interceptor:', error)
        return Promise.reject(error)
    }
)

// Response interceptor для обработки ошибок
api.interceptors.response.use(
    (response) => {
        return response
    },
    async (error) => {
        const originalRequest = error.config

        // Если ошибка 401 (Unauthorized)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            // Очищаем токен
            useAuthStore.getState().logout()

            // НЕ перенаправляем если мы на тестовой странице
            if (window.location.pathname !== '/login' &&
                window.location.pathname !== '/test') { // ← Добавили проверку
                window.location.href = '/login?session_expired=true'
            }
        }

        // Обработка других ошибок
        let errorMessage = error.response?.data?.message ||
            error.response?.data?.title ||
            error.message ||
            'Произошла ошибка'

        // Если есть детальные ошибки валидации из ModelState
        if (error.response?.data?.errors) {
            const validationErrors = Object.entries(error.response.data.errors)
                .map(([key, values]: [string, any]) => {
                    const messages = Array.isArray(values) ? values : [values]
                    return `${key}: ${messages.join(', ')}`
                })
                .join('; ')
            errorMessage = validationErrors || errorMessage
        }

        // Перевод стандартных сообщений об ошибках
        const errorTranslations: Record<string, string> = {
            'Cannot delete product with existing orders': 'Невозможно удалить продукт, у которого есть существующие заказы',
            'Product not found': 'Продукт не найден',
            'Failed to delete product': 'Не удалось удалить продукт',
            'One or more validation errors occurred': 'Ошибка валидации данных',
            'Invalid model state': 'Некорректные данные формы',
            'The Name field is required': 'Поле "Название" обязательно для заполнения',
            'Name: The Name field is required.': 'Поле "Название" обязательно для заполнения',
            'Category with name': 'Категория с таким названием',
            'already exists': 'уже существует',
            'Category cannot be its own parent': 'Категория не может быть своим собственным родителем',
            'Moving category would create circular reference': 'Перемещение категории создаст циклическую ссылку',
            'Category with ID': 'Категория с ID',
            'cannot be deleted. It may contain products or subcategories.': 'не может быть удалена. Она может содержать продукты или подкатегории.',
            'Order not found': 'Заказ не найден',
            'Access denied': 'Доступ запрещен',
            'Invalid status transition': 'Недопустимый переход статуса',
            'Недопустимый переход статуса': 'Недопустимый переход статуса',
            'Failed to update order status': 'Не удалось обновить статус заказа',
            'The Status field is required': 'Поле "Статус" обязательно для заполнения',
            'Status: The Status field is required.': 'Поле "Статус" обязательно для заполнения',
            'Разрешенные переходы': 'Разрешенные переходы'
        }

        // Если есть перевод, используем его
        if (errorTranslations[errorMessage]) {
            errorMessage = errorTranslations[errorMessage]
        }

        // Создаем новую ошибку, но сохраняем оригинальный response
        const newError: any = new Error(errorMessage)
        newError.response = error.response
        newError.originalError = error
        return Promise.reject(newError)
    }
)

export default api