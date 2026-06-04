
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

export function Card({ className, children, ...props }: CardProps) {
    return (
        <div
            className={`bg-white rounded-lg border shadow-sm p-6 ${className || ''}`}
            {...props}
        >
            {children}
        </div>
    )
}