import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost'
    size?: 'sm' | 'default' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    {
                        'bg-green-600 text-white hover:bg-green-700': variant === 'default',
                        'border border-gray-300 bg-transparent hover:bg-gray-50': variant === 'outline',
                        'hover:bg-gray-100': variant === 'ghost',
                        'px-3 py-1.5 text-sm': size === 'sm',
                        'px-4 py-2': size === 'default',
                        'px-6 py-3 text-lg': size === 'lg',
                    },
                    className
                )}
                {...props}
            />
        )
    }
)

Button.displayName = 'Button'

export { Button }

// Создаем отдельный компонент для кнопки-ссылки
interface ButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    variant?: 'default' | 'outline' | 'ghost'
    size?: 'sm' | 'default' | 'lg'
}

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
    ({ className, variant = 'default', size = 'default', ...props }, ref) => {
        return (
            <a
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                    {
                        'bg-green-600 text-white hover:bg-green-700': variant === 'default',
                        'border border-gray-300 bg-transparent hover:bg-gray-50': variant === 'outline',
                        'hover:bg-gray-100': variant === 'ghost',
                        'px-3 py-1.5 text-sm': size === 'sm',
                        'px-4 py-2': size === 'default',
                        'px-6 py-3 text-lg': size === 'lg',
                    },
                    className
                )}
                {...props}
            />
        )
    }
)

ButtonLink.displayName = 'ButtonLink'