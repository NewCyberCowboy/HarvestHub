import { Link } from 'react-router-dom'
import { APP_NAME } from '@/constants'

export function Footer() {
    return (
        <footer className="border-t border-[#E6D3A7] bg-[linear-gradient(180deg,#FFFAF0_0%,#FFF8DC_100%)]">
            <div className="container mx-auto px-4 py-12">
                <div className="grid md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-primary-600 text-lg">🌿</span>
                            </div>
                            <span className="text-xl font-bold">{APP_NAME}</span>
                        </div>
                        <p className="text-gray-600">
                            Свежие фермерские продукты прямо к вашему столу
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="font-semibold mb-4">Магазин</h3>
                        <ul className="space-y-2">
                            <li><Link to="/products" className="text-gray-600 hover:text-gray-900">Все продукты</Link></li>
                            <li><Link to="/products?category=vegetables" className="text-gray-600 hover:text-gray-900">Овощи</Link></li>
                            <li><Link to="/products?category=fruits" className="text-gray-600 hover:text-gray-900">Фрукты</Link></li>
                            <li><Link to="/products?category=dairy" className="text-gray-600 hover:text-gray-900">Молочные продукты</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="font-semibold mb-4">Компания</h3>
                        <ul className="space-y-2">
                            <li><Link to="/about" className="text-gray-600 hover:text-gray-900">О нас</Link></li>
                            <li><Link to="/contact" className="text-gray-600 hover:text-gray-900">Контакты</Link></li>
                            <li><Link to="/faq" className="text-gray-600 hover:text-gray-900">FAQ</Link></li>
                            <li><Link to="/terms" className="text-gray-600 hover:text-gray-900">Условия</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="font-semibold mb-4">Контакты</h3>
                        <p className="text-gray-600">
                            support@harvesthub.ru<br />
                            +7 (999) 123-45-67
                        </p>
                    </div>
                </div>

                <div className="border-t border-[#E6D3A7] mt-8 pt-8 text-center text-gray-600">
                    <p>© {new Date().getFullYear()} {APP_NAME}. Все права защищены.</p>
                </div>
            </div>
        </footer>
    )
}
