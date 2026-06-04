import { ReactNode, useState } from 'react'

interface AnchoredModalShellProps {
    children: ReactNode
    backdropClassName?: string
}

declare global {
    interface Window {
        __harvesthubLastPointerY?: number
        __harvesthubLastAnchorRect?: {
            top: number
            bottom: number
            height: number
        }
        __harvesthubAnchorTrackerInstalled?: boolean
    }
}

function getAnchorElement(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
        return null
    }

    return (
        target.closest(
            '[data-modal-anchor],button,a,[role="button"],[role="menuitem"],input,select,textarea,label'
        ) || target
    )
}

function ensureAnchorTracker() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return
    }

    if (window.__harvesthubAnchorTrackerInstalled) {
        return
    }

    const updatePointerY = (event: MouseEvent | PointerEvent | TouchEvent) => {
        if ('touches' in event) {
            const touch = event.touches[0] || event.changedTouches[0]
            if (touch) {
                window.__harvesthubLastPointerY = touch.clientY
            }
            const anchorElement = getAnchorElement(event.target)
            if (anchorElement) {
                const rect = anchorElement.getBoundingClientRect()
                window.__harvesthubLastAnchorRect = {
                    top: rect.top,
                    bottom: rect.bottom,
                    height: rect.height,
                }
            }
            return
        }

        window.__harvesthubLastPointerY = event.clientY
        const anchorElement = getAnchorElement(event.target)
        if (anchorElement) {
            const rect = anchorElement.getBoundingClientRect()
            window.__harvesthubLastAnchorRect = {
                top: rect.top,
                bottom: rect.bottom,
                height: rect.height,
            }
        }
    }

    document.addEventListener('pointerdown', updatePointerY, true)
    document.addEventListener('mousedown', updatePointerY, true)
    document.addEventListener('touchstart', updatePointerY, true)
    window.__harvesthubAnchorTrackerInstalled = true
}

function getAnchorOffset() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return 24
    }

    ensureAnchorTracker()

    const viewportHeight = window.innerHeight
    const anchorRect = window.__harvesthubLastAnchorRect
    if (anchorRect) {
        const preferredTop = anchorRect.height > 96 ? anchorRect.top + 12 : anchorRect.top - 16
        return Math.min(Math.max(preferredTop, 24), Math.max(viewportHeight - 180, 24))
    }

    const pointerY = window.__harvesthubLastPointerY
    if (typeof pointerY === 'number' && Number.isFinite(pointerY)) {
        return Math.min(Math.max(pointerY - 32, 24), Math.max(viewportHeight - 180, 24))
    }

    const activeElement = document.activeElement
    if (!(activeElement instanceof HTMLElement)) {
        return 24
    }

    const rect = activeElement.getBoundingClientRect()

    if (rect.height === 0 && rect.width === 0) {
        return 24
    }

    return Math.min(Math.max(rect.top - 24, 24), Math.max(viewportHeight - 180, 24))
}

export default function AnchoredModalShell({
    children,
    backdropClassName = 'bg-black/50 backdrop-blur-sm',
}: AnchoredModalShellProps) {
    const [topOffset] = useState(() => getAnchorOffset())

    return (
        <div className={`fixed inset-0 z-50 overflow-y-auto p-4 ${backdropClassName}`}>
            <div className="flex min-h-full justify-center" style={{ paddingTop: topOffset, paddingBottom: 24 }}>
                {children}
            </div>
        </div>
    )
}
