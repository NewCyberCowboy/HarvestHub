// src/components/ui/ConfirmDialog.tsx
import { ReactNode } from 'react'
import AnchoredModalShell from '@/components/ui/AnchoredModalShell'

interface ConfirmDialogProps {
    title: string
    message: string | ReactNode
    confirmText: string
    cancelText: string
    onConfirm: () => void
    onCancel: () => void
    variant?: 'danger' | 'warning' | 'info'
}

export default function ConfirmDialog({
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    variant = 'danger'
}: ConfirmDialogProps) {
    const variantClasses = {
        danger: 'bg-red-600 hover:bg-red-700',
        warning: 'bg-yellow-600 hover:bg-yellow-700',
        info: 'bg-blue-600 hover:bg-blue-700'
    }

    return (
        <AnchoredModalShell backdropClassName="bg-black bg-opacity-50">
            <div className="bg-white rounded-xl w-full max-w-md">
                <div className="p-6">
                    <h3 className="text-lg font-semibold mb-2">{title}</h3>
                    <div className="text-gray-600 mb-6">{message}</div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`px-4 py-2 text-white rounded-lg ${variantClasses[variant]}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </AnchoredModalShell>
    )
}
