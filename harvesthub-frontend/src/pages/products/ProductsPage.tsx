// src/pages/products/ProductsPage.tsx
import { useEffect, useState } from 'react'
import { useProductsStore } from '@/store/products.store'
import { useCategoriesStore } from '@/store/categoriesStore'
import { productsApi } from '@/api/products.api'
import { reviewsApi } from '@/api/reviews.api'
import { mapDtoToProduct } from '@/types/product'
import { ProductCard } from '@/components/products/ProductCard'
import { Product } from '@/types/product'
import { Search, Filter, Loader2 } from 'lucide-react'
import { matchesAnyField, rankByRelevance } from '@/utils/trigramSearch'

export default  function ProductsPage() {
    const { products, setProducts, setLoading } = useProductsStore()
    const { categories, fetchCategories } = useCategoriesStore()
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | number>('all')

    useEffect(() => {
        const loadData = async () => {
            console.log('🔄 Загрузка данных...')
            setIsLoading(true)

            try {
                // Загружаем категории и продукты параллельно
                await Promise.all([
                    fetchCategories(),
                    (async () => {
                        const productDtos = await productsApi.getProducts()
                        console.log('✅ Получены продукты:', productDtos.length)

                        // Загружаем рейтинги для всех продуктов
                        const productsWithRatings = await Promise.all(
                            productDtos.map(async (dto) => {
                                const product = mapDtoToProduct(dto)
                                try {
                                    const reviewsSummary = await reviewsApi.getProductReviewsSummary(dto.productId)
                                    return {
                                        ...product,
                                        rating: reviewsSummary.averageRating || 0,
                                        reviewCount: reviewsSummary.totalReviews || 0
                                    } as Product
                                } catch (err) {
                                    // Если не удалось загрузить рейтинг, используем 0
                                    console.warn(`Не удалось загрузить рейтинг для продукта ${dto.productId}:`, err)
                                    return {
                                        ...product,
                                        rating: 0,
                                        reviewCount: 0
                                    } as Product
                                }
                            })
                        )

                        setProducts(productsWithRatings)
                    })()
                ])
            } catch (error) {
                console.error('❌ Ошибка загрузки:', error)
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [setProducts, setLoading, fetchCategories])

    // Фильтрация продуктов с использованием триграмм для поиска с опечатками
    const filteredProducts = (() => {
        // Сначала фильтруем по категории
        let filtered = products.filter(product => {
            const matchesCategory = selectedCategory === 'all' ||
                (typeof selectedCategory === 'number' && parseInt(product.categoryId) === selectedCategory) ||
                (typeof selectedCategory === 'string' && selectedCategory !== 'all' && product.categoryId === selectedCategory)
            return matchesCategory
        })

        // Если есть поисковый запрос, применяем поиск по триграммам
        if (searchTerm.trim().length > 0) {
            // Фильтруем по совпадению в названии или описании
            filtered = filtered.filter(product => {
                return matchesAnyField(searchTerm, [
                    product.name,
                    product.description,
                    product.categoryName
                ], 0.3) // Порог схожести 30%
            })

            // Ранжируем результаты по релевантности
            filtered = rankByRelevance(
                searchTerm,
                filtered,
                (product) => `${product.name} ${product.description || ''} ${product.categoryName || ''}`
            )
        }

        return filtered
    })()

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white">
                <div className="container mx-auto px-4 py-16">
                    <div className="flex flex-col items-center justify-center">
                        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
                        <p className="mt-4 text-lg text-gray-600">Загрузка каталога...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <div className="border-b border-[#E6D3A7] bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_28%),linear-gradient(135deg,#FFFAF0_0%,#ffffff_50%,#FFF8DC_100%)] py-14">
                <div className="container mx-auto px-4">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-200 bg-white/85 px-4 py-2 text-sm font-medium text-green-800 backdrop-blur">
                        <Filter className="h-4 w-4" />
                        Каталог фермерской продукции
                    </div>
                    <h1 className="text-4xl font-bold mb-4 text-gray-900 md:text-5xl">Свежие фермерские продукты</h1>
                    <p className="mb-8 max-w-2xl text-xl text-gray-600">
                        Сезонные овощи, фрукты и молочные продукты с понятным происхождением, бережной сборкой и живым ассортиментом.
                    </p>

                    {/* Поиск и фильтры */}
                    <div className="max-w-4xl rounded-[1.75rem] border border-[#E6D3A7] bg-white/90 p-4 shadow-xl shadow-amber-100/40 backdrop-blur">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Поле поиска */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Поиск продуктов..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full rounded-2xl border border-gray-300 bg-white py-3 pl-12 pr-4 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                />
                            </div>

                            {/* Фильтр по категориям */}
                            <div className="relative">
                                <Filter className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                                    className="w-full appearance-none rounded-2xl border border-gray-300 bg-white py-3 pl-12 pr-4 focus:border-transparent focus:ring-2 focus:ring-green-500 md:w-64"
                                >
                                    <option value="all">Все категории</option>
                                    {categories.map(category => (
                                        <option key={category.categoryId} value={category.categoryId}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Основной контент */}
            <div className="container mx-auto px-4 py-10">
                {/* Статистика */}
                <div className="mb-8 flex flex-col gap-4 rounded-[1.75rem] border border-[#E6D3A7] bg-[linear-gradient(135deg,#ffffff_0%,#FFFAF0_100%)] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Каталог продуктов
                        </h2>
                        <p className="text-gray-600">
                            {filteredProducts.length} {getProductCountText(filteredProducts.length)}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">
                            Сортировать:
                        </span>
                        <select className="rounded-2xl border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500">
                            <option>По популярности</option>
                            <option>По цене (возрастание)</option>
                            <option>По цене (убывание)</option>
                            <option>По новизне</option>
                        </select>
                    </div>
                </div>

                {/* Сетка продуктов */}
                {filteredProducts.length === 0 ? (
                    <div className="rounded-[1.75rem] border border-[#E6D3A7] bg-[linear-gradient(180deg,#ffffff_0%,#FFFAF0_100%)] py-16 text-center">
                        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF8DC]">
                            <Search className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Продукты не найдены
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            Попробуйте изменить поисковый запрос или выберите другую категорию
                        </p>
                        <button
                            onClick={() => {
                                setSearchTerm('')
                                setSelectedCategory('all')
                            }}
                            className="rounded-2xl bg-green-600 px-6 py-3 text-white transition-colors hover:bg-green-700"
                        >
                            Сбросить фильтры
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    className="hover:scale-[1.02] transition-transform duration-200"
                                />
                            ))}
                        </div>

                        {/* Пагинация (если нужно) */}
                        <div className="mt-12 flex justify-center">
                            <nav className="flex items-center gap-2">
                                <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">
                                    ← Предыдущая
                                </button>
                                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                    1
                                </button>
                                <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                                    2
                                </button>
                                <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                                    3
                                </button>
                                <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                                    Следующая →
                                </button>
                            </nav>
                        </div>
                    </>
                )}

                {/* Преимущества */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center p-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                            <span className="text-2xl">🚚</span>
                        </div>
                        <h3 className="font-bold text-lg mb-2">Быстрая доставка</h3>
                        <p className="text-gray-600">Доставляем в течение 24 часов по Москве</p>
                    </div>

                    <div className="text-center p-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                            <span className="text-2xl">🌿</span>
                        </div>
                        <h3 className="font-bold text-lg mb-2">100% органик</h3>
                        <p className="text-gray-600">Все продукты от проверенных фермеров</p>
                    </div>

                    <div className="text-center p-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                            <span className="text-2xl">💰</span>
                        </div>
                        <h3 className="font-bold text-lg mb-2">Лучшие цены</h3>
                        <p className="text-gray-600">Прямые поставки без наценок посредников</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Вспомогательная функция для склонения
function getProductCountText(count: number): string {
    if (count === 1) return 'товар'
    if (count >= 2 && count <= 4) return 'товара'
    return 'товаров'
}
