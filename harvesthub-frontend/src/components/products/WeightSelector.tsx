import { useState } from 'react'
import { X } from 'lucide-react'
import { Product } from '@/types/product'
import AnchoredModalShell from '@/components/ui/AnchoredModalShell'

interface WeightSelectorProps {
    product: Product
    onConfirm: (weight: number) => void
    onCancel: () => void
}

export function WeightSelector({ product, onConfirm, onCancel }: WeightSelectorProps) {
    const weightedProduct = product as Product & { weightOptions?: number[]; allowCustomWeight?: boolean }
    // Получаем варианты веса из продукта или используем стандартные
    const defaultWeights = Array.from({ length: 40 }, (_, i) => (i + 1) * 0.5) // 0.5, 1, 1.5, ... 20
    const weightOptions = weightedProduct.weightOptions || defaultWeights
    const allowCustomWeight = weightedProduct.allowCustomWeight !== false
    const unit = product.unit || 'кг'

    const [selectedWeight, setSelectedWeight] = useState<number | null>(null)
    const [customWeight, setCustomWeight] = useState<string>('')
    const [useCustom, setUseCustom] = useState(false)

    const handleConfirm = () => {
        let weight: number
        if (useCustom && customWeight) {
            weight = parseFloat(customWeight)
            if (isNaN(weight) || weight <= 0 || weight > 20) {
                alert('Введите корректный вес от 0.1 до 20 кг')
                return
            }
        } else if (selectedWeight) {
            weight = selectedWeight
        } else {
            alert('Выберите вес')
            return
        }
        onConfirm(weight)
    }

    return (
        <AnchoredModalShell backdropClassName="bg-black bg-opacity-50">
            <div className="bg-white rounded-xl w-full max-w-md shadow-lg">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold">Выберите вес</h2>
                    <button
                        onClick={onCancel}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">
                            {product.name} - {product.price} ₽ за {unit}
                        </p>
                    </div>

                    {/* Чекбокс для произвольного веса */}
                    {allowCustomWeight && (
                        <div className="mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={useCustom}
                                    onChange={(e) => {
                                        setUseCustom(e.target.checked)
                                        if (e.target.checked) {
                                            setSelectedWeight(null)
                                        }
                                    }}
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    Указать произвольный вес
                                </span>
                            </label>
                        </div>
                    )}

                    {useCustom ? (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Введите вес ({unit})
                            </label>
                            <input
                                type="number"
                                value={customWeight}
                                onChange={(e) => setCustomWeight(e.target.value)}
                                min="0.1"
                                max="20"
                                step="0.1"
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Например: 2.5"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                От 0.1 до 20 {unit}
                            </p>
                        </div>
                    ) : (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Выберите вес ({unit})
                            </label>
                            <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                                <div className="grid grid-cols-4 gap-2">
                                    {weightOptions.map((weight: number) => (
                                        <button
                                            key={weight}
                                            type="button"
                                            onClick={() => setSelectedWeight(weight)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                selectedWeight === weight
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {weight} {unit}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedWeight && !useCustom && (
                        <div className="mb-4 p-3 bg-green-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                                <span className="font-medium">Выбрано:</span> {selectedWeight} {unit}
                            </p>
                            <p className="text-lg font-bold text-green-700 mt-1">
                                Итого: {(product.price * selectedWeight).toFixed(2)} ₽
                            </p>
                        </div>
                    )}

                    {useCustom && customWeight && parseFloat(customWeight) > 0 && (
                        <div className="mb-4 p-3 bg-green-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                                <span className="font-medium">Выбрано:</span> {customWeight} {unit}
                            </p>
                            <p className="text-lg font-bold text-green-700 mt-1">
                                Итого: {(product.price * parseFloat(customWeight)).toFixed(2)} ₽
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                        >
                            Отмена
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={!selectedWeight && (!useCustom || !customWeight)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Добавить в корзину
                        </button>
                    </div>
                </div>
            </div>
        </AnchoredModalShell>
    )
}










