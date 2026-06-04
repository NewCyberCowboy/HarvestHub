// src/hooks/useRequireAdmin.ts
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { UserRole } from '@/types/backend'

export function useRequireAdmin() {
    const navigate = useNavigate()
    const { user, isAuthenticated, isLoading } = useAuthStore()

    useEffect(() => {
        if (isLoading) return

        if (!isAuthenticated) {
            navigate('/login')
            return
        }

        if (user?.role !== UserRole.Admin) {
            navigate('/dashboard')
        }
    }, [user, isAuthenticated, isLoading, navigate])
}