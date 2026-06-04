import { useState } from 'react'
import { DashboardSidebar } from './components/Sidebar'
import { useAuthStore } from '@/store/auth.store'
import { User, Mail, Phone, Save, Upload, X } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function ProfilePage() {
    const { user } = useAuthStore()
    const [isEditing, setIsEditing] = useState(false)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
        email: user?.email || '',
        avatarUrl: ''
    })

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <h1 className="text-2xl font-bold mb-4">Войдите в аккаунт</h1>
                <ButtonLink href="/login"> {/* Используем ButtonLink */}
                    Войти
                </ButtonLink>
            </div>
        )
    }

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
            setAvatarFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleRemoveImage = () => {
        setAvatarFile(null)
        setAvatarPreview(null)
        setFormData(prev => ({ ...prev, avatarUrl: '' }))
    }

    const handleSave = async () => {
        try {
            // TODO: Implement profile update API call
            // Если есть новое изображение, загружаем его
            if (avatarFile) {
                const reader = new FileReader()
                await new Promise((resolve) => {
                    reader.onloadend = () => {
                        const base64String = reader.result as string
                        setFormData(prev => ({ ...prev, avatarUrl: base64String }))
                        resolve(null)
                    }
                    reader.readAsDataURL(avatarFile)
                })
            }
            // Здесь будет вызов API для обновления профиля
            toast.success('Профиль успешно обновлен!')
            setIsEditing(false)
        } catch (err) {
            toast.error('Не удалось обновить профиль')
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex flex-col md:flex-row">
                <DashboardSidebar />

                <div className="flex-1 p-4 md:p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">Профиль</h1>
                            <p className="text-gray-600 mt-2">
                                Управление личной информацией
                            </p>
                        </div>

                        <div className="bg-white border rounded-xl p-6">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        {avatarPreview || formData.avatarUrl ? (
                                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
                                                <img
                                                    src={avatarPreview || formData.avatarUrl || ''}
                                                    alt="Avatar"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                                                <User className="h-10 w-10 text-gray-600" />
                                            </div>
                                        )}
                                        {isEditing && (
                                            <div className="absolute -bottom-1 -right-1">
                                                <label
                                                    htmlFor="avatar-upload"
                                                    className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-700 transition-colors shadow-lg"
                                                    title="Изменить фото"
                                                >
                                                    <Upload className="h-4 w-4 text-white" />
                                                </label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                    className="hidden"
                                                    id="avatar-upload"
                                                />
                                                {(avatarPreview || formData.avatarUrl) && (
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveImage}
                                                        className="absolute -top-1 -left-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                                                        title="Удалить фото"
                                                    >
                                                        <X className="h-3 w-3 text-white" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">
                                            {user.firstName} {user.lastName}
                                        </h2>
                                        <p className="text-gray-600">Пользователь HarvestHub</p>
                                    </div>
                                </div>

                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                                    >
                                        Редактировать профиль
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                                    >
                                        <Save className="h-4 w-4" />
                                        Сохранить изменения
                                    </button>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Имя
                                        </label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                            />
                                        ) : (
                                            <div className="p-2 bg-gray-50 rounded-lg">
                                                {user.firstName}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Фамилия
                                        </label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                            />
                                        ) : (
                                            <div className="p-2 bg-gray-50 rounded-lg">
                                                {user.lastName}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4" />
                                                Email
                                            </div>
                                        </label>
                                        <div className="p-2 bg-gray-50 rounded-lg">
                                            {user.email}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Email нельзя изменить
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4" />
                                                Телефон
                                            </div>
                                        </label>
                                        {isEditing ? (
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                                placeholder="+7 (900) 123-45-67"
                                            />
                                        ) : (
                                            <div className="p-2 bg-gray-50 rounded-lg">
                                                {user.phone || 'Не указан'}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Дата регистрации */}
                                <div className="pt-6 border-t">
                                    <h3 className="font-medium text-gray-900 mb-4">Информация об аккаунте</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-600">Email</p>
                                            <p className="font-medium">
                                                {user.email}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Роль</p>
                                            <p className="font-medium">
                                                {user.role}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}