// HarvestHub/Services/Interfaces/IUserService.cs
using HarvestHub.DTOs;

namespace HarvestHub.Services.Interfaces
{
    public interface IUserService
    {
        // Получение пользователей
        Task<IEnumerable<UserDto>> GetAllUsersAsync();
        Task<UserDto> GetUserByIdAsync(int id);
        Task<IEnumerable<UserDto>> GetUsersByRoleAsync(string role);

        // Обновление пользователей
        Task<UserDto> UpdateUserRoleAsync(int id, UpdateUserRoleDto roleDto);
        Task<UserDto> UpdateUserStatusAsync(int id, UpdateUserStatusDto statusDto);

        // Удаление
        Task<bool> DeleteUserAsync(int id);

        // Статистика
        Task<UserStatsDto> GetUserStatsAsync();

        // Поиск
        Task<IEnumerable<UserDto>> SearchUsersAsync(string searchTerm);
    }
}