import { useState } from 'react'
import { ChevronDown, MessageCircleQuestion } from 'lucide-react'
import { useSiteContentStore } from '@/store/siteContent.store'

export default function FaqPage() {
    const faqItems = useSiteContentStore((state) => state.faqItems)
    const [openId, setOpenId] = useState<string | null>(faqItems[0]?.id ?? null)

    return (
        <div className="bg-stone-50">
            <section className="border-b border-stone-200 bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.16),_transparent_30%),linear-gradient(135deg,#ffffff_0%,#f0fdf4_50%,#ecfccb_100%)]">
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-4xl">
                        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-green-700">Вопросы и ответы</p>
                        <h1 className="mb-6 text-4xl font-bold tracking-tight text-stone-900 md:text-5xl">
                            FAQ HarvestHub
                        </h1>
                        <p className="max-w-3xl text-lg leading-8 text-stone-700">
                            Здесь собраны частые вопросы о работе фермы, заказах, доставке и правилах сервиса.
                            Каждый блок раскрывается плавно как отдельная карточка, чтобы страницу было приятно читать.
                        </p>
                    </div>
                </div>
            </section>

            <section className="container mx-auto px-4 py-14">
                <div className="mx-auto max-w-4xl space-y-4">
                    {faqItems.map((item, index) => {
                        const isOpen = openId === item.id

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setOpenId(isOpen ? null : item.id)}
                                className={`w-full overflow-hidden rounded-[2rem] border text-left transition-all duration-300 ${isOpen
                                    ? 'border-green-300 bg-white shadow-xl shadow-green-100/70'
                                    : 'border-stone-200 bg-white/90 shadow-sm hover:-translate-y-0.5 hover:shadow-lg'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4 p-6 md:p-7">
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-0.5 rounded-2xl p-3 ${isOpen ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'}`}>
                                            <MessageCircleQuestion className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
                                                Вопрос {String(index + 1).padStart(2, '0')}
                                            </div>
                                            <h2 className="text-xl font-semibold leading-8 text-stone-900 md:text-2xl">
                                                {item.question}
                                            </h2>
                                        </div>
                                    </div>

                                    <div className={`mt-1 rounded-full border p-2 transition ${isOpen ? 'rotate-180 border-green-200 text-green-700' : 'border-stone-200 text-stone-500'}`}>
                                        <ChevronDown className="h-5 w-5" />
                                    </div>
                                </div>

                                <div
                                    className="grid transition-all duration-300 ease-out"
                                    style={{
                                        gridTemplateRows: isOpen ? '1fr' : '0fr',
                                    }}
                                >
                                    <div className="overflow-hidden">
                                        <div className="px-6 pb-6 md:px-7 md:pb-7">
                                            <div className="rounded-[1.5rem] bg-stone-50 p-5 text-base leading-8 text-stone-700">
                                                {item.answer}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </section>
        </div>
    )
}
