import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCategoriesStore } from '@/store/categoriesStore'
import { productsApi } from '@/api/products.api'
import { productDraftsApi, ProductDraftDto } from '@/api/productDrafts.api'
import { imagesApi } from '@/api/images.api'
import { CreateProductDto } from '@/types/backend'
import { X, Upload, Loader2, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AddProductPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { categories, fetchCategories } = useCategoriesStore()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [draftId, setDraftId] = useState<number | null>(null)

    // Генерируем стандартные варианты веса: 0.5, 1, 1.5, 2, ... 20
    const defaultWeightOptions = Array.from({ length: 40 }, (_, i) => (i + 1) * 0.5)

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        basePrice: 0,
        currentStock: 0,
        unit: 'кг',
        weightOptions: defaultWeightOptions,
        allowCustomWeight: true,
        categoryId: categories[0]?.categoryId || 0,
        harvestDate: '',
        expiryDate: '',
        storageConditions: '',
        imageUrl: ''
    })

    const [selectedWeights, setSelectedWeights] = useState<number[]>(defaultWeightOptions)

    useEffect(() => {
        if (categories.length === 0) {
            fetchCategories()
        }
    }, [categories.length, fetchCategories])

    useEffect(() => {
        // Check if we have draft data from navigation state
        const state = location.state as { draft?: ProductDraftDto }
        if (state?.draft) {
            const draft = state.draft
            setDraftId(draft.draftId)
            setFormData({
                name: draft.name,
                description: draft.description || '',
                basePrice: draft.basePrice,
                currentStock: draft.currentStock,
                unit: draft.unit,
                weightOptions: defaultWeightOptions,
                allowCustomWeight: draft.allowCustomWeight,
                categoryId: draft.categoryId,
                harvestDate: '',
                expiryDate: '',
                storageConditions: draft.storageConditions || '',
                imageUrl: draft.imageUrl || ''
            })
            if (draft.imageUrl) {
                setImagePreview(imagesApi.getImageUrl(draft.imageUrl))
            }
        }
    }, [location.state, defaultWeightOptions])

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Проверяем тип файла
            if (!file.type.startsWith('image/')) {
                toast.error('Пожалуйста, выберите изображение')
                return
            }
            // Проверяем размер файла (макс 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Размер изображения не должен превышать 5MB')
                return
            }
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleRemoveImage = () => {
        setImageFile(null)
        setImagePreview(null)
        setFormData(prev => ({ ...prev, imageUrl: '' }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            // Валидация
            if (!formData.name.trim()) {
                throw new Error('Название обязательно')
            }
            if (formData.basePrice <= 0) {
                throw new Error('Цена должна быть больше 0')
            }
            if (formData.categoryId <= 0) {
                throw new Error('Выберите категорию')
            }

            // Если есть изображение, загружаем его
            let imageUrl = formData.imageUrl
            if (imageFile) {
                try {
                    toast.loading('Загрузка изображения...', { id: 'image-upload' })
                    imageUrl = await imagesApi.upload(imageFile)
                    toast.success('Изображение загружено', { id: 'image-upload' })
                } catch (uploadError) {
                    toast.error('Не удалось загрузить изображение', { id: 'image-upload' })
                    throw new Error('Не удалось загрузить изображение')
                }
            }

            const submitData: CreateProductDto = {
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                basePrice: parseFloat(formData.basePrice.toString()),
                currentStock: parseInt(formData.currentStock.toString()),
                unit: formData.unit === 'шт' || formData.unit === 'коробка' ? 'кг' : formData.unit,
                weightOptions: selectedWeights.length > 0 ? selectedWeights : undefined,
                allowCustomWeight: formData.allowCustomWeight,
                categoryId: parseInt(formData.categoryId.toString()),
                harvestDate: formData.harvestDate || undefined,
                expiryDate: formData.expiryDate || undefined,
                storageConditions: formData.storageConditions.trim() || undefined,
                imageUrl: imageUrl || undefined
            }

            await productsApi.createProduct(submitData)
            toast.success('Продукт успешно добавлен!')

            // If this was created from a draft, delete the draft
            if (draftId) {
                try {
                    await productDraftsApi.deleteDraft(draftId)
                    toast.success('Черновик удалён')
                } catch (draftError) {
                    console.error('Failed to delete draft:', draftError)
                    toast.error('Не удалось удалить черновик')
                }
            }

            navigate('/dashboard/farmer')
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка'
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                <button
                    onClick={() => navigate('/dashboard/farmer')}
                    className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span>Вернуться к панели фермера</span>
                </button>

                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h1 className="text-3xl font-bold mb-8">
                        {draftId ? 'Опубликовать черновик как продукт' : 'Добавить новый продукт'}
                    </h1>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Загрузка изображения */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Изображение продукта
                            </label>
                            <div className="flex items-start gap-4">
                                <div className="flex-1">
                                    {imagePreview ? (
                                        <div className="relative">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full h-64 object-cover rounded-lg border border-gray-300"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                            <div className="text-center">
                                                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                                <p className="text-gray-600 mb-2">Нажмите для загрузки изображения</p>
                                                <p className="text-sm text-gray-500">JPG, PNG до 5MB</p>
                                            </div>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                        id="image-upload"
                                    />
                                    <label
                                        htmlFor="image-upload"
                                        className="mt-4 block w-full text-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        {imagePreview ? 'Изменить изображение' : 'Выбрать изображение'}
                                    </label>
                                </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                                Если изображение не загружено, будет использована заглушка
                            </p>
                        </div>

                        {/* Название */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Название продукта *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Описание */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Описание
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        {/* Цена и количество */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Цена за кг (₽) *
                                </label>
                                <input
                                    type="number"
                                    name="basePrice"
                                    value={formData.basePrice}
                                    onChange={handleChange}
                                    min="0.01"
                                    step="0.01"
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Количество в наличии (кг) *
                                </label>
                                <input
                                    type="number"
                                    name="currentStock"
                                    value={formData.currentStock}
                                    onChange={handleChange}
                                    min="0"
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>

                        {/* Единица измерения */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Единица измерения *
                            </label>
                            <select
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value="кг">кг</option>
                                <option value="г">г</option>
                                <option value="л">л</option>
                                <option value="мл">мл</option>
                            </select>
                        </div>

                        {/* Категория */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Категория *
                            </label>
                            <select
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            >
                                <option value="">Выберите категорию</option>
                                {categories.map(category => (
                                    <option key={category.categoryId} value={category.categoryId}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Разрешить произвольный вес */}
                        <div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.allowCustomWeight}
                                    onChange={(e) => setFormData(prev => ({ ...prev, allowCustomWeight: e.target.checked }))}
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    Разрешить клиентам указывать произвольный вес
                                </span>
                            </label>
                        </div>

                        {/* Даты */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Дата сбора урожая
                                </label>
                                <input
                                    type="date"
                                    name="harvestDate"
                                    value={formData.harvestDate}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Срок годности
                                </label>
                                <input
                                    type="date"
                                    name="expiryDate"
                                    value={formData.expiryDate}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Условия хранения */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Условия хранения
                            </label>
                            <textarea
                                name="storageConditions"
                                value={formData.storageConditions}
                                onChange={handleChange}
                                rows={2}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Например: хранить в холодильнике при температуре 2-4°C"
                            />
                        </div>

                        {/* Кнопки */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard/farmer')}
                                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                disabled={isLoading}
                            >
                                Отмена
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Сохранение...
                                    </>
                                ) : draftId ? (
                                    'Опубликовать черновик'
                                ) : (
                                    'Добавить продукт'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}










