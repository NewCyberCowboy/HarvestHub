import api from './axios'
import { ApiResponse } from '@/types/backend'

export interface FarmerDto {
    farmerId: number
    email: string
    firstName: string
    lastName: string
    phone: string
    address?: string
    productCount: number
    createdAt: string
    specialty?: string
    description?: string
}

export interface FarmerDetailDto {
    farmerId: number
    email: string
    firstName: string
    lastName: string
    phone?: string
    address?: string
    specialty?: string
    description?: string
    createdAt: string
    products: any[]
    reviews: any[]
    averageRating: number
    totalReviews: number
    profileImageUrl?: string
    galleryImages?: string[] // Галерея изображений (до 15)
    welcomeText?: string // Приветственный текст, который может редактировать фермер
}

export interface UpdateFarmerInfoDto {
    firstName?: string
    lastName?: string
    phone?: string
    address?: string
    specialty?: string
    description?: string
    profileImageUrl?: string
    galleryImages?: string[] // Галерея изображений (до 15)
    welcomeText?: string // Приветственный текст
}

export const farmersApi = {
    getAllFarmers: async (): Promise<FarmerDto[]> => {
        const response = await api.get<ApiResponse<FarmerDto[]>>('/Farmers')
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch farmers')
        }
        return response.data.data
    },

    getFarmerDetail: async (id: number): Promise<FarmerDetailDto> => {
        const response = await api.get<ApiResponse<FarmerDetailDto>>(`/Farmers/${id}`)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch farmer detail')
        }
        return response.data.data
    },

    updateFarmerInfo: async (id: number, data: UpdateFarmerInfoDto): Promise<FarmerDetailDto> => {
        const response = await api.put<ApiResponse<FarmerDetailDto>>(`/Farmers/${id}`, data)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to update farmer info')
        }
        return response.data.data
    }
}

