import { MapPin, Phone, Mail, Clock } from 'lucide-react'

interface FarmerInfoProps {
    farmerName: string
    location: string
    phone: string
    email: string
    workingHours: string
}

export function FarmerInfo({
    farmerName,
    location,
    phone,
    email,
    workingHours
}: FarmerInfoProps) {
    return (
        <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-4">Информация о фермере</h3>

            <div className="space-y-4">
                <div>
                    <h4 className="font-medium text-gray-900">{farmerName}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                        Семейная ферма с 2015 года. Выращиваем экологически чистые продукты на уральской земле.
                    </p>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm">{location}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm">{phone}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm">{email}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm">{workingHours}</span>
                    </div>
                </div>

                <button className="w-full mt-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors font-medium">
                    Все продукты фермера
                </button>
            </div>
        </div>
    )
}