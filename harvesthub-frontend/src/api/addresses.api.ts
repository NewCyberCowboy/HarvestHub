import api from './axios'
import {
    AddressDto,
    CreateAddressDto,
    UpdateAddressDto,
    ApiResponse
} from '@/types/backend'

interface AxiosError extends Error {
    response?: {
        status: number
        data?: unknown
    }
}

export const addressesApi = {
    // Получить все адреса пользователя
    getAddresses: async (): Promise<AddressDto[]> => {
        const response = await api.get<ApiResponse<AddressDto[]>>('/Addresses')
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch addresses')
        }
        return response.data.data
    },

    // Получить адрес по ID
    getAddress: async (id: number): Promise<AddressDto> => {
        const response = await api.get<ApiResponse<AddressDto>>(`/Addresses/${id}`)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch address')
        }
        return response.data.data
    },

    // Получить основной адрес
    getDefaultAddress: async (): Promise<AddressDto | null> => {
        try {
            const response = await api.get<ApiResponse<AddressDto>>('/Addresses/default')
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to fetch default address')
            }
            return response.data.data
        } catch (err: unknown) {
            // Проверяем статус ошибки 404
            const axiosError = err as AxiosError
            if (axiosError.response?.status === 404) {
                return null
            }
            throw err
        }
    },

    // Создать новый адрес
    createAddress: async (addressData: CreateAddressDto): Promise<AddressDto> => {
        const response = await api.post<ApiResponse<AddressDto>>('/Addresses', addressData)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to create address')
        }
        return response.data.data
    },

    // Обновить адрес
    updateAddress: async (id: number, addressData: UpdateAddressDto): Promise<AddressDto> => {
        const response = await api.put<ApiResponse<AddressDto>>(`/Addresses/${id}`, addressData)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to update address')
        }
        return response.data.data
    },

    // Установить адрес как основной
    setDefaultAddress: async (id: number): Promise<void> => {
        const response = await api.patch<ApiResponse<void>>(`/Addresses/${id}/set-default`)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to set default address')
        }
    },

    // Удалить адрес
    deleteAddress: async (id: number): Promise<void> => {
        const response = await api.delete<ApiResponse<void>>(`/Addresses/${id}`)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to delete address')
        }
    }
}