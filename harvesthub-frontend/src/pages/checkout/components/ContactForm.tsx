import { useState } from 'react'
import { User, Phone, Mail } from 'lucide-react'
import { ContactFormData } from '@/types/order'

interface ContactFormProps {
    initialData?: ContactFormData
    onChange: (data: ContactFormData) => void
}

export function ContactForm({ initialData, onChange }: ContactFormProps) {
    const [formData, setFormData] = useState<ContactFormData>({
        customerName: initialData?.customerName || '',
        customerPhone: initialData?.customerPhone || '',
        customerEmail: initialData?.customerEmail || '',
    })

    const handleChange = (field: keyof ContactFormData, value: string) => {
        const newData = { ...formData, [field]: value }
        setFormData(newData)
        onChange(newData)
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold">Контактные данные</h3>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        ФИО *
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            required
                            value={formData.customerName}
                            onChange={(e) => handleChange('customerName', e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Иванов Иван Иванович"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Телефон *
                    </label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="tel"
                            required
                            value={formData.customerPhone}
                            onChange={(e) => handleChange('customerPhone', e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="+7 (900) 123-45-67"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="email"
                            required
                            value={formData.customerEmail}
                            onChange={(e) => handleChange('customerEmail', e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="ivanov@example.com"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}