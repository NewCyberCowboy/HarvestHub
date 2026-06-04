import { useState } from 'react'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { CartItem as CartItemType } from '@/store/cart.store'
import { Link } from 'react-router-dom'

interface CartItemProps {
    item: CartItemType
    onUpdateQuantity: (productId: string, quantity: number) => void
    onRemove: (productId: string) => void
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
    const [isRemoving, setIsRemoving] = useState(false)
    const price = item.product.discountPrice || item.product.price
    // Используем вес для расчета, если указан, иначе quantity
    const weight = item.expectedWeight || item.quantity
    const total = price * weight
    const originalTotal = item.product.price * weight
    const hasDiscount = !!item.product.discountPrice

    const handleRemove = () => {
        setIsRemoving(true)
        setTimeout(() => {
            onRemove(item.productId)
        }, 300)
    }

    const formatUnit = (unit: string) => {
        switch (unit) {
            case 'kg': return 'кг'
            case 'g': return 'г'
            case 'piece': return 'кг'
            case 'liter': return 'л'
            default: return unit
        }
    }

    const getCategoryEmoji = (categoryId: string) => {
        const emojis: Record<string, string> = {
            vegetables: '🥔',
            fruits: '🍎',
            dairy: '🥛',
            eggs: '🥚',
            meat: '🥩',
            honey: '🍯',
            bread: '🥖',
            mushrooms: '🍄',
        }
        return emojis[categoryId] || '📦'
    }

    return (
        <div
            className={`flex items-center gap-4 py-4 border-b transition-all duration-300 ${isRemoving ? 'opacity-0 translate-x-4' : 'opacity-100'
                }`}
        >
            {/* Эмодзи категории */}
            <div className="hidden sm:flex w-12 h-12 rounded-lg bg-gradient-to-br from-green-50 to-blue-50 items-center justify-center flex-shrink-0">
                <div className="text-2xl">
                    {getCategoryEmoji(item.product.categoryId)}
                </div>
            </div>

            {/* Изображение (если есть) */}
            {item.product.images?.[0] && (
                <Link
                    to={`/products/${item.product.id}`}
                    className="flex-shrink-0"
                >
                    <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                    />
                </Link>
            )}

            {/* Информация */}
            <div className="flex-1 min-w-0">
                <Link
                    to={`/products/${item.product.id}`}
                    className="group block"
                >
                    <h3 className="font-semibold text-lg text-gray-900 group-hover:text-green-600 truncate">
                        {item.product.name}
                    </h3>
                </Link>

                <div className="flex flex-wrap items-center gap-2 mt-1">
                    <p className="text-sm text-gray-600">
                        {item.product.categoryName}
                    </p>

                    {item.product.isOrganic && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                            Органик
                        </span>
                    )}

                    {item.product.stock < 10 && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Осталось мало
                        </span>
                    )}
                </div>

                {/* Мобильное управление количеством */}
                <div className="sm:hidden mt-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="p-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-30 transition-colors"
                            >
                                <Minus className="h-4 w-4" />
                            </button>

                            <div className="text-center min-w-[60px]">
                                <span className="font-medium">{item.expectedWeight ? item.expectedWeight.toFixed(2) : item.quantity}</span>
                                <span className="text-xs text-gray-500 ml-1">
                                    {formatUnit(item.product.unit || 'кг')}
                                </span>
                            </div>

                            <button
                                onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                                disabled={item.quantity >= item.product.stock}
                                className="p-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-30 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="text-right">
                            <div className="font-bold text-lg">
                                {total.toFixed(2)} ₽
                            </div>
                            {hasDiscount && (
                                <div className="text-sm text-gray-400 line-through">
                                    {originalTotal.toFixed(2)} ₽
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Десктопное управление количеством */}
            <div className="hidden sm:flex items-center gap-4">
                <div className="flex items-center border rounded-lg">
                    <button
                        onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-30 transition-colors rounded-l-lg"
                    >
                        <Minus className="h-4 w-4" />
                    </button>

                    <div className="px-4 py-2 text-center min-w-[80px]">
                        <div className="font-medium">{item.expectedWeight ? item.expectedWeight.toFixed(2) : item.quantity}</div>
                        <div className="text-xs text-gray-500">
                            {formatUnit(item.product.unit || 'кг')}
                        </div>
                    </div>

                    <button
                        onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-30 transition-colors rounded-r-lg"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>

                {/* Цена */}
                <div className="text-right min-w-[120px]">
                    <div className="font-bold text-lg">{total.toFixed(2)} ₽</div>
                    <div className="text-sm text-gray-600">
                        {price.toFixed(2)} ₽/{item.product.unit ? formatUnit(item.product.unit) : 'кг'}
                    </div>
                    {hasDiscount && (
                        <div className="text-sm text-gray-400 line-through">
                            {originalTotal.toFixed(2)} ₽
                        </div>
                    )}
                </div>

                {/* Кнопка удаления */}
                <button
                    onClick={handleRemove}
                    disabled={isRemoving}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Удалить из корзины"
                >
                    <Trash2 className="h-5 w-5" />
                </button>
            </div>

            {/* Мобильная кнопка удаления */}
            <button
                onClick={handleRemove}
                disabled={isRemoving}
                className="sm:hidden p-2 text-gray-400 hover:text-red-600"
                title="Удалить из корзины"
            >
                <Trash2 className="h-5 w-5" />
            </button>
        </div>
    )
}