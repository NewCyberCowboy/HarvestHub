using System.ComponentModel.DataAnnotations;

namespace HarvestHub.Models
{
    public class OrderStatusHistory
    {
        [Key]
        public int OrderStatusHistoryId { get; set; } // Это правильное имя

        [Required]
        public int OrderId { get; set; }
        public int? ChangedBy { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = string.Empty;

        [Required]
        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

        public string? Notes { get; set; }

        // Navigation property
        public Order Order { get; set; } = null!;
        public User? User { get; set; }
    }
}