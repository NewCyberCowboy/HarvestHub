import api from './axios'
import { ApiResponse } from '@/types/backend'

export interface FarmerApplicationDto {
    applicationId: number
    userId: number
    userEmail: string
    userName: string
    message: string
    status: string
    adminNotes?: string
    reviewedBy?: number
    reviewerName?: string
    createdAt: string
    reviewedAt?: string
}

export interface CreateFarmerApplicationDto {
    message: string
}

export interface ReviewFarmerApplicationDto {
    status: string // 'Approved' | 'Rejected'
    adminNotes?: string
}

export const farmerApplicationsApi = {
    createApplication: async (data: CreateFarmerApplicationDto): Promise<FarmerApplicationDto> => {
        const response = await api.post<ApiResponse<FarmerApplicationDto>>('/FarmerApplications', data)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to create application')
        }
        return response.data.data
    },

    getMyApplication: async (): Promise<FarmerApplicationDto | null> => {
        try {
            const response = await api.get<ApiResponse<FarmerApplicationDto>>('/FarmerApplications/my')
            if (!response.data.success) {
                return null
            }
            return response.data.data
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null
            }
            throw error
        }
    },

    checkPendingApplication: async (): Promise<boolean> => {
        const response = await api.get<ApiResponse<boolean>>('/FarmerApplications/check')
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to check application')
        }
        return response.data.data
    },

    getAllApplications: async (): Promise<FarmerApplicationDto[]> => {
        const response = await api.get<ApiResponse<FarmerApplicationDto[]>>('/FarmerApplications/all')
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch applications')
        }
        return response.data.data
    },

    getPendingApplications: async (): Promise<FarmerApplicationDto[]> => {
        const response = await api.get<ApiResponse<FarmerApplicationDto[]>>('/FarmerApplications/pending')
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch pending applications')
        }
        return response.data.data
    },

    getApplication: async (id: number): Promise<FarmerApplicationDto> => {
        const response = await api.get<ApiResponse<FarmerApplicationDto>>(`/FarmerApplications/${id}`)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch application')
        }
        return response.data.data
    },

    reviewApplication: async (id: number, data: ReviewFarmerApplicationDto): Promise<FarmerApplicationDto> => {
        const response = await api.put<ApiResponse<FarmerApplicationDto>>(`/FarmerApplications/${id}/review`, data)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to review application')
        }
        return response.data.data
    }
}










