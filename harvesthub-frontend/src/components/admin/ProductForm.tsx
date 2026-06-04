import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import SidePanelShell from '@/components/ui/SidePanelShell'
import { useCategoriesStore } from '@/store/categoriesStore'
import { ProductDto, CreateProductDto, UpdateProductDto, ProductStatus } from '@/types/backend'

interface ProductFormProps {
    product?: ProductDto
    onSubmit: (data: CreateProductDto | UpdateProductDto) => Promise<void>
    onClose: () => void
    embedded?: boolean
}

export default function ProductForm({ product, onSubmit, onClose, embedded = false }: ProductFormProps) {
    const { categories, fetchCategories } = useCategoriesStore()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (categories.length === 0) {
            fetchCategories()
        }
    }, [categories.length, fetchCategories])

    const defaultWeightOptions = Array.from({ length: 40 }, (_, i) => (i + 1) * 0.5)

    const [formData, setFormData] = useState({
        name: product?.name || '',
        description: product?.description || '',
        basePrice: product?.basePrice || 0,
        currentStock: product?.currentStock || 0,
        unit: product?.unit || 'кг',
        weightOptions: product?.weightOptions || defaultWeightOptions,
        allowCustomWeight: product?.allowCustomWeight ?? true,
        categoryId: product?.categoryId || (categories[0]?.categoryId || 0),
        status: product?.status || ProductStatus.Available,
        harvestDate: product?.harvestDate?.split('T')[0] || '',
        expiryDate: product?.expiryDate?.split('T')[0] || '',
        storageConditions: product?.storageConditions || '',
    })

    const [selectedWeights, setSelectedWeights] = useState<number[]>(product?.weightOptions || defaultWeightOptions)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            if (!formData.name.trim()) {
                throw new Error('Название обязательно')
            }
            if (formData.basePrice <= 0) {
                throw new Error('Цена должна быть больше 0')
            }
            if (formData.categoryId <= 0) {
                throw new Error('Выберите категорию')
            }

            const validUnit =
                formData.unit && formData.unit !== 'шт' && formData.unit !== 'коробка' && formData.unit !== 'коробки'
                    ? formData.unit
                    : 'кг'

            const submitData: CreateProductDto | UpdateProductDto = {
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                basePrice: parseFloat(formData.basePrice.toString()),
                currentStock: parseInt(formData.currentStock.toString()),
                unit: validUnit,
                weightOptions: selectedWeights.length > 0 ? selectedWeights : undefined,
                allowCustomWeight: formData.allowCustomWeight,
                categoryId: parseInt(formData.categoryId.toString()),
                harvestDate: formData.harvestDate || undefined,
                expiryDate: formData.expiryDate || undefined,
                storageConditions: formData.storageConditions.trim() || undefined,
            }

            await onSubmit(submitData)
            onClose()
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Произошла ошибка')
        } finally {
            setIsLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const content = (
            <div className={`flex w-full flex-col bg-white ${embedded ? 'rounded-[1.75rem] border border-green-200 shadow-sm' : 'min-h-full border-l border-green-200 shadow-2xl'}`}>
                <div className="border-b border-green-100 bg-[linear-gradient(135deg,#FFFAF0_0%,#FFF8DC_100%)] p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700">Product editor</p>
                            <h2 className="mt-2 text-2xl font-semibold text-stone-950">
                                {product ? 'Редактировать продукт' : 'Добавить новый продукт'}
                            </h2>
                        </div>
                        <button onClick={onClose} className="rounded-2xl border border-stone-200 bg-white p-2 hover:bg-stone-50">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
                    {error && (
                        <div className="mx-6 mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4 p-6">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Название продукта *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                placeholder="Например: Свежие помидоры"
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Описание</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                className="w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                placeholder="Описание продукта..."
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Цена за {formData.unit || 'кг'} (₽) *
                                </label>
                                <input
                                    type="number"
                                    name="basePrice"
                                    value={formData.basePrice}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Количество в наличии *</label>
                                <input
                                    type="number"
                                    name="currentStock"
                                    value={formData.currentStock}
                                    onChange={handleChange}
                                    min="0"
                                    className="w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Единица измерения *</label>
                                <select
                                    name="unit"
                                    value={formData.unit}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                    required
                                >
                                    <option value="кг">кг</option>
                                    <option value="г">г</option>
                                    <option value="л">л</option>
                                    <option value="мл">мл</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Категория *</label>
                                <select
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                    required
                                >
                                    <option value="">Выберите категорию</option>
                                    {categories.map((category) => (
                                        <option key={category.categoryId} value={category.categoryId}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Статус *</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                    required
                                >
                                    <option value={ProductStatus.Available}>В наличии</option>
                                    <option value={ProductStatus.OutOfStock}>Нет в наличии</option>
                                    <option value={ProductStatus.ComingSoon}>Скоро в продаже</option>
                                    <option value={ProductStatus.Discontinued}>Снят с продажи</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.allowCustomWeight}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, allowCustomWeight: e.target.checked }))}
                                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Разрешить клиентам указывать произвольный вес
                                    </span>
                                </label>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Дата сбора урожая</label>
                                <input
                                    type="date"
                                    name="harvestDate"
                                    value={formData.harvestDate}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Срок годности до</label>
                                <input
                                    type="date"
                                    name="expiryDate"
                                    value={formData.expiryDate}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Варианты веса для выбора клиентами (от 0.5 до 20 {formData.unit || 'кг'})
                            </label>
                            <div className="max-h-60 overflow-y-auto rounded-lg border p-4">
                                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                                    {defaultWeightOptions.map((weight) => (
                                        <label key={weight} className="flex cursor-pointer items-center gap-1">
                                            <input
                                                type="checkbox"
                                                checked={selectedWeights.includes(weight)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedWeights([...selectedWeights, weight].sort((a, b) => a - b))
                                                    } else {
                                                        setSelectedWeights(selectedWeights.filter((w) => w !== weight))
                                                    }
                                                }}
                                                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                            />
                                            <span className="text-sm text-gray-700">{weight} {formData.unit || 'кг'}</span>
                                        </label>
                                    ))}
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedWeights(defaultWeightOptions)}
                                        className="text-sm text-green-600 hover:text-green-700"
                                    >
                                        Выбрать все
                                    </button>
                                    <span className="text-gray-400">|</span>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedWeights([])}
                                        className="text-sm text-red-600 hover:text-red-700"
                                    >
                                        Очистить
                                    </button>
                                </div>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Клиенты смогут выбирать из отмеченных вариантов веса при добавлении товара в корзину
                            </p>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Условия хранения</label>
                            <input
                                type="text"
                                name="storageConditions"
                                value={formData.storageConditions}
                                onChange={handleChange}
                                className="w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                placeholder="Например: Хранить при температуре +2...+4°C"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-green-100 bg-white p-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border px-4 py-2 hover:bg-gray-50"
                            disabled={isLoading}
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isLoading ? 'Сохранение...' : product ? 'Сохранить' : 'Добавить продукт'}
                        </button>
                    </div>
                </form>
            </div>
    )

    if (embedded) {
        return content
    }

    return (
        <SidePanelShell onClose={onClose} widthClassName="max-w-4xl">
            {content}
        </SidePanelShell>
    )
}
