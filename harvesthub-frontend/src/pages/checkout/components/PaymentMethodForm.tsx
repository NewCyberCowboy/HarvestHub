import { CreditCard, Wallet, Smartphone } from 'lucide-react'

interface PaymentMethodFormProps {
    selected: 'card' | 'cash' | 'online';
    onChange: (method: 'card' | 'cash' | 'online') => void;
}

export function PaymentMethodForm({ selected, onChange }: PaymentMethodFormProps) {
    const paymentMethods = [
        {
            id: 'cash',
            title: 'Наличными при получении',
            description: 'Оплата курьеру наличными при доставке',
            icon: Wallet,
        },
        {
            id: 'card',
            title: 'Картой при получении',
            description: 'Оплата картой курьеру при доставке',
            icon: CreditCard,
        },
        {
            id: 'online',
            title: 'Онлайн оплата',
            description: 'Банковской картой онлайн',
            icon: Smartphone,
        },
    ]

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold">Способ оплаты</h3>

            <div className="space-y-3">
                {paymentMethods.map((method) => {
                    const Icon = method.icon
                    const isSelected = selected === method.id

                    return (
                        <button
                            key={method.id}
                            type="button"
                            onClick={() => onChange(method.id as 'card' | 'cash' | 'online')}
                            className={`w-full p-4 border rounded-xl text-left transition-all ${isSelected
                                    ? 'border-green-500 bg-green-50 ring-2 ring-green-500 ring-opacity-50'
                                    : 'border-gray-300 hover:border-green-300 hover:bg-green-50'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-lg ${isSelected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    <Icon className="h-5 w-5" />
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-gray-900">{method.title}</h4>
                                        {isSelected && (
                                            <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Информация о способах оплаты */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Информация об оплате</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                    <li>• При оплате наличными приготовьте сумму без сдачи</li>
                    <li>• При оплате картой курьер возьмет с собой терминал</li>
                    <li>• Онлайн оплата осуществляется через безопасный шлюз</li>
                    <li>• Чек будет отправлен на указанный email</li>
                </ul>
            </div>
        </div>
    )
}