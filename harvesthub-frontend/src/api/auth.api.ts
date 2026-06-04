import api from './axios'
import {
    RegisterDto,
    LoginDto,
    AuthResponseDto,
    ApiResponse,
    AuthUserDto
} from '@/types/backend'

export const authApi = {
    // Регистрация
    register: async (registerData: RegisterDto): Promise<AuthResponseDto> => {
        const response = await api.post<ApiResponse<AuthResponseDto>>('/Auth/register', registerData)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Registration failed')
        }
        return response.data.data
    },

    // Логин
    login: async (loginData: LoginDto): Promise<AuthResponseDto> => {
        const response = await api.post<ApiResponse<AuthResponseDto>>('/Auth/login', loginData)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Login failed')
        }
        return response.data.data
    },

    // Получение профиля пользователя
    getProfile: async (): Promise<AuthUserDto> => {
        const response = await api.get<ApiResponse<AuthUserDto>>('/Auth/profile')
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch profile')
        }
        return response.data.data
    },

    // Выход (только локальное удаление токена, бэкенд эндпоинт не реализован)
    logout: async (): Promise<void> => {
        // Эндпоинт logout не реализован на бэкенде
        // Просто удаляем токен локально через store
        // await api.post('/Auth/logout')
    }
}