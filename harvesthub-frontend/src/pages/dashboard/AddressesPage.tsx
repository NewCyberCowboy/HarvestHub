import { useState, useEffect } from 'react'
import { DashboardSidebar } from './components/Sidebar'
import { useAuthStore } from '@/store/auth.store'
import { useAddressesStore } from '@/store/addresses.store'
import { MapPin, Plus, Home, Building, Edit, Trash2 } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { toast } from 'react-hot-toast'
import type { AddressDto } from '@/types/backend'
import AddressFormModal from '@/components/AddressFormModal' // ← Добавьте этот импорт

export default function AddressesPage() {
    const { user } = useAuthStore()
    const {
        addresses,
        isLoading,
        fetchAddresses,
        deleteAddress,
        setAddressAsDefault,
        error
    } = useAddressesStore()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingAddress, setEditingAddress] = useState<AddressDto | null>(null)

    // Загружаем адреса при монтировании
    useEffect(() => {
        if (user) {
            fetchAddresses().catch(() => {
                toast.error('Ошибка загрузки адресов')
            })
        }
    }, [user, fetchAddresses])

    // Показываем ошибку если есть
    useEffect(() => {
        if (error) {
            toast.error(error)
        }
    }, [error])

    const handleSetDefault = async (addressId: number) => {
        try {
            await setAddressAsDefault(addressId)
            toast.success('Основной адрес изменен')
        } catch {
            toast.error('Ошибка при изменении основного адреса')
        }
    }

    const handleDelete = async (addressId: number) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот адрес?')) {
            return
        }

        try {
            await deleteAddress(addressId)
            toast.success('Адрес удален')
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка при удалении адреса'
            toast.error(errorMessage)
        }
    }

    const handleEdit = (address: AddressDto) => {
        setEditingAddress(address)
        setIsModalOpen(true)
    }

    const handleAddNew = () => {
        setEditingAddress(null)
        setIsModalOpen(true)
    }

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <h1 className="text-2xl font-bold mb-4">Войдите в аккаунт</h1>
                <ButtonLink href="/login">
                    Войти
                </ButtonLink>
            </div>
        )
    }

    return (
        <>
            <div className="min-h-screen bg-gray-50">
                <div className="flex flex-col md:flex-row">
                    <DashboardSidebar />

                    <div className="flex-1 p-4 md:p-8">
                        <div className="max-w-4xl mx-auto">
                            <div className="mb-8">
                                <h1 className="text-3xl font-bold text-gray-900">Адреса доставки</h1>
                                <p className="text-gray-600 mt-2">
                                    Управление адресами для доставки заказов
                                </p>
                            </div>

                            {/* Кнопка добавления */}
                            <div className="mb-6">
                                <button
                                    onClick={handleAddNew}
                                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                                    disabled={isLoading}
                                >
                                    <Plus className="h-4 w-4" />
                                    Добавить новый адрес
                                </button>
                            </div>

                            {/* Загрузка */}
                            {isLoading && addresses.length === 0 && (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                                    <p className="mt-4 text-gray-600">Загрузка адресов...</p>
                                </div>
                            )}

                            {/* Список адресов */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {addresses.map((address) => (
                                    <div key={address.addressId} className="bg-white border rounded-xl p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 rounded-lg">
                                                    {address.isDefault ? (
                                                        <Home className="h-5 w-5 text-blue-600" />
                                                    ) : (
                                                        <Building className="h-5 w-5 text-gray-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900">
                                                        {address.isDefault ? 'Основной адрес' : 'Дополнительный адрес'}
                                                    </h3>
                                                    {address.isDefault && (
                                                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                            По умолчанию
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                                <div>
                                                    <p className="font-medium">{address.street}</p>
                                                    <p className="text-gray-600">кв. {address.apartment || '—'}</p>
                                                    <p className="text-gray-600">{address.city}</p>
                                                    <p className="text-gray-600">{address.country}</p>
                                                    <p className="text-gray-600">Индекс: {address.postalCode}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 mt-6 pt-6 border-t">
                                            <button
                                                onClick={() => handleEdit(address)}
                                                className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 text-sm flex items-center gap-1"
                                            >
                                                <Edit className="h-3 w-3" />
                                                Редактировать
                                            </button>
                                            {!address.isDefault && (
                                                <>
                                                    <button
                                                        onClick={() => handleSetDefault(address.addressId)}
                                                        className="px-3 py-1.5 border rounded-lg hover:bg-green-50 hover:text-green-700 text-sm"
                                                    >
                                                        Сделать основным
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(address.addressId)}
                                                        className="px-3 py-1.5 border rounded-lg hover:bg-red-50 hover:text-red-700 text-sm flex items-center gap-1"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                        Удалить
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Сообщение если нет адресов */}
                            {!isLoading && addresses.length === 0 && (
                                <div className="bg-white border rounded-xl p-12 text-center">
                                    <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Адресов пока нет</h3>
                                    <p className="text-gray-600 mb-6">
                                        Добавьте свой первый адрес доставки
                                    </p>
                                    <button
                                        onClick={handleAddNew}
                                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 mx-auto"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Добавить адрес
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Модальное окно */}
            <AddressFormModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    setEditingAddress(null)
                }}
                address={editingAddress}
            />
        </>
    )
}