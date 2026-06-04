import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCategoriesStore } from '@/store/categoriesStore'
import { productsApi } from '@/api/products.api'
import { imagesApi } from '@/api/images.api'
import { UpdateProductDto } from '@/types/backend'
import { X, Upload, Loader2, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EditProductPage() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const { categories, fetchCategories } = useCategoriesStore()
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingProduct, setIsLoadingProduct] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)

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
        categoryId: 0,
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

    // Загружаем продукт для редактирования
    useEffect(() => {
        const loadProduct = async () => {
            if (!id) {
                setError('ID продукта не указан')
                setIsLoadingProduct(false)
                return
            }

            setIsLoadingProduct(true)
            setError(null)

            try {
                const productId = parseInt(id, 10)
                const product = await productsApi.getProductById(productId)

                setFormData({
                    name: product.name || '',
                    description: product.description || '',
                    basePrice: product.basePrice || 0,
                    currentStock: product.currentStock || 0,
                    unit: product.unit || 'кг',
                    weightOptions: product.weightOptions || defaultWeightOptions,
                    allowCustomWeight: product.allowCustomWeight ?? true,
                    categoryId: product.categoryId || 0,
                    harvestDate: product.harvestDate ? product.harvestDate.split('T')[0] : '',
                    expiryDate: product.expiryDate ? product.expiryDate.split('T')[0] : '',
                    storageConditions: product.storageConditions || '',
                    imageUrl: product.imageUrl || ''
                })

                setSelectedWeights(product.weightOptions || defaultWeightOptions)

                if (product.imageUrl) {
                    setImagePreview(imagesApi.getImageUrl(product.imageUrl))
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Не удалось загрузить продукт'
                setError(errorMessage)
                toast.error(errorMessage)
            } finally {
                setIsLoadingProduct(false)
            }
        }

        loadProduct()
    }, [id])

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
        if (!id) return

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

            // Если есть новое изображение, загружаем его
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

            const submitData: UpdateProductDto = {
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

            const productId = parseInt(id, 10)
            await productsApi.updateProduct(productId, submitData)
            toast.success('Продукт успешно обновлен!')
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

    if (isLoadingProduct) {
        return (
            <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
                    <p className="text-gray-600">Загрузка продукта...</p>
                </div>
            </div>
        )
    }

    if (error && !formData.name) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <div className="text-4xl mb-4">😕</div>
                        <h1 className="text-2xl font-bold mb-4">Ошибка загрузки</h1>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={() => navigate('/dashboard/farmer')}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Вернуться к панели фермера
                        </button>
                    </div>
                </div>
            </div>
        )
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
                    <h1 className="text-3xl font-bold mb-8">Редактировать продукт</h1>

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
                                                src={imageFile ? imagePreview : imagesApi.getImageUrl(imagePreview)}
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
                                ) : (
                                    'Сохранить изменения'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}









