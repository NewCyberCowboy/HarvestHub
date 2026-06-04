import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthUserDto, RegisterDto, LoginDto } from '@/types/backend'

interface AuthStore {
    user: AuthUserDto | null
    token: string | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null

    // Actions
    login: (credentials: LoginDto) => Promise<void>
    register: (credentials: RegisterDto) => Promise<void>
    logout: () => void
    setToken: (token: string, user: AuthUserDto) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    clearError: () => void
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({ // Убрали get из параметров
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (credentials: LoginDto) => {
                set({ isLoading: true, error: null })

                try {
                    const { authApi } = await import('@/api/auth.api')
                    const response = await authApi.login(credentials)

                    set({
                        user: response.user,
                        token: response.token,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    })

                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Ошибка авторизации'
                    set({
                        error: errorMessage,
                        isLoading: false,
                        isAuthenticated: false
                    })
                    throw error
                }
            },

            register: async (credentials: RegisterDto) => {
                set({ isLoading: true, error: null })

                try {
                    const { authApi } = await import('@/api/auth.api')
                    const response = await authApi.register(credentials)

                    set({
                        user: response.user,
                        token: response.token,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    })

                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Ошибка регистрации'
                    set({
                        error: errorMessage,
                        isLoading: false,
                        isAuthenticated: false
                    })
                    throw error
                }
            },

            logout: () => {
                import('@/api/auth.api').then(({ authApi }) => {
                    authApi.logout().catch(console.error)
                })

                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    error: null,
                })
            },

            setToken: (token: string, user: AuthUserDto) => {
                set({ token, user, isAuthenticated: true })
            },

            setLoading: (loading: boolean) => {
                set({ isLoading: loading })
            },

            setError: (error: string | null) => {
                set({ error })
            },

            clearError: () => {
                set({ error: null })
            },
        }),
        {
            name: 'harvesthub-auth-storage',
            version: 1,
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
)