export default function AboutPage() {
    return (
        <div className="bg-stone-50">
            <section className="border-b border-stone-200 bg-[linear-gradient(135deg,#f7fee7_0%,#ffffff_45%,#ecfccb_100%)]">
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-4xl">
                        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-green-700">О ферме</p>
                        <h1 className="mb-6 text-4xl font-bold tracking-tight text-stone-900 md:text-5xl">
                            Я развиваю HarvestHub как одну ферму с личной ответственностью за каждый заказ
                        </h1>
                        <p className="max-w-3xl text-lg leading-8 text-stone-700">
                            Для меня HarvestHub не агрегатор фермеров, а продолжение собственной фермы. Я сам отвечаю за отбор
                            продукции, сезонное наполнение каталога, качество упаковки и ощущение, которое получает покупатель
                            после каждой доставки.
                        </p>
                    </div>
                </div>
            </section>

            <section className="container mx-auto px-4 py-16">
                <div className="grid gap-8 md:grid-cols-2">
                    <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
                        <h2 className="mb-4 text-2xl font-semibold text-stone-900">Моя миссия</h2>
                        <p className="leading-8 text-stone-600">
                            Делать свежие фермерские продукты доступными без лишней дистанции между хозяйством и покупателем.
                            Я хочу, чтобы сайт выглядел честно: у проекта одно лицо, один подход к качеству и понятная логика
                            отбора ассортимента.
                        </p>
                    </div>

                    <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
                        <h2 className="mb-4 text-2xl font-semibold text-stone-900">Во что я верю</h2>
                        <ul className="space-y-3 text-stone-600">
                            <li>Качество важнее ширины витрины.</li>
                            <li>Свежесть начинается с аккуратного сбора и честного хранения.</li>
                            <li>Покупателю проще доверять проекту, у которого есть одно понятное лицо.</li>
                            <li>Даже партнёрские поставки должны проходить через единый стандарт проверки.</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="container mx-auto px-4 pb-16">
                <div className="rounded-[2rem] border border-[#E6D3A7] bg-[linear-gradient(135deg,#FFFAF0_0%,#FFF8DC_58%,#FFEBCD_100%)] p-8 text-stone-900 shadow-sm">
                    <h2 className="mb-6 text-3xl font-bold">Как это работает</h2>
                    <div className="grid gap-6 sm:grid-cols-3">
                        <div className="rounded-2xl border border-[#E6D3A7] bg-white/70 p-5">
                            <div className="mb-3 text-2xl font-bold text-green-700">1</div>
                            <h3 className="mb-2 font-semibold">Я формирую ассортимент</h3>
                            <p className="text-sm leading-7 text-stone-700">
                                В каталоге остаются только те продукты, за которые я готов отвечать лично.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-[#E6D3A7] bg-white/70 p-5">
                            <div className="mb-3 text-2xl font-bold text-green-700">2</div>
                            <h3 className="mb-2 font-semibold">Вы оформляете заказ</h3>
                            <p className="text-sm leading-7 text-stone-700">
                                Заказ собирается с опорой на свежесть, сезонность и реальное наличие продукции.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-[#E6D3A7] bg-white/70 p-5">
                            <div className="mb-3 text-2xl font-bold text-green-700">3</div>
                            <h3 className="mb-2 font-semibold">Я контролирую доставку</h3>
                            <p className="text-sm leading-7 text-stone-700">
                                Продукты приезжают к покупателю в том виде, в каком я сам готов поставить их на свой стол.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
