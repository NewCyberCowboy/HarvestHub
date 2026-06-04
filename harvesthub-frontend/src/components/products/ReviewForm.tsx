import { useState } from 'react'
import { Star, MessageSquare } from 'lucide-react'
import { CreateReviewDto } from '@/types/backend'
import { reviewsApi } from '@/api/reviews.api'

interface ReviewFormProps {
    productId: number
    orderId: number
    onSuccess?: () => void
    onCancel?: () => void
}

export function ReviewForm({ productId, orderId, onSuccess, onCancel }: ReviewFormProps) {
    const [rating, setRating] = useState(0)
    const [hoveredRating, setHoveredRating] = useState(0)
    const [comment, setComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (rating === 0) {
            setError('Пожалуйста, выберите оценку')
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            const reviewData: CreateReviewDto = {
                productId,
                orderId,
                rating,
                comment: comment.trim() || undefined
            }

            await reviewsApi.createReview(reviewData)
            
            // Сброс формы
            setRating(0)
            setComment('')
            setError(null)
            
            if (onSuccess) {
                onSuccess()
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Не удалось создать отзыв'
            setError(errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Оставить отзыв</h3>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* Рейтинг */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Оценка <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                            className="focus:outline-none"
                        >
                            <Star
                                className={`h-8 w-8 transition-colors ${
                                    star <= (hoveredRating || rating)
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-gray-300'
                                }`}
                            />
                        </button>
                    ))}
                </div>
                {rating > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                        Вы выбрали {rating} {rating === 1 ? 'звезду' : rating < 5 ? 'звезды' : 'звезд'}
                    </p>
                )}
            </div>

            {/* Комментарий */}
            <div className="mb-4">
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                    <MessageSquare className="inline h-4 w-4 mr-1" />
                    Комментарий (необязательно)
                </label>
                <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="Расскажите о вашем опыте с этим продуктом..."
                    maxLength={1000}
                />
                <div className="text-xs text-gray-500 mt-1 text-right">
                    {comment.length}/1000
                </div>
            </div>

            {/* Кнопки */}
            <div className="flex gap-3">
                <button
                    type="submit"
                    disabled={isSubmitting || rating === 0}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Отправка...' : 'Отправить отзыв'}
                </button>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Отмена
                    </button>
                )}
            </div>

            <p className="text-xs text-gray-500 mt-3">
                * Отзыв будет опубликован после модерации администратором
            </p>
        </form>
    )
}










