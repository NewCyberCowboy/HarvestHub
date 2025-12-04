// HarvestHub/Repositories/Interfaces/IUserRepository.cs
using HarvestHub.Models;
using System.Linq.Expressions;

namespace HarvestHub.Repositories.Interfaces
{
    public interface IUserRepository : IRepository<User>
    {
        // Существующие методы
        Task<User> GetByEmailAsync(string email);
        Task<Profile> GetProfileAsync(int userId);
        Task<Profile> AddProfileAsync(Profile profile);
        Task<bool> EmailExistsAsync(string email);

        // Новые методы для админ-панели
        Task<IEnumerable<User>> GetByRoleAsync(string role);
        Task<int> GetCountByRoleAsync(string role);
        Task<int> GetCountAsync();
        Task<bool> HasActiveOrdersAsync(int userId);
        Task<IEnumerable<User>> SearchAsync(string searchTerm);
        Task<int> GetCountSinceAsync(DateTime since);
    }
}