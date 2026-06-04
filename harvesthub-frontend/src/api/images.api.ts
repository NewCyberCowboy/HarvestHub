import api from './axios'
import { ApiResponse } from '@/types/backend'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5272/api'

export const imagesApi = {
    upload: async (file: File): Promise<string> => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await api.post<ApiResponse<string>>('/Images/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to upload image')
        }

        return response.data.data
    },

    getImageUrl: (relativePath: string): string => {
        // Convert relative path to full URL
        if (!relativePath) return ''
        if (relativePath.startsWith('http')) return relativePath
        const baseUrl = 'http://localhost:5272'
        return `${baseUrl}${relativePath}`
    },

    delete: async (fileName: string): Promise<void> => {
        await api.delete(`/Images/${fileName}`)
    }
}
