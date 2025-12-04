// HarvestHub/Services/Implementations/UserService.cs
using HarvestHub.Models;
using HarvestHub.DTOs;
using HarvestHub.Repositories.Interfaces;
using HarvestHub.Services.Interfaces;
using HarvestHub.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace HarvestHub.Services.Implementations
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<UserService> _logger;

        public UserService(
            IUserRepository userRepository,
            ApplicationDbContext context,
            ILogger<UserService> logger)
        {
            _userRepository = userRepository;
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
        {
            var users = await _userRepository.GetAllAsync();
            var result = new List<UserDto>();

            foreach (var user in users)
            {
                var userDto = await MapToUserDtoAsync(user);
                result.Add(userDto);
            }

            return result;
        }

        public async Task<UserDto> GetUserByIdAsync(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
                throw new NotFoundException($"User with ID {id} not found");

            return await MapToUserDtoAsync(user);
        }

        public async Task<IEnumerable<UserDto>> GetUsersByRoleAsync(string role)
        {
            var validRoles = new[] { "Customer", "Farmer", "Admin" };
            if (!validRoles.Contains(role))
                throw new BusinessException($"Invalid role. Must be one of: {string.Join(", ", validRoles)}");

            var users = await _userRepository.GetByRoleAsync(role);
            var result = new List<UserDto>();

            foreach (var user in users)
            {
                var userDto = await MapToUserDtoAsync(user);
                result.Add(userDto);
            }

            return result;
        }

        public async Task<UserDto> UpdateUserRoleAsync(int id, UpdateUserRoleDto roleDto)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
                throw new NotFoundException($"User with ID {id} not found");

            // Валидация роли
            var validRoles = new[] { "Customer", "Farmer", "Admin" };
            if (!validRoles.Contains(roleDto.Role))
                throw new BusinessException($"Invalid role. Must be one of: {string.Join(", ", validRoles)}");

            user.Role = roleDto.Role;
            user.UpdatedAt = DateTime.UtcNow;

            var updated = await _userRepository.UpdateAsync(user);
            _logger.LogInformation("User {UserId} role updated to {Role}", id, roleDto.Role);

            return await MapToUserDtoAsync(updated);
        }

        public async Task<UserDto> UpdateUserStatusAsync(int id, UpdateUserStatusDto statusDto)
        {
            // Note: В текущей модели User нет поля IsActive
            // Это заглушка для будущей реализации
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
                throw new NotFoundException($"User with ID {id} not found");

            _logger.LogInformation("User {UserId} status update requested: {IsActive}", id, statusDto.IsActive);

            return await MapToUserDtoAsync(user);
        }

        public async Task<bool> DeleteUserAsync(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
                throw new NotFoundException($"User with ID {id} not found");

            // Проверка на администратора
            if (user.Role == "Admin")
                throw new BusinessException("Cannot delete admin user");

            // Проверка на наличие активных заказов
            if (await _userRepository.HasActiveOrdersAsync(id))
                throw new BusinessException("Cannot delete user with active orders");

            var result = await _userRepository.DeleteAsync(id);
            if (result)
                _logger.LogInformation("User deleted: {UserId}", id);

            return result;
        }

        public async Task<UserStatsDto> GetUserStatsAsync()
        {
            var totalUsers = await _userRepository.GetCountAsync();
            var farmersCount = await _userRepository.GetCountByRoleAsync("Farmer");
            var customersCount = await _userRepository.GetCountByRoleAsync("Customer");
            var adminsCount = await _userRepository.GetCountByRoleAsync("Admin");

            // Note: Пока нет поля IsActive, считаем всех активными
            var activeUsers = totalUsers;

            var weekAgo = DateTime.UtcNow.AddDays(-7);
            var newUsersLastWeek = await _userRepository.GetCountSinceAsync(weekAgo);

            return new UserStatsDto
            {
                TotalUsers = totalUsers,
                ActiveUsers = activeUsers,
                FarmersCount = farmersCount,
                CustomersCount = customersCount,
                AdminsCount = adminsCount,
                NewUsersLastWeek = newUsersLastWeek
            };
        }

        public async Task<IEnumerable<UserDto>> SearchUsersAsync(string searchTerm)
        {
            var users = await _userRepository.SearchAsync(searchTerm);
            var result = new List<UserDto>();

            foreach (var user in users)
            {
                var userDto = await MapToUserDtoAsync(user);
                result.Add(userDto);
            }

            return result;
        }

        private async Task<UserDto> MapToUserDtoAsync(User user)
        {
            // Получаем дополнительные данные напрямую из контекста
            var orderCount = await _context.Orders
                .CountAsync(o => o.CustomerId == user.UserId);

            var productCount = await _context.Products
                .CountAsync(p => p.FarmerId == user.UserId);

            return new UserDto
            {
                UserId = user.UserId,
                Email = user.Email,
                Role = user.Role,
                FirstName = user.Profile?.FirstName,
                LastName = user.Profile?.LastName,
                Phone = user.Profile?.Phone,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                // Note: IsActive пока всегда true
                IsActive = true,
                ProductCount = productCount,
                OrderCount = orderCount
            };
        }
    }
}