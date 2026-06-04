using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HarvestHub.Models
{
    public class FarmerApplication
    {
        [Key]
        public int ApplicationId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(500)]
        public string Message { get; set; } = string.Empty; // Сообщение от пользователя

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected

        public string? AdminNotes { get; set; } // Комментарии админа при одобрении/отклонении

        public int? ReviewedBy { get; set; } // ID админа, который рассмотрел заявку

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ReviewedAt { get; set; }

        // Навигационные свойства
        [ForeignKey("UserId")]
        public User User { get; set; } = null!;

        [ForeignKey("ReviewedBy")]
        public User? Reviewer { get; set; }
    }
}










