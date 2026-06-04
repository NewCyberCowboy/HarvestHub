using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HarvestHub.Models
{
    public class Order
    {
        [Key]
        public int OrderId { get; set; }

        [Required]
        [MaxLength(50)]
        public string OrderNumber { get; set; } = string.Empty;

        [Required]
        public int CustomerId { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; } // Итоговая сумма (товары + доставка)

        [Column(TypeName = "decimal(18,2)")]
        public decimal ProductsAmount { get; set; } // Сумма товаров

        [Column(TypeName = "decimal(18,2)")]
        public decimal DeliveryAmount { get; set; } // Сумма доставки

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Pending"; // Pending -> AwaitingWeight -> ReadyToShip -> Shipped -> Delivered

        [MaxLength(100)]
        public string? CustomerCity { get; set; } // Город клиента для расчета доставки

        [MaxLength(100)]
        public string? FarmerCity { get; set; } // Город фермера для расчета доставки

        [MaxLength(20)]
        public string PaymentStatus { get; set; } = "Pending"; // Добавим

        [Required]
        public string DeliveryAddress { get; set; } = string.Empty;

        public string? CustomerNotes { get; set; }

        public DateTime OrderDate { get; set; } = DateTime.UtcNow; // Добавим

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public User Customer { get; set; } = null!;
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>(); // Изменим Items на OrderItems
        public ICollection<OrderStatusHistory> StatusHistory { get; set; } = new List<OrderStatusHistory>();
    }
}