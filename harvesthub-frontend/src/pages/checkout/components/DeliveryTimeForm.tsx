import { useState, useEffect } from 'react'
import { Calendar, Clock } from 'lucide-react'

interface DeliveryTimeFormProps {
    onChange: (date: string, time: string) => void;
}

export function DeliveryTimeForm({ onChange }: DeliveryTimeFormProps) {
    const [selectedDate, setSelectedDate] = useState<string>('')
    const [selectedTime, setSelectedTime] = useState<string>('')

    // Генерируем доступные даты (сегодня + 7 дней)
    const generateAvailableDates = () => {
        const dates = []
        const today = new Date()

        for (let i = 0; i < 7; i++) {
            const date = new Date(today)
            date.setDate(today.getDate() + i)

            // Пропускаем воскресенье (0 - воскресенье)
            if (date.getDay() === 0) continue

            dates.push({
                date: date.toISOString().split('T')[0],
                label: formatDate(date),
            })
        }

        return dates
    }

    const formatDate = (date: Date) => {
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(today.getDate() + 1)

        if (date.toDateString() === today.toDateString()) {
            return 'Сегодня'
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Завтра'
        } else {
            return date.toLocaleDateString('ru-RU', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
            })
        }
    }

    const timeSlots = [
        { value: '09:00-12:00', label: '09:00 - 12:00' },
        { value: '12:00-15:00', label: '12:00 - 15:00' },
        { value: '15:00-18:00', label: '15:00 - 18:00' },
        { value: '18:00-21:00', label: '18:00 - 21:00' },
    ]

    const availableDates = generateAvailableDates()

    useEffect(() => {
        if (selectedDate && selectedTime) {
            onChange(selectedDate, selectedTime)
        }
    }, [selectedDate, selectedTime, onChange])

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold">Время доставки</h3>

            <div className="space-y-6">
                {/* Выбор даты */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>Выберите дату *</span>
                        </div>
                    </label>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {availableDates.map((dateOption) => (
                            <button
                                key={dateOption.date}
                                type="button"
                                onClick={() => setSelectedDate(dateOption.date)}
                                className={`p-3 border rounded-lg text-center transition-all ${selectedDate === dateOption.date
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-gray-300 hover:border-green-300 hover:bg-green-50'
                                    }`}
                            >
                                <div className="font-medium">{dateOption.label}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {new Date(dateOption.date).toLocaleDateString('ru-RU', {
                                        day: 'numeric',
                                        month: 'numeric',
                                    })}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Выбор времени */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>Выберите временной интервал *</span>
                        </div>
                    </label>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {timeSlots.map((timeSlot) => (
                            <button
                                key={timeSlot.value}
                                type="button"
                                onClick={() => setSelectedTime(timeSlot.value)}
                                className={`p-3 border rounded-lg text-center transition-all ${selectedTime === timeSlot.value
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-gray-300 hover:border-green-300 hover:bg-green-50'
                                    }`}
                            >
                                <div className="font-medium">{timeSlot.label}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Примечание */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        <strong>Важно:</strong> Доставка осуществляется с понедельника по субботу.
                        В воскресенье доставка не осуществляется.
                    </p>
                </div>
            </div>
        </div>
    )
}