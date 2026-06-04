import { Link } from 'react-router-dom'
import { ArrowRight, Leaf, Shield, Truck } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { PRODUCT_CATEGORIES } from '../constants'

interface Category {
    id: string
    name: string
    icon: string
}

export default function HomePage() {
    return (
        <div className="bg-white">
            <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_30%),linear-gradient(135deg,#FFFAF0_0%,#ffffff_46%,#FFF8DC_100%)]">
                <div className="container mx-auto px-4 py-20 lg:py-24">
                    <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
                        <div>
                            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-200 bg-white/85 px-4 py-2 text-sm font-medium text-green-800 backdrop-blur">
                                <Leaf className="h-4 w-4" />
                                Одна ферма, честный ассортимент
                            </div>

                            <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 md:text-6xl">
                                Свежие продукты
                                <br />
                                <span className="text-primary-600">прямо с фермы</span>
                            </h1>

                            <p className="mb-8 max-w-2xl text-xl leading-8 text-gray-600">
                                Заказывайте овощи, фрукты и молочные продукты напрямую от меня. Сезонный подход,
                                бережная сборка и доставка в день заказа без лишней дистанции между фермой и покупателем.
                            </p>

                            <div className="mb-8 flex flex-wrap gap-3 text-sm text-stone-700">
                                <div className="rounded-full bg-white px-4 py-2 shadow-sm">Сезонные поставки</div>
                                <div className="rounded-full bg-white px-4 py-2 shadow-sm">Сборка малыми партиями</div>
                                <div className="rounded-full bg-white px-4 py-2 shadow-sm">Контроль качества вручную</div>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                <Button size="lg" className="px-7">
                                    <Link to="/products" className="flex items-center">
                                        За покупками <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                </Button>
                                <Button variant="outline" size="lg" className="border-[#E6D3A7] bg-white/80 px-7">
                                    <Link to="/farmers">О ферме</Link>
                                </Button>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#FFEBCD] blur-2xl" />
                            <div className="relative overflow-hidden rounded-[2rem] border border-[#E6D3A7] bg-white/75 p-5 shadow-2xl shadow-amber-100/50 backdrop-blur">
                                <div className="rounded-[1.75rem] bg-gradient-to-br from-primary-500 via-green-500 to-lime-400 p-10 text-white">
                                    <div className="mb-8 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm uppercase tracking-[0.25em] text-white/70">HarvestHub</p>
                                            <h2 className="mt-3 text-3xl font-bold">Свежесть без посредников</h2>
                                        </div>
                                        <div className="text-5xl">🌿</div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
                                            <p className="text-sm text-white/75">Формат</p>
                                            <p className="mt-2 text-lg font-semibold">Одна ферма</p>
                                        </div>
                                        <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
                                            <p className="text-sm text-white/75">Доставка</p>
                                            <p className="mt-2 text-lg font-semibold">В день заказа</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="mb-10 max-w-2xl">
                        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-green-700">Почему мне доверяют</p>
                        <h2 className="text-3xl font-bold text-gray-900">Небольшая ферма, но высокий стандарт качества</h2>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        <Card className="rounded-[1.75rem] border-[#E6D3A7] bg-[linear-gradient(180deg,#ffffff_0%,#FFFAF0_100%)] p-8 shadow-sm">
                            <div className="mb-4 inline-flex rounded-2xl bg-primary-100 p-3 text-primary-600">
                                <Leaf className="h-8 w-8" />
                            </div>
                            <h3 className="mb-3 text-xl font-semibold">100% Органик</h3>
                            <p className="text-gray-600">
                                Все продукты выращиваются без пестицидов и химических удобрений.
                            </p>
                        </Card>

                        <Card className="rounded-[1.75rem] border-[#E6D3A7] bg-[linear-gradient(180deg,#ffffff_0%,#FFFAF0_100%)] p-8 shadow-sm">
                            <div className="mb-4 inline-flex rounded-2xl bg-primary-100 p-3 text-primary-600">
                                <Truck className="h-8 w-8" />
                            </div>
                            <h3 className="mb-3 text-xl font-semibold">Быстрая доставка</h3>
                            <p className="text-gray-600">
                                Заказы собираются и отправляются в удобное для вас время без долгого хранения.
                            </p>
                        </Card>

                        <Card className="rounded-[1.75rem] border-[#E6D3A7] bg-[linear-gradient(180deg,#ffffff_0%,#FFFAF0_100%)] p-8 shadow-sm">
                            <div className="mb-4 inline-flex rounded-2xl bg-primary-100 p-3 text-primary-600">
                                <Shield className="h-8 w-8" />
                            </div>
                            <h3 className="mb-3 text-xl font-semibold">Гарантия качества</h3>
                            <p className="text-gray-600">
                                Каждый заказ проходит личный контроль перед тем, как попасть к покупателю.
                            </p>
                        </Card>
                    </div>
                </div>
            </section>

            <section className="bg-[linear-gradient(180deg,#ffffff_0%,#FFFAF0_100%)] py-16">
                <div className="container mx-auto px-4">
                    <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-green-700">Каталог</p>
                            <h2 className="text-3xl font-bold text-gray-900">Популярные категории</h2>
                        </div>
                        <Link to="/products" className="text-sm font-medium text-green-700 hover:text-green-800">
                            Открыть весь каталог
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                        {PRODUCT_CATEGORIES.map((category: Category) => (
                            <Link key={category.id} to={`/products?category=${category.id}`} className="group">
                                <Card className="rounded-[1.5rem] border-[#E6D3A7] bg-white p-6 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                                    <div className="mb-3 text-3xl">{category.icon}</div>
                                    <h3 className="font-medium group-hover:text-primary-600">{category.name}</h3>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}
