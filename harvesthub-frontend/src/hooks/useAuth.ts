// hooks/useAuth.ts - упрощенная версия
import { useAuthStore } from '@/store/auth.store'

export const useAuth = () => {
    const store = useAuthStore()

    return {
        // Состояние
        user: store.user,
        token: store.token,
        isAuthenticated: store.isAuthenticated,
        isLoading: store.isLoading,
        error: store.error,

        // Действия
        login: store.login,
        register: store.register,
        logout: store.logout,

        // Вспомогательные методы
        setError: store.setError,
        clearError: store.clearError,
    }
}