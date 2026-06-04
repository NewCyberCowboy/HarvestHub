// src/pages/products/ProductDetailPage.tsx - ЗАВЕРШЕННАЯ ВЕРСИЯ
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCartStore } from '@/store/cart.store'
import { useAuthStore } from '@/store/auth.store'
import { productsApi } from '@/api/products.api'
import { reviewsApi } from '@/api/reviews.api'
import { ordersApi } from '@/api/orders.api'
import { favoritesApi } from '@/api/favorites.api'
import { mapDtoToProduct } from '@/types/product'
import { ProductDto, ProductReviewsSummaryDto, ReviewDto, OrderDto } from '@/types/backend'
import { Package, User, Tag, Calendar, Shield, Star, MessageSquare, Heart, Edit } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ProductRating } from '@/components/products/ProductRating'
import { ReviewForm } from '@/components/products/ReviewForm'
import { WeightSelector } from '@/components/products/WeightSelector'

export default function ProductDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { addItem } = useCartStore()

    const [productDto, setProductDto] = useState<ProductDto | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [quantity, setQuantity] = useState(1)
    const [reviewsSummary, setReviewsSummary] = useState<ProductReviewsSummaryDto | null>(null)
    const [reviewsLoading, setReviewsLoading] = useState(false)
    const [userOrders, setUserOrders] = useState<OrderDto[]>([])
    const [showReviewForm, setShowReviewForm] = useState(false)
    const [isFavorite, setIsFavorite] = useState(false)
    const [isLoadingFavorite, setIsLoadingFavorite] = useState(false)
    const [showWeightSelector, setShowWeightSelector] = useState(false)
    const { user } = useAuthStore()

    useEffect(() => {
        const loadProduct = async () => {
            if (!id) return

            setIsLoading(true)
            setError(null)

            try {
                const productId = parseInt(id, 10)
                console.log('Загружаем продукт ID:', productId)

                const productData = await productsApi.getProductById(productId)
                console.log('Продукт загружен:', productData)

                setProductDto(productData)
                
                // Загружаем отзывы
                try {
                    setReviewsLoading(true)
                    const summary = await reviewsApi.getProductReviewsSummary(productData.productId)
                    setReviewsSummary(summary)
                } catch (err) {
                    console.error('Ошибка загрузки отзывов:', err)
                    // Не показываем ошибку, если отзывов нет
                    setReviewsSummary({ averageRating: 0, totalReviews: 0, reviews: [] })
                } finally {
                    setReviewsLoading(false)
                }

                // Загружаем заказы пользователя (для проверки возможности оставить отзыв)
                if (user) {
                    try {
                        const orders = await ordersApi.getUserOrders()
                        // Фильтруем только доставленные заказы, содержащие этот продукт
                        const deliveredOrders = orders.filter(order => 
                            order.status === 'Delivered' && 
                            order.items?.some(item => item.productId === productData.productId)
                        )
                        setUserOrders(deliveredOrders)
                    } catch (err) {
                        console.error('Ошибка загрузки заказов:', err)
                    }

                    // Проверяем, находится ли продукт в избранном
                    try {
                        const favorite = await favoritesApi.checkFavorite(productData.productId)
                        setIsFavorite(favorite)
                    } catch (err) {
                        setIsFavorite(false)
                    }
                }
            } catch (err) {
                console.error('Ошибка загрузки:', err)
                setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
            } finally {
                setIsLoading(false)
            }
        }

        loadProduct()
    }, [id])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Загрузка товара...</p>
                </div>
            </div>
        )
    }

    if (error || !productDto) {
        return (
            <div className="container mx-auto px-4 py-8">
                <button
                    onClick={() => navigate('/products')}
                    className="mb-4 px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                    ← Назад к каталогу
                </button>
                <div className="text-center py-12">
                    <div className="text-4xl mb-2">😕</div>
                    <h1 className="text-xl font-bold mb-2">Товар не найден</h1>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        {error || `Продукт с ID ${id} не существует или был удален`}
                    </p>
                    <button
                        onClick={() => navigate('/products')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Перейти в каталог
                    </button>
                </div>
            </div>
        )
    }

    // Конвертируем DTO в Product
    const product = mapDtoToProduct(productDto)

    // Проверяем, является ли пользователь владельцем продукта
    const isOwner = user && (user.userId === productDto.farmerId || user.role === 'Admin')

    const handleAddToCart = () => {
        if (product.stock > 0) {
            // Все продукты продаются по весу - всегда показываем селектор веса
            setShowWeightSelector(true)
        }
    }

    const handleWeightConfirm = (weight: number) => {
        if (product.stock > 0) {
            addItem(product, quantity, weight)
            setShowWeightSelector(false)
        }
    }

    const handleToggleFavorite = async () => {
        if (!user || !productDto) return

        setIsLoadingFavorite(true)
        try {
            if (isFavorite) {
                await favoritesApi.removeFavorite(productDto.productId)
                setIsFavorite(false)
            } else {
                await favoritesApi.addFavorite(productDto.productId)
                setIsFavorite(true)
            }
        } catch (err) {
            console.error('Failed to toggle favorite:', err)
        } finally {
            setIsLoadingFavorite(false)
        }
    }

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'Не указана'
        try {
            return format(new Date(dateString), 'dd.MM.yyyy', { locale: ru })
        } catch {
            return 'Неверный формат даты'
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

    return (
        <>
        <div className="container mx-auto px-4 py-8">
            {/* Хлебные крошки */}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                <button
                    onClick={() => navigate('/products')}
                    className="hover:text-green-600"
                >
                    Каталог
                </button>
                <span>/</span>
                <span className="font-medium">{product.name}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Левая колонка - изображение */}
                <div className="relative">
                    <div className="w-full aspect-square bg-gray-50 rounded-2xl overflow-hidden border">
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
                            <div className="text-center">
                                <span className="text-8xl">🍎</span>
                                <p className="mt-4 text-gray-500 text-sm">
                                    Изображение продукта
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* Кнопка избранного */}
                    {user && (
                        <button
                            onClick={handleToggleFavorite}
                            disabled={isLoadingFavorite}
                            className={`absolute top-4 right-4 p-3 rounded-full shadow-lg transition-all ${
                                isFavorite
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                            } ${isLoadingFavorite ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                            title={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
                        >
                            <Heart className={`h-6 w-6 ${isFavorite ? 'fill-current' : ''}`} />
                        </button>
                    )}
                </div>

                {/* Правая колонка - информация */}
                <div>
                    {/* Заголовок */}
                    <div className="flex items-start justify-between mb-3">
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                            {product.name}
                        </h1>
                        {isOwner && (
                            <button
                                onClick={() => navigate(`/dashboard/farmer/edit-product/${productDto.productId}`)}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Edit className="h-4 w-4" />
                                Редактировать
                            </button>
                        )}
                    </div>

                    {/* Рейтинг */}
                    {reviewsSummary && reviewsSummary.totalReviews > 0 && (
                        <div className="mb-4">
                            <ProductRating 
                                rating={reviewsSummary.averageRating} 
                                reviewCount={reviewsSummary.totalReviews} 
                            />
                        </div>
                    )}

                    {/* Описание */}
                    {product.description && (
                        <p className="text-gray-600 mb-6 text-lg">
                            {product.description}
                        </p>
                    )}

                    {/* Цена и статус */}
                    <div className="mb-8">
                        <div className="flex items-baseline gap-3 mb-4">
                            <span className="text-4xl font-bold text-gray-900">
                                {product.price} ₽
                            </span>
                            <span className="text-gray-500">за {product.unit || 'кг'}</span>
                        </div>

                        <div className="flex flex-wrap gap-3 mb-4">
                            <span className={`px-4 py-2 rounded-full font-medium ${getStatusColor(product.status || '')}`}>
                                {product.status === 'Available' && 'В наличии'}
                                {product.status === 'OutOfStock' && 'Нет в наличии'}
                                {product.status === 'ComingSoon' && 'Скоро в продаже'}
                                {product.status === 'Discontinued' && 'Снят с продажи'}
                            </span>

                            <span className={`px-4 py-2 rounded-full font-medium ${product.stock > 0
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                <Package className="inline h-4 w-4 mr-2" />
                                {product.stock} {product.unit || 'кг'}
                            </span>
                        </div>
                    </div>

                    {/* Информация о продукте */}
                    <div className="mb-8 p-6 bg-gray-50 rounded-2xl">
                        <h3 className="text-lg font-semibold mb-4">Детали продукта</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <User className="h-5 w-5 text-gray-500" />
                                <div>
                                    <div className="font-medium">Фермер</div>
                                    <div className="text-gray-600">{product.farmerName}</div>
                                    {productDto.farmerAddress && (
                                        <div className="text-sm text-gray-500 mt-1">
                                            📍 {productDto.farmerAddress}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Tag className="h-5 w-5 text-gray-500" />
                                <div>
                                    <div className="font-medium">Категория</div>
                                    <div className="text-gray-600">{product.categoryName}</div>
                                </div>
                            </div>

                            {productDto.harvestDate && (
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-gray-500" />
                                    <div>
                                        <div className="font-medium">Дата сбора</div>
                                        <div className="text-gray-600">{formatDate(productDto.harvestDate)}</div>
                                    </div>
                                </div>
                            )}

                            {productDto.expiryDate && (
                                <div className="flex items-center gap-3">
                                    <Shield className="h-5 w-5 text-gray-500" />
                                    <div>
                                        <div className="font-medium">Срок годности</div>
                                        <div className="text-gray-600">до {formatDate(productDto.expiryDate)}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Управление количеством и корзина */}
                    <div className="mb-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    className="px-4 py-3 hover:bg-gray-100 transition-colors disabled:opacity-50"
                                    disabled={quantity <= 1}
                                >
                                    –
                                </button>
                                <span className="px-6 py-3 min-w-[3rem] text-center font-medium text-lg">
                                    {quantity}
                                </span>
                                <button
                                    onClick={() => setQuantity(q => q + 1)}
                                    className="px-4 py-3 hover:bg-gray-100 transition-colors disabled:opacity-50"
                                    disabled={product.stock <= 0}
                                >
                                    +
                                </button>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                disabled={product.stock <= 0}
                                className="flex-1 px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
                            >
                                {product.stock > 0 ? 'Добавить в корзину' : 'Нет в наличии'}
                            </button>
                        </div>

                        {/* Итого */}
                        <div className="p-5 bg-green-50 rounded-xl border border-green-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="text-gray-700">Итого за {quantity} {product.unit || 'кг'}</div>
                                    <div className="text-sm text-gray-500">
                                        {product.price} ₽ × {quantity} {product.unit || 'кг'}
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-green-700">
                                    {(product.price * quantity).toFixed(2)} ₽
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Дополнительная информация */}
                    {productDto.storageConditions && (
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <div className="font-medium text-blue-800 mb-2">Условия хранения</div>
                            <div className="text-blue-700">{productDto.storageConditions}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Форма добавления отзыва */}
            {user && userOrders.length > 0 && !showReviewForm && (
                <div className="mt-8">
                    <button
                        onClick={() => setShowReviewForm(true)}
                        className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                    >
                        Оставить отзыв
                    </button>
                </div>
            )}

            {user && userOrders.length > 0 && showReviewForm && (
                <div className="mt-8">
                    <ReviewForm
                        productId={productDto.productId}
                        orderId={userOrders[0].orderId} // Используем первый доставленный заказ
                        onSuccess={() => {
                            setShowReviewForm(false)
                            // Перезагружаем отзывы
                            reviewsApi.getProductReviewsSummary(productDto.productId)
                                .then(summary => setReviewsSummary(summary))
                                .catch(err => console.error('Ошибка перезагрузки отзывов:', err))
                        }}
                        onCancel={() => setShowReviewForm(false)}
                    />
                </div>
            )}

            {/* Секция отзывов */}
            <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Отзывы</h2>
                
                {reviewsLoading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Загрузка отзывов...</p>
                    </div>
                ) : reviewsSummary && reviewsSummary.totalReviews > 0 ? (
                    <div className="space-y-6">
                        {/* Сводка рейтинга */}
                        <div className="bg-gray-50 rounded-xl p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-4xl font-bold text-gray-900 mb-1">
                                        {reviewsSummary.averageRating.toFixed(1)}
                                    </div>
                                    <ProductRating 
                                        rating={reviewsSummary.averageRating} 
                                        reviewCount={reviewsSummary.totalReviews} 
                                    />
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-gray-900">
                                        {reviewsSummary.totalReviews}
                                    </div>
                                    <div className="text-gray-600">
                                        {reviewsSummary.totalReviews === 1 ? 'отзыв' : 
                                         reviewsSummary.totalReviews < 5 ? 'отзыва' : 'отзывов'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Список отзывов */}
                        <div className="space-y-4">
                            {reviewsSummary.reviews
                                .filter(review => review.isApproved)
                                .map((review) => (
                                <div key={review.reviewId} className="bg-white border rounded-xl p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                <User className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {review.customerName || 'Анонимный пользователь'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {format(new Date(review.createdAt), 'dd.MM.yyyy', { locale: ru })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`h-5 w-5 ${
                                                        i < review.rating
                                                            ? 'text-yellow-400 fill-yellow-400'
                                                            : 'text-gray-300'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    {review.comment && (
                                        <div className="text-gray-700">
                                            {review.comment}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-50 rounded-xl p-12 text-center">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                            Пока нет отзывов. Будьте первым, кто оставит отзыв!
                        </p>
                    </div>
                )}
            </div>
        </div>

            {/* Модальное окно выбора веса */}
            {showWeightSelector && productDto && (
                <WeightSelector
                    product={mapDtoToProduct(productDto)}
                    onConfirm={handleWeightConfirm}
                    onCancel={() => setShowWeightSelector(false)}
                />
            )}
        </>
    )
}