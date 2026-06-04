/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ProductGalleryProps {
    images: string[]
    productName: string
}

export function ProductGallery({ images }: ProductGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(0)

    const goToPrevious = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        )
    }

    const goToNext = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === images.length - 1 ? 0 : prevIndex + 1
        )
    }

    const goToImage = (index: number) => {
        setCurrentIndex(index)
    }

    return (
        <div className="space-y-4">
            {/* Основное изображение */}
            <div className="relative bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl overflow-hidden aspect-square">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-8xl">
                        {images[currentIndex]?.includes('potato') && '🥔'}
                        {images[currentIndex]?.includes('carrot') && '🥕'}
                        {images[currentIndex]?.includes('cucumber') && '🥒'}
                        {images[currentIndex]?.includes('tomato') && '🍅'}
                        {images[currentIndex]?.includes('apple') && '🍎'}
                        {images[currentIndex]?.includes('milk') && '🥛'}
                        {images[currentIndex]?.includes('smetana') && '🥣'}
                        {images[currentIndex]?.includes('eggs') && '🥚'}
                        {!images[currentIndex] && '🌿'}
                    </div>
                </div>

                {/* Навигационные кнопки */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={goToPrevious}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-colors"
                            aria-label="Предыдущее изображение"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-colors"
                            aria-label="Следующее изображение"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    </>
                )}
            </div>

            {/* Миниатюры */}
            {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => goToImage(index)}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${index === currentIndex
                                    ? 'border-primary-500 ring-2 ring-primary-200'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                            aria-label={`Показать изображение ${index + 1}`}
                        >
                            <div className="w-full h-full bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
                                <div className="text-2xl">
                                    {image.includes('potato') && '🥔'}
                                    {image.includes('carrot') && '🥕'}
                                    {image.includes('cucumber') && '🥒'}
                                    {image.includes('tomato') && '🍅'}
                                    {image.includes('apple') && '🍎'}
                                    {image.includes('milk') && '🥛'}
                                    {image.includes('smetana') && '🥣'}
                                    {image.includes('eggs') && '🥚'}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}