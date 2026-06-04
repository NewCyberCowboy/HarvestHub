using System.ComponentModel.DataAnnotations;

namespace HarvestHub.Models
{
    public class User
    {
        [Key]
        public int UserId { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        public string Role { get; set; } = "Customer"; // Customer, Farmer, Admin

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Навигационные свойства
        public Profile Profile { get; set; } = null!;
        public ICollection<Order> Orders { get; set; } = new List<Order>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        public ICollection<Product> Products { get; set; } = new List<Product>(); // Для фермеров
        public ICollection<Address> Addresses { get; set; } = new List<Address>();
        public ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();
        public ICollection<FarmerApplication> FarmerApplications { get; set; } = new List<FarmerApplication>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    }
}