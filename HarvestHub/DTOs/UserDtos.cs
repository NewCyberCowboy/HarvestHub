// HarvestHub/DTOs/UserDtos.cs
using System.ComponentModel.DataAnnotations;

namespace HarvestHub.DTOs
{
    public class UserDto
    {
        public int UserId { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Phone { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsActive { get; set; }
        public int ProductCount { get; set; } // Для фермеров
        public int OrderCount { get; set; } // Для покупателей
    }

    public class UpdateUserRoleDto
    {
        [Required]
        public string Role { get; set; } // Customer, Farmer, Admin
    }

    public class UpdateUserStatusDto
    {
        public bool IsActive { get; set; }
    }

    public class UserStatsDto
    {
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int FarmersCount { get; set; }
        public int CustomersCount { get; set; }
        public int AdminsCount { get; set; }
        public int NewUsersLastWeek { get; set; }
    }
}