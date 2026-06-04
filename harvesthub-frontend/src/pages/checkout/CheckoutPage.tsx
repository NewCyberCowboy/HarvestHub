// src/pages/checkout/CheckoutPage.tsx - ПОЛНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '@/store/cart.store'
import { useOrdersStore } from '@/store/orders.store'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'

// Компоненты форм (можно вынести в отдельные файлы позже)
const DeliveryTimeForm = () => (
    <div className="space-y-4">
        <h3 className="text-lg font-bold">Время доставки</h3>
        <input
            type="date"
            className="w-full p-2 border rounded"
            min={new Date().toISOString().split('T')[0]}
        />
        <input
            type="time"
            className="w-full p-2 border rounded"
        />
    </div>
)

const PaymentMethodForm = () => (
    <div className="space-y-4">
        <h3 className="text-lg font-bold">Способ оплаты</h3>
        <div className="space-y-2">
            <label className="flex items-center">
                <input type="radio" name="payment" value="cash" defaultChecked />
                <span className="ml-2">Наличными при получении</span>
            </label>
            <label className="flex items-center">
                <input type="radio" name="payment" value="card" />
                <span className="ml-2">Картой при получении</span>
            </label>
            <label className="flex items-center">
                <input type="radio" name="payment" value="online" />
                <span className="ml-2">Онлайн оплата</span>
            </label>
        </div>
    </div>
)

