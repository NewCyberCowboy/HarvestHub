export type CrmPriority = 'normal' | 'medium' | 'high' | 'critical'

export type CrmAnnotation = {
    priority: CrmPriority
    tags: string[]
}

const DEFAULT_ANNOTATION: CrmAnnotation = {
    priority: 'normal',
    tags: [],
}

function getStorageKey(namespace: string) {
    return `harvesthub-crm-annotations-${namespace}`
}

export function loadCrmAnnotations(namespace: string): Record<string, CrmAnnotation> {
    if (typeof window === 'undefined') return {}

    const raw = window.localStorage.getItem(getStorageKey(namespace))
    if (!raw) return {}

    try {
        const parsed = JSON.parse(raw) as Record<string, CrmAnnotation>
        return parsed ?? {}
    } catch {
        return {}
    }
}

export function saveCrmAnnotations(namespace: string, annotations: Record<string, CrmAnnotation>) {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(getStorageKey(namespace), JSON.stringify(annotations))
}

export function getCrmAnnotation(
    annotations: Record<string, CrmAnnotation>,
    id: number | string
): CrmAnnotation {
    return annotations[String(id)] ?? DEFAULT_ANNOTATION
}

export function setCrmPriority(
    annotations: Record<string, CrmAnnotation>,
    id: number | string,
    priority: CrmPriority
) {
    const key = String(id)
    const current = getCrmAnnotation(annotations, key)

    return {
        ...annotations,
        [key]: {
            ...current,
            priority,
        },
    }
}

export function addCrmTag(
    annotations: Record<string, CrmAnnotation>,
    id: number | string,
    tag: string
) {
    const normalized = tag.trim()
    if (!normalized) return annotations

    const key = String(id)
    const current = getCrmAnnotation(annotations, key)
    if (current.tags.includes(normalized)) return annotations

    return {
        ...annotations,
        [key]: {
            ...current,
            tags: [...current.tags, normalized],
        },
    }
}

export function removeCrmTag(
    annotations: Record<string, CrmAnnotation>,
    id: number | string,
    tag: string
) {
    const key = String(id)
    const current = getCrmAnnotation(annotations, key)

    return {
        ...annotations,
        [key]: {
            ...current,
            tags: current.tags.filter((item) => item !== tag),
        },
    }
}
