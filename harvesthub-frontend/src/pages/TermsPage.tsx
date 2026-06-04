import { useState } from 'react'
import { ArrowRight, ChevronDown, ExternalLink, FileText, Lock, ScrollText } from 'lucide-react'
import { useSiteContentStore } from '@/store/siteContent.store'

const iconMap = {
    privacy: Lock,
    agreement: ScrollText,
    'about-app': FileText,
} as const

export default function TermsPage() {
    const documents = useSiteContentStore((state) => state.documents)
    const [isPrivacyOpen, setIsPrivacyOpen] = useState(false)
    const privacyDocument = documents.find((document) => document.key === 'privacy')
    const linkedDocuments = documents.filter((document) => document.key !== 'privacy')

    return (
        <div id="top" className="bg-stone-50">
            <section className="border-b border-stone-200 bg-[linear-gradient(135deg,#f7fee7_0%,#ffffff_45%,#ecfccb_100%)]">
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-4xl">
                        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-green-700">Официальные материалы</p>
                        <h1 className="mb-6 text-4xl font-bold tracking-tight text-stone-900 md:text-5xl">
                            Условия использования HarvestHub
                        </h1>
                        <p className="max-w-3xl text-lg leading-8 text-stone-700">
                            Здесь собраны ключевые документы сервиса. Сверху находятся ссылки-переходы к разделам, а сами тексты ниже
                            можно актуализировать через административную панель без изменения верстки страницы.
                        </p>
                    </div>
                </div>
            </section>

            <section className="container mx-auto px-4 py-12">
                <div className="grid gap-6 md:grid-cols-3">
                    {privacyDocument && (
                        <button
                            type="button"
                            onClick={() => setIsPrivacyOpen((current) => !current)}
                            className={`group rounded-[2rem] border bg-white p-6 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${isPrivacyOpen ? 'border-green-300 shadow-xl shadow-green-100/60' : 'border-stone-200'}`}
                        >
                            <div className="mb-4 inline-flex rounded-2xl bg-green-100 p-3 text-green-700">
                                <Lock className="h-6 w-6" />
                            </div>
                            <h2 className="mb-3 text-2xl font-semibold text-stone-900">{privacyDocument.title}</h2>
                            <p className="mb-5 leading-7 text-stone-600">{privacyDocument.summary}</p>
                            <div className="inline-flex items-center gap-2 font-medium text-green-700">
                                {isPrivacyOpen ? 'Скрыть текст' : 'Открыть текст'}
                                <ChevronDown className={`h-4 w-4 transition ${isPrivacyOpen ? 'rotate-180' : ''}`} />
                            </div>
                        </button>
                    )}

                    {linkedDocuments.map((document) => {
                        const Icon = iconMap[document.key]
                        const href = document.href?.trim() || '#'

                        return (
                            <a
                                key={document.key}
                                href={href}
                                target={href.startsWith('http') ? '_blank' : undefined}
                                rel={href.startsWith('http') ? 'noreferrer' : undefined}
                                className="group rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                            >
                                <div className="mb-4 inline-flex rounded-2xl bg-green-100 p-3 text-green-700">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <h2 className="mb-3 text-2xl font-semibold text-stone-900">{document.title}</h2>
                                <p className="mb-5 leading-7 text-stone-600">{document.summary}</p>
                                <div className="inline-flex items-center gap-2 font-medium text-green-700">
                                    Перейти по ссылке
                                    {href.startsWith('http') ? (
                                        <ExternalLink className="h-4 w-4 transition group-hover:translate-x-1" />
                                    ) : (
                                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                                    )}
                                </div>
                            </a>
                        )
                    })}
                </div>
            </section>

            {privacyDocument && (
                <section className="container mx-auto px-4 pb-16">
                    <div
                        className="grid overflow-hidden transition-all duration-500 ease-out"
                        style={{ gridTemplateRows: isPrivacyOpen ? '1fr' : '0fr' }}
                    >
                        <div className="overflow-hidden">
                            <article className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
                                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-green-700">Полный текст</p>
                                        <h2 className="text-3xl font-bold text-stone-900">{privacyDocument.title}</h2>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsPrivacyOpen(false)}
                                        className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-green-300 hover:text-green-700"
                                    >
                                        Скрыть блок
                                    </button>
                                </div>

                                <div className="space-y-4 text-[1.02rem] leading-8 text-stone-700">
                                    {privacyDocument.content.split('\n\n').map((paragraph) => (
                                        <p key={paragraph}>{paragraph}</p>
                                    ))}
                                </div>
                            </article>
                        </div>
                    </div>
                </section>
            )}
        </div>
    )
}