const OrderReview = () => {
    const { items, totalPrice, getDeliveryPrice } = useCartStore()
    const deliveryPrice = getDeliveryPrice()
    const totalWithDelivery = totalPrice + deliveryPrice

    return (
        <div className="bg-white border rounded-xl p-6 sticky top-6">
            <h3 className="text-lg font-bold mb-4">Ваш заказ</h3>
            <div className="space-y-2">
                {items.map(item => (
                    <div key={item.productId} className="flex justify-between">
                        <span className="text-sm">
                            {item.product?.name || 'Товар'} × {item.quantity}
                        </span>
                        <span className="font-medium">
                            {((item.product?.price || 0) * item.quantity).toFixed(2)} ₽
                        </span>
                    </div>
                ))}
                <div className="border-t pt-2">
                    <div className="flex justify-between text-sm">
                        <span>Товары ({items.length}):</span>
                        <span>{totalPrice.toFixed(2)} ₽</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                        <span>Доставка:</span>
                        <span className={deliveryPrice === 0 ? 'text-green-600' : ''}>
                            {deliveryPrice === 0 ? 'Бесплатно' : `${deliveryPrice} ₽`}
                        </span>
                    </div>
                    <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                        <span>Итого:</span>
                        <span>{totalWithDelivery.toFixed(2)} ₽</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function CheckoutPage() {
    const navigate = useNavigate()
    const { items } = useCartStore()
    const { createOrderFromCart } = useOrdersStore()

    const [step, setStep] = useState(1)
    const [notes, setNotes] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Данные формы
    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        deliveryAddress: '',
        city: 'Екатеринбург',
        apartment: '',
        postalCode: ''
    })

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    // Проверяем корзину в useEffect, чтобы избежать ошибки "Cannot update component during render"
    useEffect(() => {
        if (items.length === 0) {
            navigate('/cart')
        }
    }, [items.length, navigate])

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true)
            console.log('🔄 Начинаем оформление заказа...')

            // Валидация
            if (!formData.customerName.trim()) {
                alert('Пожалуйста, укажите ваше имя')
                return
            }
            if (!formData.customerPhone.trim()) {
                alert('Пожалуйста, укажите ваш телефон')
                return
            }
            if (!formData.deliveryAddress.trim()) {
                alert('Пожалуйста, укажите адрес доставки')
                return
            }

            // Формируем полный адрес доставки
            const fullAddress = [
                formData.deliveryAddress,
                formData.apartment && `кв. ${formData.apartment}`,
                formData.city,
                formData.postalCode
            ].filter(Boolean).join(', ')

            // Создаем заказ
            const newOrder = await createOrderFromCart(fullAddress, notes || "")
            console.log('✅ Заказ создан! ID:', newOrder.orderId)

            // Перенаправляем на страницу успеха с РЕАЛЬНЫМ ID
            // Используем setTimeout, чтобы избежать ошибки обновления компонента во время рендера
            setTimeout(() => {
                navigate(`/checkout/success/${newOrder.orderId}`)
            }, 0)

        } catch (error: any) {
            console.error('❌ Ошибка при оформлении заказа:', error)
            alert(`Произошла ошибка: ${error.message || 'Неизвестная ошибка'}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const totalSteps = 4
    const progress = (step / totalSteps) * 100

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Шаги */}
                    <div className="mb-8">
                        <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Оформление заказа</span>
                            <span className="text-sm text-gray-500">Шаг {step} из {totalSteps}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                        {/* Левая колонка - Форма */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-xl border p-6 shadow-sm">
                                {step === 1 && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold">Контактные данные</h3>
                                        <input
                                            type="text"
                                            placeholder="Имя *"
                                            value={formData.customerName}
                                            onChange={(e) => handleInputChange('customerName', e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            required
                                        />
                                        <input
                                            type="tel"
                                            placeholder="Телефон *"
                                            value={formData.customerPhone}
                                            onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            required
                                        />
                                        <input
                                            type="email"
                                            placeholder="Email *"
                                            value={formData.customerEmail}
                                            onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold">Адрес доставки</h3>
                                        <input
                                            type="text"
                                            placeholder="Улица, дом *"
                                            value={formData.deliveryAddress}
                                            onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Квартира (необязательно)"
                                            value={formData.apartment}
                                            onChange={(e) => handleInputChange('apartment', e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <input
                                                type="text"
                                                placeholder="Город"
                                                value={formData.city}
                                                onChange={(e) => handleInputChange('city', e.target.value)}
                                                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Почтовый индекс"
                                                value={formData.postalCode}
                                                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                                                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                )}

                                {step === 3 && <DeliveryTimeForm />}
                                {step === 4 && (
                                    <div className="space-y-6">
                                        <PaymentMethodForm />
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Комментарий к заказу (необязательно)
                                            </label>
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                rows={3}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                placeholder="Например, код домофона, удобное время доставки и т.д."
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Навигация */}
                                <div className="flex justify-between mt-8 pt-6 border-t">
                                    {step > 1 ? (
                                        <Button
                                            variant="outline"
                                            onClick={() => setStep(step - 1)}
                                            className="px-6"
                                        >
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Назад
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            onClick={() => navigate('/cart')}
                                            className="px-6"
                                        >
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Вернуться в корзину
                                        </Button>
                                    )}

                                    {step < totalSteps ? (
                                        <Button
                                            onClick={() => {
                                                // Валидация перед переходом на следующий шаг
                                                if (step === 1) {
                                                    if (!formData.customerName.trim()) {
                                                        alert('Пожалуйста, укажите ваше имя')
                                                        return
                                                    }
                                                    if (!formData.customerPhone.trim()) {
                                                        alert('Пожалуйста, укажите ваш телефон')
                                                        return
                                                    }
                                                    if (!formData.customerEmail.trim()) {
                                                        alert('Пожалуйста, укажите ваш email')
                                                        return
                                                    }
                                                }
                                                if (step === 2 && !formData.deliveryAddress.trim()) {
                                                    alert('Пожалуйста, укажите адрес доставки')
                                                    return
                                                }
                                                setStep(step + 1)
                                            }}
                                            className="px-6"
                                        >
                                            Продолжить
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            className="px-6"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    Оформляем...
                                                </>
                                            ) : (
                                                'Оформить заказ'
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Правая колонка - Превью заказа */}
                        <div className="mt-8 lg:mt-0">
                            <OrderReview />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}