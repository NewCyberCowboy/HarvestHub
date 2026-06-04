import { useState } from 'react'
import { X } from 'lucide-react'
import SidePanelShell from '@/components/ui/SidePanelShell'
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from '@/types/backend'

interface CategoryFormProps {
    category?: CategoryDto
    categories: CategoryDto[]
    onSubmit: (data: CreateCategoryDto | UpdateCategoryDto) => Promise<void>
    onClose: () => void
    error?: string | null
    embedded?: boolean
}

export default function CategoryForm({
    category,
    categories,
    onSubmit,
    onClose,
    error: externalError,
    embedded = false,
}: CategoryFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: category?.name || '',
        description: category?.description || '',
        parentId: category?.parentId || undefined,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            if (!formData.name.trim()) {
                throw new Error('Название обязательно')
            }

            const submitData: CreateCategoryDto | UpdateCategoryDto = {
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                parentId: formData.parentId,
            }

            if (category) {
                const updateData: UpdateCategoryDto = {}
                const trimmedName = submitData.name.trim()
                if (trimmedName !== category.name) {
                    updateData.name = trimmedName
                }

                const currentDescription = category.description || ''
                const newDescription = submitData.description || ''
                if (newDescription !== currentDescription) {
                    updateData.description = newDescription.trim()
                }

                const currentParentId = category.parentId || null
                const newParentId = submitData.parentId || null
                if (newParentId !== currentParentId) {
                    updateData.parentId = newParentId
                }

                if (Object.keys(updateData).length === 0) {
                    onClose()
                    return
                }

                await onSubmit(updateData)
            } else {
                await onSubmit(submitData as CreateCategoryDto)
            }

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
            [name]: value === '' ? undefined : value,
        }))
    }

    const getAvailableCategories = () => {
        return categories.filter((cat) => !category || cat.categoryId !== category.categoryId)
    }

    const content = (
            <div className={`flex w-full flex-col bg-white ${embedded ? 'rounded-[1.75rem] border border-green-200 shadow-sm' : 'min-h-full border-l border-green-200 shadow-2xl'}`}>
                <div className="border-b border-green-100 bg-[linear-gradient(135deg,#FFFAF0_0%,#FFF8DC_100%)] p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700">Category editor</p>
                            <h2 className="mt-2 text-2xl font-semibold text-stone-950">
                                {category ? 'Редактировать категорию' : 'Добавить новую категорию'}
                            </h2>
                        </div>
                        <button onClick={onClose} className="rounded-2xl border border-stone-200 bg-white p-2 hover:bg-stone-50">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
                    {(error || externalError) && (
                        <div className="mx-6 mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {error || externalError}
                        </div>
                    )}

                    <div className="space-y-4 p-6">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Название категории *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                placeholder="Например: Овощи"
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
                                placeholder="Описание категории..."
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Родительская категория</label>
                            <select
                                name="parentId"
                                value={formData.parentId || ''}
                                onChange={handleChange}
                                className="w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                            >
                                <option value="">Без родительской категории (корневая)</option>
                                {getAvailableCategories().map((cat) => (
                                    <option key={cat.categoryId} value={cat.categoryId}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
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
                            {isLoading ? 'Сохранение...' : category ? 'Сохранить' : 'Добавить категорию'}
                        </button>
                    </div>
                </form>
            </div>
    )

    if (embedded) {
        return content
    }

    return (
        <SidePanelShell onClose={onClose} widthClassName="max-w-xl">
            {content}
        </SidePanelShell>
    )
}
