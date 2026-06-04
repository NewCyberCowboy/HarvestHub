import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { AddressDto, CreateAddressDto, UpdateAddressDto } from '@/types/backend'
import { useAddressesStore } from '@/store/addresses.store'
import AnchoredModalShell from '@/components/ui/AnchoredModalShell'

interface AddressFormModalProps {
    isOpen: boolean
    onClose: () => void
    address?: AddressDto | null
}

export default function AddressFormModal({ isOpen, onClose, address }: AddressFormModalProps) {
    const { createAddress, editAddress } = useAddressesStore()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState<CreateAddressDto | UpdateAddressDto>({
        street: '',
        apartment: '',
        city: '',
        postalCode: '',
        country: 'Россия',
        isDefault: false
    })

    // Заполняем форму при редактировании
    useEffect(() => {
        if (address) {
            setFormData({
                street: address.street,
                apartment: address.apartment,
                city: address.city,
                postalCode: address.postalCode,
                country: address.country,
                isDefault: address.isDefault
            })
        } else {
            // Сброс формы для создания
            setFormData({
                street: '',
                apartment: '',
                city: '',
                postalCode: '',
                country: 'Россия',
                isDefault: false
            })
        }
    }, [address])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            if (address) {
                // Редактирование
                await editAddress(address.addressId, formData as UpdateAddressDto)
            } else {
                // Создание
                await createAddress(formData as CreateAddressDto)
            }
            onClose()
        } catch (error) {
            console.error('Error saving address:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    if (!isOpen) return null

    return (
        <AnchoredModalShell backdropClassName="bg-black bg-opacity-50">
            <div className="bg-white rounded-xl w-full max-w-md">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">
                            {address ? 'Редактировать адрес' : 'Новый адрес'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded-lg"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Улица и дом *
                            </label>
                            <input
                                type="text"
                                name="street"
                                value={formData.street}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                placeholder="ул. Примерная, д. 1"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Квартира/Офис
                            </label>
                            <input
                                type="text"
                                name="apartment"
                                value={formData.apartment}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                placeholder="25"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Город *
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    placeholder="Москва"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Индекс *
                                </label>
                                <input
                                    type="text"
                                    name="postalCode"
                                    value={formData.postalCode}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    placeholder="123456"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Страна
                            </label>
                            <input
                                type="text"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                placeholder="Россия"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isDefault"
                                name="isDefault"
                                checked={formData.isDefault || false}
                                onChange={handleChange}
                                className="h-4 w-4 text-green-600 rounded"
                                disabled={isLoading}
                            />
                            <label htmlFor="isDefault" className="text-sm">
                                Сделать основным адресом
                            </label>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Сохранение...' : (address ? 'Сохранить' : 'Добавить')}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 border py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                disabled={isLoading}
                            >
                                Отмена
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AnchoredModalShell>
    )
}
