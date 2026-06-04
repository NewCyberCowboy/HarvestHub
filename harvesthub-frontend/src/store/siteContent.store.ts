import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SiteDocument {
    key: 'privacy' | 'agreement' | 'about-app'
    title: string
    summary: string
    content: string
    href?: string
}

export interface FaqItem {
    id: string
    question: string
    answer: string
}

interface SiteContentState {
    documents: SiteDocument[]
    faqItems: FaqItem[]
    updateDocument: (key: SiteDocument['key'], payload: Omit<SiteDocument, 'key'>) => void
    updateFaqItem: (id: string, payload: Omit<FaqItem, 'id'>) => void
    addFaqItem: () => void
    removeFaqItem: (id: string) => void
    resetContent: () => void
}

const defaultDocuments: SiteDocument[] = [
    {
        key: 'privacy',
        title: 'Политика конфиденциальности',
        summary: 'Как HarvestHub собирает, хранит и использует персональные данные пользователей.',
        content: `HarvestHub бережно относится к персональным данным покупателей и гостей сайта.

Я собираю только те сведения, которые нужны для оформления заказов, доставки, обратной связи и улучшения сервиса. Это могут быть имя, номер телефона, адрес доставки, адрес электронной почты и история заказов.

Данные не передаются случайным третьим лицам. Они используются для обработки заказов, связи с покупателем по вопросам доставки, возвратов, качества продукции и технической поддержки.

Пользователь может запросить уточнение, обновление или удаление своих данных в рамках действующего законодательства и внутренних правил сервиса.

Если в проект будут добавляться новые способы обработки данных, этот документ можно обновить через панель администратора без изменения кода страницы.`,
        href: '',
    },
    {
        key: 'agreement',
        title: 'Пользовательское соглашение',
        summary: 'Основные правила использования сайта, оформления заказов и взаимодействия с сервисом.',
        content: `Используя сайт HarvestHub, пользователь подтверждает, что ознакомился с правилами сервиса и соглашается с ними.

Сайт предоставляет доступ к каталогу товаров, оформлению заказов, личному кабинету и истории покупок. Пользователь обязуется указывать достоверные данные при регистрации и оформлении заказа.

Наличие товара, сроки доставки, стоимость и итоговая комплектация заказа могут уточняться в зависимости от сезона, фактического остатка и особенностей фермерской продукции.

HarvestHub оставляет за собой право обновлять ассортимент, корректировать описание товаров, а также изменять условия сервиса для поддержания актуальности информации.

Продолжение использования сайта после обновления документа означает согласие пользователя с новой редакцией соглашения.`,
        href: '/about',
    },
    {
        key: 'about-app',
        title: 'О приложении',
        summary: 'Краткое описание сервиса, его назначения и того, как устроена работа HarvestHub.',
        content: `HarvestHub — это цифровая витрина одной фермы с единым стандартом отбора продукции.

Через сайт и мобильное приложение покупатель может выбрать свежие продукты, оформить заказ, сохранить адреса доставки, следить за статусом покупки и возвращаться к избранным товарам.

Сервис создан так, чтобы фермерская продукция была доступна без лишней дистанции между хозяйством и покупателем. Даже если в каталоге появляются партнёрские поставки, контроль качества и финальное решение по ассортименту остаются в одной точке.

Этот текст можно развивать дальше: добавить юридические реквизиты, правила доставки, возвратов, оплаты и любую другую официальную информацию через админ-панель.`,
        href: '/faq',
    },
]

const defaultFaqItems: FaqItem[] = [
    {
        id: 'faq-1',
        question: 'Как быстро собирается заказ?',
        answer: 'Большая часть заказов собирается в день оформления. Если товар сезонный или требует уточнения по наличию, я дополнительно связываюсь с покупателем и подтверждаю детали перед доставкой.',
    },
    {
        id: 'faq-2',
        question: 'Можно ли доверять качеству продукции?',
        answer: 'Да. HarvestHub работает как одна ферма с единым стандартом проверки. Даже если часть позиций приходит от партнёрских хозяйств, в каталог попадает только то, за что я готов отвечать лично.',
    },
    {
        id: 'faq-3',
        question: 'Как происходит доставка?',
        answer: 'После оформления заказа я или команда доставки подтверждаем состав, адрес и удобное время. Продукция собирается малыми партиями, чтобы доехать до покупателя максимально свежей.',
    },
    {
        id: 'faq-4',
        question: 'Где посмотреть официальные условия сервиса?',
        answer: 'На странице "Условия" доступны разделы с политикой конфиденциальности, пользовательским соглашением и общей информацией о приложении. Эти материалы можно актуализировать через админ-панель.',
    },
]

const createFaqId = () => `faq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export const useSiteContentStore = create<SiteContentState>()(
    persist(
        (set) => ({
            documents: defaultDocuments,
            faqItems: defaultFaqItems,

            updateDocument: (key, payload) =>
                set((state) => ({
                    documents: state.documents.map((document) =>
                        document.key === key ? { ...document, ...payload } : document
                    ),
                })),

            updateFaqItem: (id, payload) =>
                set((state) => ({
                    faqItems: state.faqItems.map((item) => (item.id === id ? { ...item, ...payload } : item)),
                })),

            addFaqItem: () =>
                set((state) => ({
                    faqItems: [
                        ...state.faqItems,
                        {
                            id: createFaqId(),
                            question: 'Новый вопрос',
                            answer: 'Добавьте ответ через панель управления.',
                        },
                    ],
                })),

            removeFaqItem: (id) =>
                set((state) => ({
                    faqItems: state.faqItems.filter((item) => item.id !== id),
                })),

            resetContent: () =>
                set({
                    documents: defaultDocuments,
                    faqItems: defaultFaqItems,
                }),
        }),
        {
            name: 'harvesthub-site-content',
            version: 1,
            migrate: (persistedState) => {
                const state = persistedState as Partial<SiteContentState> | undefined

                return {
                    documents: state?.documents?.map((document) => ({
                        ...document,
                        href: document.href ?? '',
                    })) ?? defaultDocuments,
                    faqItems: state?.faqItems ?? defaultFaqItems,
                }
            },
        }
    )
)
