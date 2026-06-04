import { Link } from 'react-router-dom'
import { Star, ShoppingCart, Heart } from 'lucide-react'
import { Product } from '@/types/product'
import { useAuthStore } from '@/store/auth.store'
import { useCartStore } from '@/store/cart.store'
import { favoritesApi } from '@/api/favorites.api'
import { useState, useEffect } from 'react'
import { WeightSelector } from './WeightSelector'

interface ProductCardProps {
    product: Product
    onAddToCart?: (product: Product) => void
    className?: string;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
    const { user } = useAuthStore()
    const { addItem } = useCartStore()
    const [isFavorite, setIsFavorite] = useState(false)
    const [isLoadingFavorite, setIsLoadingFavorite] = useState(false)
    const [showWeightSelector, setShowWeightSelector] = useState(false)

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
            // Игнорируем ошибки при проверке избранного
            setIsFavorite(false)
        }
    }

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        
        if (!user) {
            // Можно показать уведомление о необходимости входа
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

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        
        // Все продукты продаются по весу - всегда показываем селектор веса
        setShowWeightSelector(true)
    }

    const handleWeightConfirm = (weight: number) => {
        if (onAddToCart) {
            onAddToCart(product)
        } else {
            addItem(product, 1, weight) // Передаем вес
        }
        setShowWeightSelector(false)
    }

    return (
        <>
            <Link to={`/products/${product.id}`} className="group">
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                    {/* Product Image */}
                    <div className="relative h-48 bg-gradient-to-br from-green-50 to-blue-50 overflow-hidden">
                        {product.images && product.images.length > 0 && product.images[0] ? (
                            <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    // Если изображение не загрузилось, показываем заглушку
                                    e.currentTarget.style.display = 'none'
                                    const placeholder = e.currentTarget.parentElement?.querySelector('.placeholder')
                                    if (placeholder) {
                                        (placeholder as HTMLElement).style.display = 'flex'
                                    }
                                }}
                            />
                        ) : null}
                        <div className={`absolute inset-0 flex items-center justify-center ${product.images && product.images.length > 0 && product.images[0] ? 'hidden placeholder' : ''}`}>
                            <div className="text-4xl">
                                {product.categoryId === 'vegetables' && '🥔'}
                                {product.categoryId === 'fruits' && '🍎'}
                                {product.categoryId === 'dairy' && '🥛'}
                                {product.categoryId === 'eggs' && '🥚'}
                                {!['vegetables', 'fruits', 'dairy', 'eggs'].includes(product.categoryId) && '🌿'}
                            </div>
                        </div>
                        {product.isOrganic && (
                            <div className="absolute top-2 left-2 bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded z-10">
                                Органик
                            </div>
                        )}
                        {product.discountPrice && (
                            <div className="absolute top-2 left-2 bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded z-10" style={{ marginTop: product.isOrganic ? '32px' : '0' }}>
                                -{Math.round((1 - product.discountPrice / product.price) * 100)}%
                            </div>
                        )}
                        {/* Кнопка избранного */}
                        {user && (
                            <button
                                onClick={handleToggleFavorite}
                                disabled={isLoadingFavorite}
                                className={`absolute top-2 right-2 p-2 rounded-full shadow-lg transition-all z-20 ${
                                    isFavorite
                                        ? 'bg-red-500 text-white hover:bg-red-600'
                                        : 'bg-white text-gray-600 hover:bg-gray-100'
                                } ${isLoadingFavorite ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                                title={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
                            >
                                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                            </button>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 line-clamp-1">
                            {product.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2 min-h-[40px]">
                            {product.description}
                        </p>

                        <div className="flex items-center mt-2">
                            {(product.rating !== undefined && product.rating > 0) || (product.reviewCount !== undefined && product.reviewCount > 0) ? (
                                <div className="flex items-center">
                                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                    <span className="ml-1 text-sm font-medium">{product.rating?.toFixed(1) || '0.0'}</span>
                                    {product.reviewCount !== undefined && product.reviewCount > 0 && (
                                        <span className="text-xs text-gray-500 ml-1">({product.reviewCount})</span>
                                    )}
                                </div>
                            ) : null}
                            {((product.rating !== undefined && product.rating > 0) || (product.reviewCount !== undefined && product.reviewCount > 0)) && (
                                <span className="mx-2 text-gray-300">•</span>
                            )}
                            <span className="text-sm text-gray-500">В наличии: {product.stock} {(product.unit && product.unit !== 'шт' && product.unit !== 'коробка') ? product.unit : 'кг'}</span>
                        </div>

                        {/* Price and Action */}
                        <div className="flex items-center justify-between mt-4">
                            <div>
                                {product.discountPrice ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl font-bold text-gray-900">
                                            ₽{product.discountPrice}
                                        </span>
                                        <span className="text-sm text-gray-500 line-through">
                                            ₽{product.price}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-xl font-bold text-gray-900">
                                        ₽{product.price}
                                    </span>
                                )}
                                <span className="text-sm text-gray-500 ml-1">/{(product.unit && product.unit !== 'шт' && product.unit !== 'коробка') ? product.unit : 'кг'}</span>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-colors"
                                title="Добавить в корзину"
                            >
                                <ShoppingCart className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </Link>

            {/* Модальное окно выбора веса */}
            {showWeightSelector && (
                <WeightSelector
                    product={product}
                    onConfirm={handleWeightConfirm}
                    onCancel={() => setShowWeightSelector(false)}
                />
            )}
        </>
    )
}