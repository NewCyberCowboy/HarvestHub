import toast from 'react-hot-toast'
import { FileText, Link2, Plus, RotateCcw, Save, ShieldCheck, Trash2 } from 'lucide-react'
import { useRequireAdmin } from '@/hooks/useRequireAdmin'
import { useSiteContentStore } from '@/store/siteContent.store'

export default function ContentManagement() {
    useRequireAdmin()

    const {
        documents,
        faqItems,
        updateDocument,
        updateFaqItem,
        addFaqItem,
        removeFaqItem,
        resetContent,
    } = useSiteContentStore()

    const handleReset = () => {
        resetContent()
        toast.success('Контент возвращён к значениям по умолчанию')
    }

    const handleSaveNotice = () => {
        toast.success('Изменения сохранены локально и уже видны на публичных страницах')
    }

    return (
        <div className="space-y-8">
            <section className="overflow-hidden rounded-[2rem] border border-green-200 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.14),_transparent_28%),linear-gradient(135deg,#FFFAF0_0%,#FFF8DC_58%,#FFEBCD_100%)] p-8 shadow-sm">
                <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
                    <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-green-700">Content CRM</p>
                        <h1 className="text-4xl font-bold tracking-tight text-stone-950">Управление документами сайта и FAQ</h1>
                        <p className="mt-5 max-w-2xl text-base leading-8 text-stone-700">
                            Здесь редактируется контент для публичных страниц: документы, ссылки и ответы на вопросы.
                            Всё собрано в одном месте, чтобы администратор быстро обновлял важные тексты без хаоса.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <StatCard label="Документов" value={documents.length} icon={<FileText className="h-5 w-5" />} />
                        <StatCard label="FAQ карточек" value={faqItems.length} icon={<ShieldCheck className="h-5 w-5" />} />
                        <StatCard
                            label="Ссылочных блоков"
                            value={documents.filter((document) => document.key !== 'privacy').length}
                            icon={<Link2 className="h-5 w-5" />}
                        />
                        <StatCard
                            label="Раскрывающихся блоков"
                            value={documents.filter((document) => document.key === 'privacy').length}
                            icon={<Save className="h-5 w-5" />}
                        />
                    </div>
                </div>
            </section>

            <section className="rounded-[1.75rem] border border-green-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-medium text-stone-500">Быстрые действия</p>
                        <p className="mt-1 text-sm text-stone-600">Сохранение уже происходит локально, эти кнопки помогают управлять состоянием контента.</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={handleSaveNotice}
                            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
                        >
                            <Save className="h-4 w-4" />
                            Сохранить
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="inline-flex items-center gap-2 rounded-2xl border border-stone-300 px-5 py-3 font-medium text-stone-800 transition hover:bg-stone-50"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Сбросить
                        </button>
                    </div>
                </div>
            </section>

            <section className="rounded-[1.75rem] border border-green-200 bg-white p-6 shadow-sm">
                <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700">Terms blocks</p>
                    <h2 className="mt-2 text-2xl font-bold text-stone-950">Документы страницы «Условия»</h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600">
                        Для политики конфиденциальности доступен большой раскрывающийся текст. Для остальных блоков можно
                        задавать заголовки, описания и ссылки, на которые ведут карточки.
                    </p>
                </div>

                <div className="space-y-5">
                    {documents.map((document) => (
                        <article key={document.key} className="rounded-[1.5rem] border border-green-200 bg-[linear-gradient(180deg,#ffffff_0%,#FFFAF0_100%)] p-5">
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700">
                                        {document.key === 'privacy'
                                            ? 'Политика конфиденциальности'
                                            : document.key === 'agreement'
                                                ? 'Пользовательское соглашение'
                                                : 'О приложении'}
                                    </p>
                                    <p className="mt-2 text-sm text-stone-500">
                                        {document.key === 'privacy'
                                            ? 'Раскрывающийся блок с большим текстом'
                                            : 'Карточка с переходом по ссылке'}
                                    </p>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF8DC] px-3 py-1 text-xs font-semibold text-green-700">
                                    {document.key === 'privacy' ? <FileText className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                                    {document.key === 'privacy' ? 'Inline content' : 'Link target'}
                                </div>
                            </div>

                            <div className="grid gap-4">
                                <Field label="Заголовок">
                                    <input
                                        type="text"
                                        value={document.title}
                                        onChange={(event) =>
                                            updateDocument(document.key, {
                                                title: event.target.value,
                                                summary: document.summary,
                                                content: document.content,
                                                href: document.href,
                                            })
                                        }
                                        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                                    />
                                </Field>

                                <Field label="Краткое описание">
                                    <textarea
                                        value={document.summary}
                                        onChange={(event) =>
                                            updateDocument(document.key, {
                                                title: document.title,
                                                summary: event.target.value,
                                                content: document.content,
                                                href: document.href,
                                            })
                                        }
                                        rows={3}
                                        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                                    />
                                </Field>

                                {document.key === 'privacy' ? (
                                    <Field label="Полный текст раскрывающегося блока">
                                        <textarea
                                            value={document.content}
                                            onChange={(event) =>
                                                updateDocument(document.key, {
                                                    title: document.title,
                                                    summary: document.summary,
                                                    content: event.target.value,
                                                    href: document.href,
                                                })
                                            }
                                            rows={14}
                                            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                                        />
                                    </Field>
                                ) : (
                                    <Field label="Ссылка для перехода">
                                        <input
                                            type="text"
                                            value={document.href ?? ''}
                                            onChange={(event) =>
                                                updateDocument(document.key, {
                                                    title: document.title,
                                                    summary: document.summary,
                                                    content: document.content,
                                                    href: event.target.value,
                                                })
                                            }
                                            placeholder="Например: /about или https://example.com/document"
                                            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                                        />
                                    </Field>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="rounded-[1.75rem] border border-green-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700">FAQ editor</p>
                        <h2 className="mt-2 text-2xl font-bold text-stone-950">Вопросы и ответы</h2>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600">
                            Эти карточки выводятся на публичной странице FAQ. Можно свободно менять вопросы, ответы и
                            добавлять новые элементы.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={addFaqItem}
                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
                    >
                        <Plus className="h-4 w-4" />
                        Добавить вопрос
                    </button>
                </div>

                <div className="space-y-4">
                    {faqItems.map((item, index) => (
                        <article key={item.id} className="rounded-[1.5rem] border border-green-200 bg-[linear-gradient(180deg,#ffffff_0%,#FFFAF0_100%)] p-5">
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700">
                                        Вопрос {String(index + 1).padStart(2, '0')}
                                    </p>
                                    <p className="mt-2 text-sm text-stone-500">Редактируемая карточка FAQ</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeFaqItem(item.id)}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Удалить
                                </button>
                            </div>

                            <div className="grid gap-4">
                                <Field label="Вопрос">
                                    <input
                                        type="text"
                                        value={item.question}
                                        onChange={(event) =>
                                            updateFaqItem(item.id, {
                                                question: event.target.value,
                                                answer: item.answer,
                                            })
                                        }
                                        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                                    />
                                </Field>

                                <Field label="Ответ">
                                    <textarea
                                        value={item.answer}
                                        onChange={(event) =>
                                            updateFaqItem(item.id, {
                                                question: item.question,
                                                answer: event.target.value,
                                            })
                                        }
                                        rows={6}
                                        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                                    />
                                </Field>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    )
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
    return (
        <div className="rounded-[1.5rem] border border-green-200 bg-white/75 p-4">
            <div className="mb-3 inline-flex rounded-2xl bg-[#FFF8DC] p-3 text-green-700">{icon}</div>
            <p className="text-sm font-medium text-stone-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-stone-950">{value}</p>
        </div>
    )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="grid gap-2">
            <span className="text-sm font-medium text-stone-700">{label}</span>
            {children}
        </label>
    )
}
