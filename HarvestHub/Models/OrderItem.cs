using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HarvestHub.Models
{
    public class OrderItem
    {
        [Key]
        public int OrderItemId { get; set; }

        [Required]
        public int OrderId { get; set; }

        [Required]
        public int ProductId { get; set; }

        public int? BatchId { get; set; }

        [Required]
        public int Quantity { get; set; } // Количество единиц (для обратной совместимости)

        [Column(TypeName = "decimal(18,3)")]
        public decimal? ExpectedWeight { get; set; } // Ожидаемый вес в кг (от клиента)

        [Column(TypeName = "decimal(18,3)")]
        public decimal? ActualWeight { get; set; } // Реальный вес в кг (от фермера)

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; } // Цена за кг

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalPrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal LineTotal { get; set; } // Сделаем свойством, а не вычисляемым

        // Navigation properties
        public Order Order { get; set; } = null!;
        public Product Product { get; set; } = null!;
        public ProductBatch? Batch { get; set; }
    }
}