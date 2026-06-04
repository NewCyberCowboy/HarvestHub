import { useState } from 'react'
import { MapPin, Home, Hash } from 'lucide-react'
import { Address } from '@/types/order'

interface AddressFormProps {
    initialData?: Omit<Address, 'id' | 'isDefault'>
    onChange: (data: Omit<Address, 'id' | 'isDefault'>) => void
}

export function AddressForm({ initialData, onChange }: AddressFormProps) {
    const [formData, setFormData] = useState<Omit<Address, 'id' | 'isDefault'>>({
        street: initialData?.street || '',
        apartment: initialData?.apartment || '',
        city: initialData?.city || 'Екатеринбург',
        postalCode: initialData?.postalCode || '',
        country: initialData?.country || 'Россия',
    })

    const handleChange = (field: keyof typeof formData, value: string) => {
        const newData = { ...formData, [field]: value }
        setFormData(newData)
        onChange(newData)
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold">Адрес доставки</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Город
                    </label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            required
                            value={formData.city}
                            onChange={(e) => handleChange('city', e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Екатеринбург"
                            readOnly
                        />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        Доставка доступна только по Екатеринбургу
                    </p>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Улица и дом *
                    </label>
                    <div className="relative">
                        <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            required
                            value={formData.street}
                            onChange={(e) => handleChange('street', e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="ул. Ленина, д. 1"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Квартира
                    </label>
                    <div className="relative">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            value={formData.apartment}
                            onChange={(e) => handleChange('apartment', e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="10"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Индекс
                    </label>
                    <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => handleChange('postalCode', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="620000"
                    />
                </div>
            </div>
        </div>
    )
}