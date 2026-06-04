import { Link } from 'react-router-dom'
import { ShoppingBag, ArrowLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface EmptyCartProps {
    title?: string
    description?: string
    showSuggestions?: boolean
}

export function EmptyCart({
    title = "Корзина пуста",
    description = "Здесь пока ничего нет. Добавьте товары из каталога!",
    showSuggestions = true
}: EmptyCartProps) {

    const popularCategories = [
        { name: 'Овощи', path: '/products?category=vegetables', emoji: '🥦' },
        { name: 'Фрукты', path: '/products?category=fruits', emoji: '🍓' },
        { name: 'Молочные продукты', path: '/products?category=dairy', emoji: '🥛' },
        { name: 'Яйца', path: '/products?category=eggs', emoji: '🥚' },
        { name: 'Мясо', path: '/products?category=meat', emoji: '🥩' },
        { name: 'Мед', path: '/products?category=honey', emoji: '🍯' },
    ]

    return (
        <div className="py-12 px-4">
            <div className="max-w-2xl mx-auto text-center">
                {/* Иконка */}
                <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
                    <ShoppingBag className="w-16 h-16 text-gray-400" />
                </div>

                {/* Текст */}
                <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
                <p className="text-lg text-gray-600 mb-8">{description}</p>

                {/* Основная кнопка */}
                <div className="mb-8">
                    <Link to="/products">
                        <Button size="lg" className="min-w-[200px]">
                            <ArrowLeft className="mr-2 h-5 w-5" />
                            Перейти в каталог
                        </Button>
                    </Link>
                </div>

                {/* Популярные категории */}
                {showSuggestions && (
                    <div className="mt-12">
                        <div className="flex items-center justify-center gap-2 mb-6">
                            <Sparkles className="h-5 w-5 text-yellow-500" />
                            <h3 className="text-lg font-semibold text-gray-900">Популярные категории</h3>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {popularCategories.map((category) => (
                                <Link
                                    key={category.name}
                                    to={category.path}
                                    className="group bg-white border border-gray-200 rounded-xl p-4 hover:border-green-300 hover:shadow-md transition-all"
                                >
                                    <div className="text-3xl mb-2">{category.emoji}</div>
                                    <span className="font-medium text-gray-900 group-hover:text-green-600">
                                        {category.name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}