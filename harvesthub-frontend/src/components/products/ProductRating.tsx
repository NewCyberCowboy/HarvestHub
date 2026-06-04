import { Star, StarHalf } from 'lucide-react'

interface ProductRatingProps {
    rating: number
    reviewCount: number
}

export function ProductRating({ rating, reviewCount }: ProductRatingProps) {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    return (
        <div className="flex items-center gap-2">
            <div className="flex">
                {[...Array(fullStars)].map((_, i) => (
                    <Star key={`full-${i}`} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
                {hasHalfStar && <StarHalf className="h-5 w-5 text-yellow-400 fill-current" />}
                {[...Array(emptyStars)].map((_, i) => (
                    <Star key={`empty-${i}`} className="h-5 w-5 text-gray-300" />
                ))}
            </div>
            <span className="font-medium">{rating.toFixed(1)}</span>
            <span className="text-gray-500">({reviewCount} отзывов)</span>
        </div>
    )
}