import api from './axios'
import {
    UserDto,
    UpdateUserRoleDto,
    UpdateUserStatusDto,
    UserStatsDto,
    ApiResponse
} from '@/types/backend'

export const usersApi = {
    // Получение всех пользователей
    getAllUsers: async (): Promise<UserDto[]> => {
        const response = await api.get<ApiResponse<UserDto[]>>('/Users')
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch users')
        }
        return response.data.data
    },

    // Получение пользователя по ID
    getUserById: async (id: number): Promise<UserDto> => {
        const response = await api.get<ApiResponse<UserDto>>(`/Users/${id}`)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch user')
        }
        return response.data.data
    },

    // Обновление роли пользователя
    updateUserRole: async (id: number, roleData: UpdateUserRoleDto): Promise<UserDto> => {
        const response = await api.put<ApiResponse<UserDto>>(`/Users/${id}/role`, roleData)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to update user role')
        }
        return response.data.data
    },

    // Обновление статуса пользователя
    updateUserStatus: async (id: number, statusData: UpdateUserStatusDto): Promise<UserDto> => {
        const response = await api.put<ApiResponse<UserDto>>(`/Users/${id}/status`, statusData)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to update user status')
        }
        return response.data.data
    },

    // Удаление пользователя
    deleteUser: async (id: number): Promise<boolean> => {
        const response = await api.delete<ApiResponse<boolean>>(`/Users/${id}`)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to delete user')
        }
        return response.data.data
    },

    // Получение пользователей по роли
    getUsersByRole: async (role: string): Promise<UserDto[]> => {
        const response = await api.get<ApiResponse<UserDto[]>>(`/Users/role/${role}`)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch users by role')
        }
        return response.data.data
    },

    // Статистика пользователей
    getUserStats: async (): Promise<UserStatsDto> => {
        const response = await api.get<ApiResponse<UserStatsDto>>('/Users/stats')
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch user stats')
        }
        return response.data.data
    },

    // Поиск пользователей
    searchUsers: async (term: string): Promise<UserDto[]> => {
        const response = await api.get<ApiResponse<UserDto[]>>('/Users/search', {
            params: { term }
        })
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to search users')
        }
        return response.data.data
    }
}