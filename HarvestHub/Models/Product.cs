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
        public decimal BasePrice { get; set; } // Цена за кг

        [Required]
        public int CurrentStock { get; set; } // Количество в наличии (в кг)

        [MaxLength(20)]
        public string Unit { get; set; } = "кг"; // Единица измерения (по умолчанию кг)

        // Варианты веса для выбора (JSON строка с массивом: [0.5, 1, 1.5, 2, ... 20])
        public string? WeightOptions { get; set; } // JSON: ["0.5", "1", "1.5", "2", ... "20"]

        public bool AllowCustomWeight { get; set; } = true; // Разрешить произвольный вес через галочку

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

        // Изображение продукта (URL или путь к файлу)
        [MaxLength(1000000)]
        public string? ImageUrl { get; set; }

        // Navigation properties
        public User Farmer { get; set; } = null!;
        public Category? Category { get; set; }
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        public ICollection<ProductBatch> ProductBatches { get; set; } = new List<ProductBatch>(); // Добавим
        public ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();
    }
}