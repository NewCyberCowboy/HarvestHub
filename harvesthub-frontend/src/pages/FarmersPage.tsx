import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Leaf, MapPin, Sprout, Truck } from 'lucide-react'

const farmerHighlights = [
    {
        icon: Leaf,
        title: 'Сезонный подход',
        description: 'Я собираю и отбираю продукцию по сезону, чтобы на стол попадали действительно свежие продукты.',
    },
    {
        icon: Truck,
        title: 'Бережная доставка',
        description: 'Заказы собираются небольшими партиями и быстро отправляются покупателям без долгого хранения.',
    },
    {
        icon: BadgeCheck,
        title: 'Личный контроль качества',
        description: 'Каждую поставку я проверяю лично, даже если часть ассортимента приходит от партнёрских хозяйств.',
    },
]

export default function FarmersPage() {
    return (
        <div className="bg-stone-50">
            <section className="border-b border-stone-200 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_35%),linear-gradient(135deg,#f7fee7_0%,#ffffff_55%,#ecfccb_100%)]">
                <div className="container mx-auto grid gap-10 px-4 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                    <div>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-200 bg-white/80 px-4 py-2 text-sm font-medium text-green-800 backdrop-blur">
                            <Sprout className="h-4 w-4" />
                            Одна ферма, один подход к качеству
                        </div>
                        <h1 className="mb-5 max-w-3xl text-4xl font-bold tracking-tight text-stone-900 md:text-5xl">
                            Ферма HarvestHub
                        </h1>
                        <p className="mb-6 max-w-2xl text-lg leading-8 text-stone-700">
                            Здесь нет витрины с десятками отдельных фермеров. HarvestHub представляет одну ферму и один
                            стандарт качества: честный состав, аккуратный сбор урожая и понятный путь продукта от поля до заказа.
                        </p>
                        <div className="mb-8 flex flex-wrap gap-3 text-sm text-stone-700">
                            <div className="rounded-full bg-white px-4 py-2 shadow-sm">Свежие овощи и зелень</div>
                            <div className="rounded-full bg-white px-4 py-2 shadow-sm">Сезонные поставки</div>
                            <div className="rounded-full bg-white px-4 py-2 shadow-sm">Контроль качества вручную</div>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <Link
                                to="/products"
                                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
                            >
                                Смотреть каталог
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                to="/about"
                                className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-6 py-3 font-semibold text-stone-900 transition hover:border-green-300 hover:text-green-700"
                            >
                                История фермы
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-green-100 bg-white p-8 shadow-xl shadow-green-100/60">
                        <div className="mb-6 rounded-[1.5rem] bg-gradient-to-br from-green-600 via-emerald-500 to-lime-400 p-8 text-white">
                            <p className="mb-3 text-sm uppercase tracking-[0.25em] text-white/80">О владельце</p>
                            <h2 className="mb-2 text-3xl font-bold">Фермер и куратор HarvestHub</h2>
                            <p className="text-sm leading-7 text-white/90">
                                Я отвечаю за ассортимент, качество поставок и то, каким вы видите проект каждый день.
                            </p>
                        </div>

                        <div className="space-y-4 text-sm text-stone-700">
                            <div className="flex items-start gap-3 rounded-2xl bg-stone-50 p-4">
                                <MapPin className="mt-0.5 h-5 w-5 text-green-700" />
                                <div>
                                    <p className="font-semibold text-stone-900">Локальное производство</p>
                                    <p>Основу ассортимента формирует одна ферма, дополненная проверенными сезонными поставками.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 rounded-2xl bg-stone-50 p-4">
                                <Leaf className="mt-0.5 h-5 w-5 text-green-700" />
                                <div>
                                    <p className="font-semibold text-stone-900">Один стандарт отбора</p>
                                    <p>В каталоге могут быть разные поставщики, но решение о добавлении продукции принимается в одном месте.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="container mx-auto px-4 py-16">
                <div className="mb-10 max-w-2xl">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-green-700">Как я работаю</p>
                    <h2 className="text-3xl font-bold text-stone-900">Вместо списка фермеров здесь одна понятная ответственность</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {farmerHighlights.map(({ icon: Icon, title, description }) => (
                        <div key={title} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 inline-flex rounded-2xl bg-green-100 p-3 text-green-700">
                                <Icon className="h-6 w-6" />
                            </div>
                            <h3 className="mb-3 text-xl font-semibold text-stone-900">{title}</h3>
                            <p className="leading-7 text-stone-600">{description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="container mx-auto px-4 pb-16">
                <div className="grid gap-6 rounded-[2rem] border border-[#E6D3A7] bg-[linear-gradient(135deg,#FFFAF0_0%,#FFF8DC_58%,#FFEBCD_100%)] p-8 text-stone-900 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-green-300">Важно</p>
                        <h2 className="mb-4 text-3xl font-bold">Каталог остаётся широким, но публично проект представлен одной фермой</h2>
                        <p className="max-w-3xl text-stone-700">
                            Некоторые товары в каталоге могут поступать от других хозяйств, но на сайте не показывается отдельная витрина
                            фермеров и не создаётся история про подключение новых владельцев. HarvestHub выглядит как одна ферма с единым лицом.
                        </p>
                    </div>

                    <Link
                        to="/products"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-stone-900 transition hover:bg-green-50"
                    >
                        Перейти к продуктам
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </section>
        </div>
    )
}
