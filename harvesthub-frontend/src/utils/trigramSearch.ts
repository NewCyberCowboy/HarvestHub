/**
 * Утилита для поиска с использованием триграмм (n-grams)
 * Позволяет находить совпадения даже при наличии опечаток
 * 
 * Пример использования:
 * - Запрос: "помидор" → триграммы: ["пом", "оми", "мид", "идо", "дор"]
 * - Продукт: "помидоры" → триграммы: ["пом", "оми", "мид", "идо", "дор", "оры"]
 * - Совпадения: 5 из 5 → высокая релевантность
 * 
 * Даже при опечатке "помидр" → ["пом", "оми", "мид", "идр"]
 * все равно будет найдено совпадение с "помидоры" (3 из 4 триграмм совпадают)
 */

/**
 * Разбивает строку на триграммы (группы по 3 символа)
 * @param text - исходный текст
 * @returns массив триграмм
 */
export function generateTrigrams(text: string): string[] {
    if (!text || text.length === 0) return []
    
    const normalized = text.toLowerCase().trim()
    if (normalized.length < 3) {
        // Если текст короче 3 символов, возвращаем его целиком
        return [normalized]
    }
    
    const trigrams: string[] = []
    for (let i = 0; i <= normalized.length - 3; i++) {
        trigrams.push(normalized.substring(i, i + 3))
    }
    
    return trigrams
}

/**
 * Вычисляет коэффициент схожести между двумя строками на основе триграмм
 * @param searchTerm - поисковый запрос
 * @param targetText - текст для сравнения
 * @returns коэффициент схожести от 0 до 1 (1 = полное совпадение)
 */
export function calculateSimilarity(searchTerm: string, targetText: string): number {
    if (!searchTerm || !targetText) return 0
    
    const searchTrigrams = generateTrigrams(searchTerm)
    const targetTrigrams = generateTrigrams(targetText)
    
    if (searchTrigrams.length === 0 || targetTrigrams.length === 0) return 0
    
    // Подсчитываем количество совпадающих триграмм
    const searchSet = new Set(searchTrigrams)
    const targetSet = new Set(targetTrigrams)
    
    let matches = 0
    searchSet.forEach(trigram => {
        if (targetSet.has(trigram)) {
            matches++
        }
    })
    
    // Коэффициент схожести = количество совпадений / общее количество триграмм в запросе
    return matches / searchTrigrams.length
}

/**
 * Проверяет, соответствует ли текст поисковому запросу с учетом опечаток
 * Улучшенный алгоритм:
 * - 1 буква: ищет все, что начинается с этой буквы
 * - 2 буквы: ищет все, что начинается с этих двух букв
 * - 3+ буквы: использует триграммы для поиска с опечатками
 * @param searchTerm - поисковый запрос
 * @param targetText - текст для проверки
 * @param threshold - минимальный порог схожести (по умолчанию 0.3)
 * @returns true, если текст соответствует запросу
 */
export function matchesTrigramSearch(
    searchTerm: string, 
    targetText: string, 
    threshold: number = 0.3
): boolean {
    if (!searchTerm || searchTerm.trim().length === 0) return true
    
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const normalizedTarget = targetText.toLowerCase()
    
    // Если запрос состоит из 1 буквы - ищем все, что начинается с этой буквы
    if (normalizedSearch.length === 1) {
        return normalizedTarget.startsWith(normalizedSearch)
    }
    
    // Если запрос состоит из 2 букв - ищем все, что начинается с этих двух букв
    if (normalizedSearch.length === 2) {
        return normalizedTarget.startsWith(normalizedSearch)
    }
    
    // Если запрос состоит из 3+ букв - используем триграммы
    const similarity = calculateSimilarity(normalizedSearch, normalizedTarget)
    return similarity >= threshold
}

/**
 * Ранжирует результаты поиска по релевантности
 * @param searchTerm - поисковый запрос
 * @param items - массив элементов для ранжирования
 * @param getText - функция для получения текста из элемента
 * @returns отсортированный массив элементов по убыванию релевантности
 */
export function rankByRelevance<T>(
    searchTerm: string,
    items: T[],
    getText: (item: T) => string
): T[] {
    if (!searchTerm || searchTerm.trim().length === 0) return items
    
    // Вычисляем релевантность для каждого элемента
    const itemsWithScore = items.map(item => {
        const text = getText(item)
        const similarity = calculateSimilarity(searchTerm, text)
        return { item, similarity }
    })
    
    // Сортируем по убыванию релевантности
    itemsWithScore.sort((a, b) => b.similarity - a.similarity)
    
    // Возвращаем только элементы с достаточной релевантностью
    return itemsWithScore
        .filter(({ similarity }) => similarity >= 0.3)
        .map(({ item }) => item)
}

/**
 * Поиск по нескольким полям с использованием триграмм
 * @param searchTerm - поисковый запрос
 * @param fields - массив текстовых полей для поиска
 * @param threshold - минимальный порог схожести
 * @returns true, если хотя бы одно поле соответствует запросу
 */
export function matchesAnyField(
    searchTerm: string,
    fields: (string | undefined | null)[],
    threshold: number = 0.3
): boolean {
    if (!searchTerm || searchTerm.trim().length === 0) return true
    
    return fields.some(field => {
        if (!field) return false
        return matchesTrigramSearch(searchTerm, field, threshold)
    })
}

