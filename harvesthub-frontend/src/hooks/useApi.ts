import { useState, useCallback } from 'react'

// Используем generic с spread оператором для параметров
export const useApi = <T, P extends unknown[]>(
    apiFunction: (...args: P) => Promise<T>
) => {
    const [data, setData] = useState<T | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const execute = useCallback(async (...args: P): Promise<T> => {
        try {
            setIsLoading(true)
            setError(null)

            const result = await apiFunction(...args)
            setData(result)
            setIsLoading(false)

            return result
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Произошла ошибка'
            setError(errorMessage)
            setIsLoading(false)
            throw error
        }
    }, [apiFunction])

    const clear = useCallback(() => {
        setData(null)
        setError(null)
    }, [])

    return {
        data,
        isLoading,
        error,
        execute,
        clear,
        setError
    }
}