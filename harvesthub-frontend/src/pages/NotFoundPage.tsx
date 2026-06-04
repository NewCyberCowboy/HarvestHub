import { Link } from 'react-router-dom'
import { Home, Package, Users, Info } from 'lucide-react'

export default function NotFoundPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto p-8">
                <div className="text-9xl font-bold text-gray-200 mb-4">404</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Страница не найдена</h1>
                <p className="text-gray-600 mb-8 text-lg">
                    К сожалению, запрашиваемая страница не существует или была удалена.
                </p>
                <div className="space-y-4">
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium transition-colors"
                    >
                        <Home className="h-5 w-5" />
                        Вернуться на главную
                    </Link>
                    <div className="pt-6">
                        <p className="text-gray-500 text-sm mb-4">Популярные страницы:</p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Link 
                                to="/products" 
                                className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 text-sm font-medium transition-colors"
                            >
                                <Package className="h-4 w-4" />
                                Продукты
                            </Link>
                            <span className="text-gray-300">•</span>
                            <Link 
                                to="/farmers" 
                                className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 text-sm font-medium transition-colors"
                            >
                                <Users className="h-4 w-4" />
                                Фермеры
                            </Link>
                            <span className="text-gray-300">•</span>
                            <Link 
                                to="/about" 
                                className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 text-sm font-medium transition-colors"
                            >
                                <Info className="h-4 w-4" />
                                О нас
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
