using System.ComponentModel.DataAnnotations;

namespace HarvestHub.DTOs
{
    public class FarmerApplicationDto
    {
        public int ApplicationId { get; set; }
        public int UserId { get; set; }
        public string UserEmail { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? AdminNotes { get; set; }
        public int? ReviewedBy { get; set; }
        public string? ReviewerName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
    }

    public class CreateFarmerApplicationDto
    {
        [Required]
        [StringLength(500, MinimumLength = 10)]
        public string Message { get; set; } = string.Empty;
    }

    public class ReviewFarmerApplicationDto
    {
        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = string.Empty; // Approved, Rejected

        [StringLength(500)]
        public string? AdminNotes { get; set; }
    }
}

