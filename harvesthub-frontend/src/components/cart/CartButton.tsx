import { ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCartStore } from '@/store/cart.store'

export function CartButton() {
  const { totalItems } = useCartStore()

  return (
    <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
      <ShoppingCart className="h-6 w-6 text-gray-700" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Link>
  )
}