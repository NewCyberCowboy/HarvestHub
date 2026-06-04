// src/components/products/ProductCard.tsx
import { Product } from '@/types/product'
import { useCartStore } from '@/store/cart.store'
import { useAuthStore } from '@/store/auth.store'
import { favoritesApi } from '@/api/favorites.api'
import { ShoppingCart, Star, Heart } from 'lucide-react'
import { useState, useEffect } from 'react'

export interface ProductCardProps {
    product: Product;
    className?: string; 
}
export function ProductCard({ product, className = '' }: ProductCardProps) {
    const { addItem } = useCartStore()
    const { user } = useAuthStore()
    const [isFavorite, setIsFavorite] = useState(false)
    const [isLoadingFavorite, setIsLoadingFavorite] = useState(false)

    useEffect(() => {
        if (user && product.id) {
            checkFavorite()
        }
    }, [user, product.id])

    const checkFavorite = async () => {
        if (!user) return
        try {
            const favorite = await favoritesApi.checkFavorite(parseInt(product.id))
            setIsFavorite(favorite)
        } catch (err) {
            setIsFavorite(false)
        }
    }

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        
        if (!user) {
            return
        }

        setIsLoadingFavorite(true)
        try {
            if (isFavorite) {
                await favoritesApi.removeFavorite(parseInt(product.id))
                setIsFavorite(false)
            } else {
                await favoritesApi.addFavorite(parseInt(product.id))
                setIsFavorite(true)
            }
        } catch (err) {
            console.error('Failed to toggle favorite:', err)
        } finally {
            setIsLoadingFavorite(false)
        }
    }

    const handleAddToCart = () => {
        addItem(product, 1)
    }

    return (
        <div className={`group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 ${className}`}>
            {/* Изображение продукта */}
            <div className="relative h-56 bg-gradient-to-br from-green-50 to-emerald-100 overflow-hidden">
                {product.images && product.images.length > 0 ? (
                    <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <span className="text-6xl">
                            {getCategoryEmoji(product.categoryName)}
                        </span>
                    </div>
                )}

                {/* Бейджи */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {product.isOrganic && (
                        <span className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                            🌿 Органик
                        </span>
                    )}
                    {product.discountPrice && (
                        <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                            -{Math.round((1 - product.discountPrice / product.price) * 100)}%
                        </span>
                    )}
                </div>

                {/* Кнопка избранного */}
                {user && (
                    <button
                        onClick={handleToggleFavorite}
                        disabled={isLoadingFavorite}
                        className={`absolute top-3 right-3 p-2 rounded-full shadow-lg transition-all ${
                            isFavorite
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-white text-gray-600 hover:bg-gray-100'
                        } ${isLoadingFavorite ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                        title={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
                    >
                        <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                )}

                {/* Кнопка добавления в корзину */}
                <button
                    onClick={handleAddToCart}
                    disabled={!product.isAvailable}
                    className="absolute bottom-3 right-3 p-3 bg-white rounded-full shadow-lg hover:bg-green-50 hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Добавить в корзину"
                >
                    <ShoppingCart className={`h-5 w-5 ${product.isAvailable ? 'text-green-600' : 'text-gray-400'}`} />
                </button>
            </div>

            {/* Информация о продукте */}
            <div className="p-5">
                {/* Категория */}
                <div className="mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {product.categoryName}
                    </span>
                </div>

                {/* Название */}
                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">
                    {product.name}
                </h3>

                {/* Описание */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {product.description || 'Свежий фермерский продукт'}
                </p>

                {/* Рейтинг */}
                {product.rating !== undefined && (
                    <div className="flex items-center gap-1 mb-4">
                        <div className="flex">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`h-4 w-4 ${i < Math.floor(product.rating || 0)
                                            ? 'text-yellow-400 fill-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                />
                            ))}
                        </div>
                        <span className="text-sm text-gray-600">
                            {product.rating?.toFixed(1)} {product.reviewCount && `(${product.reviewCount})`}
                        </span>
                    </div>
                )}

                {/* Цена и кнопка */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-gray-900">
                                {product.price} ₽
                            </span>
                            {product.discountPrice && (
                                <span className="text-sm text-gray-400 line-through">
                                    {product.discountPrice} ₽
                                </span>
                            )}
                            {product.unit && (
                                <span className="text-sm text-gray-500">/{product.unit}</span>
                            )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {product.stock > 0
                                ? `В наличии: ${product.stock} ${product.unit || 'кг'}`
                                : 'Нет в наличии'}
                        </div>
                    </div>

                    <button
                        onClick={handleAddToCart}
                        disabled={!product.isAvailable}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                        {product.isAvailable ? 'Купить' : 'Нет в наличии'}
                    </button>
                </div>

                {/* Фермер */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-green-600">
                                {product.farmerName?.charAt(0) || 'Ф'}
                            </span>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Фермер</div>
                            <div className="text-sm font-medium">{product.farmerName || 'Локальный фермер'}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Экспорт по умолчанию для совместимости
export default ProductCard

// Вспомогательная функция для эмодзи категорий
function getCategoryEmoji(categoryName: string): string {
    const category = categoryName?.toLowerCase() || ''

    if (category.includes('овощ') || category.includes('vegetable')) return '🥬'
    if (category.includes('фрукт') || category.includes('fruit')) return '🍎'
    if (category.includes('молоч') || category.includes('dairy')) return '🥛'
    if (category.includes('хлеб') || category.includes('bread')) return '🥖'
    if (category.includes('мясо') || category.includes('meat')) return '🥩'
    if (category.includes('рыба') || category.includes('fish')) return '🐟'
    if (category.includes('ягод') || category.includes('berry')) return '🍓'
    if (category.includes('зелен') || category.includes('green')) return '🥗'
    if (category.includes('орех') || category.includes('nut')) return '🥜'
    if (category.includes('мед') || category.includes('honey')) return '🍯'

    return '🛒'
}