import { ReactNode, useEffect } from 'react'

interface SidePanelShellProps {
    children: ReactNode
    onClose: () => void
    widthClassName?: string
    panelClassName?: string
    backdropClassName?: string
}

export default function SidePanelShell({
    children,
    onClose,
    widthClassName = 'max-w-3xl',
    panelClassName = '',
    backdropClassName = 'bg-black/30 backdrop-blur-[2px]',
}: SidePanelShellProps) {
    useEffect(() => {
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose()
            }
        }

        window.addEventListener('keydown', handleEscape)

        return () => {
            document.body.style.overflow = previousOverflow
            window.removeEventListener('keydown', handleEscape)
        }
    }, [onClose])

    return (
        <div className="fixed inset-0 z-50">
            <div
                aria-hidden="true"
                className={`absolute inset-0 ${backdropClassName}`}
                onClick={onClose}
            />

            <div className="absolute inset-0 flex justify-end pointer-events-none">
                <div
                    className={`pointer-events-auto ml-auto h-full w-full overflow-y-scroll overscroll-contain ${widthClassName} ${panelClassName}`}
                    style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
                >
                    {children}
                </div>
            </div>
        </div>
    )
}
