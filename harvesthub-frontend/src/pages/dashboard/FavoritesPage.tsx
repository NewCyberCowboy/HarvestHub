import { useState, useEffect } from 'react'
import { DashboardSidebar } from './components/Sidebar'
import { useAuthStore } from '@/store/auth.store'
import { favoritesApi } from '@/api/favorites.api'
import { FavoriteDto } from '@/types/backend'
import { Heart, ShoppingCart, Trash2, Package } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function FavoritesPage() {
    const { user } = useAuthStore()
    const navigate = useNavigate()
    const [favorites, setFavorites] = useState<FavoriteDto[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (user) {
            loadFavorites()
        }
    }, [user])

    const loadFavorites = async () => {
        try {
            setIsLoading(true)
            setError(null)
            const data = await favoritesApi.getMyFavorites()
            setFavorites(data)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Не удалось загрузить избранное'
            setError(errorMessage)
            console.error('Failed to load favorites:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleRemoveFavorite = async (productId: number) => {
        try {
            await favoritesApi.removeFavorite(productId)
            setFavorites(favorites.filter(f => f.productId !== productId))
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Не удалось удалить из избранного'
            setError(errorMessage)
            console.error('Failed to remove favorite:', err)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Available': return 'bg-green-100 text-green-800'
            case 'OutOfStock': return 'bg-red-100 text-red-800'
            case 'ComingSoon': return 'bg-blue-100 text-blue-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'Available': return 'В наличии'
            case 'OutOfStock': return 'Нет в наличии'
            case 'ComingSoon': return 'Скоро в продаже'
            default: return status
        }
    }

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <h1 className="text-2xl font-bold mb-4">Войдите в аккаунт</h1>
                <ButtonLink href="/login">
                    Войти
                </ButtonLink>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="flex flex-col md:flex-row">
                    <DashboardSidebar />
                    <div className="flex-1 p-4 md:p-8">
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                                <p className="mt-4 text-gray-600">Загрузка избранного...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex flex-col md:flex-row">
                <DashboardSidebar />

                <div className="flex-1 p-4 md:p-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">Избранное</h1>
                            <p className="text-gray-600 mt-2">
                                Товары, которые вы добавили в избранное ({favorites.length})
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                {error}
                            </div>
                        )}

                        {favorites.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {favorites.map((favorite) => (
                                    <div
                                        key={favorite.favoriteId}
                                        className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                                        onClick={() => navigate(`/products/${favorite.productId}`)}
                                    >
                                        {/* Изображение продукта */}
                                        <div className="w-full aspect-square bg-gray-50 flex items-center justify-center border-b">
                                            <div className="text-center">
                                                <span className="text-6xl">🍎</span>
                                                <p className="mt-2 text-gray-500 text-sm">
                                                    Изображение продукта
                                                </p>
                                            </div>
                                        </div>

                                        {/* Информация о продукте */}
                                        <div className="p-4">
                                            <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                                                {favorite.productName}
                                            </h3>

                                            {favorite.productDescription && (
                                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                    {favorite.productDescription}
                                                </p>
                                            )}

                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <div className="text-2xl font-bold text-gray-900">
                                                        {favorite.productPrice.toFixed(2)} ₽
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        за кг
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Package className="h-4 w-4 text-gray-500" />
                                                    <span className="text-sm text-gray-600">
                                                        {favorite.productStock} кг
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 mb-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(favorite.productStatus)}`}>
                                                    {getStatusText(favorite.productStatus)}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between pt-3 border-t">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleRemoveFavorite(favorite.productId)
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Удалить из избранного"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="text-sm">Удалить</span>
                                                </button>
                                                <div className="text-xs text-gray-500">
                                                    Добавлено {format(new Date(favorite.createdAt), 'dd.MM.yyyy', { locale: ru })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white border rounded-xl p-12 text-center">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-pink-50 to-red-50 flex items-center justify-center">
                                    <Heart className="h-10 w-10 text-pink-500" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Избранное пусто</h3>
                                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                    Добавляйте товары в избранное, нажав на сердечко на карточке товара.
                                    Здесь вы сможете быстро найти их позже.
                                </p>
                                <ButtonLink href="/products" className="flex items-center gap-2 mx-auto">
                                    <ShoppingCart className="h-4 w-4" />
                                    Перейти в каталог
                                </ButtonLink>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}