using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HarvestHub.Models
{
    public class Product
    {
        [Key]
        public int ProductId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal BasePrice { get; set; }

        [Required]
        public int CurrentStock { get; set; }

        [Required]
        public int FarmerId { get; set; }

        public int? CategoryId { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Available";

        public DateTime? HarvestDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public string? StorageConditions { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public User Farmer { get; set; } = null!;
        public Category? Category { get; set; }
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        public ICollection<ProductBatch> ProductBatches { get; set; } = new List<ProductBatch>(); // Добавим
    }
}