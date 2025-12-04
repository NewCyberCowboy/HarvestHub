using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HarvestHub.Models
{
    public class ProductBatch
    {
        [Key]
        public int BatchId { get; set; }

        [Required]
        public string BatchNumber { get; set; } = string.Empty;

        [Required]
        public DateTime HarvestDate { get; set; }

        [Required]
        public DateTime ExpiryDate { get; set; }

        [Required]
        public int InitialQuantity { get; set; }

        [Required]
        public int CurrentQuantity { get; set; }

        [Required]
        [MaxLength(50)]
        public string QualityGrade { get; set; } = "Standard"; // Premium, Standard, Economy

        [MaxLength(200)]
        public string StorageLocation { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal? PurchasePrice { get; set; }

        [MaxLength(500)]
        public string? SupplierInfo { get; set; }

        [Required]
        public int ProductId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public Product Product { get; set; } = null!;
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}