import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom' // ← ДОБАВЬ useNavigate
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'react-hot-toast' // ← ДОБАВЬ для уведомлений

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuthStore()
    const navigate = useNavigate() // ← ДОБАВЬ

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            // login ожидает объект { email, password }
            await login({ email, password })

            // УСПЕШНЫЙ ЛОГИН - ДОБАВЬ РЕДИРЕКТ
            toast.success('Вход выполнен успешно!')
            navigate('/dashboard') // ← РЕДИРЕКТ НА DASHBOARD
            // ИЛИ navigate('/') // если хочешь на главную

        } catch (error) {
            console.error('Login error:', error)
            // Можно добавить toast или сообщение об ошибке
            const errorMessage = error instanceof Error ? error.message : 'Ошибка входа'
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg border shadow-sm p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold">Вход в аккаунт</h1>
                        <p className="text-gray-600 mt-2">
                            Введите свои данные для входа
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400">
                                    📧
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Пароль</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400">
                                    🔒
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Загрузка...' : 'Войти'}
                        </button>

                        <div className="text-center">
                            <Link to="/register" className="text-primary-600 hover:text-primary-700 text-sm">
                                Нет аккаунта? Зарегистрироваться
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}