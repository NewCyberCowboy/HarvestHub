using System.ComponentModel.DataAnnotations;

namespace HarvestHub.DTOs
{
    public class CreateOrderDto
    {
        public string DeliveryAddress { get; set; } = string.Empty;
        public string? CustomerNotes { get; set; }
        public List<OrderItemDto> Items { get; set; } = new();
    }

    public class OrderItemDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; } // Для обратной совместимости
        public decimal? ExpectedWeight { get; set; } // Ожидаемый вес в кг (от клиента)
        public decimal? ActualWeight { get; set; } // Реальный вес в кг (от фермера)
        public decimal? Price { get; set; } // Цена за кг
    }

    public class OrderDto
    {
        public int OrderId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; } // Итоговая сумма
        public decimal ProductsAmount { get; set; } // Сумма товаров
        public decimal DeliveryAmount { get; set; } // Сумма доставки
        public string Status { get; set; } = string.Empty;
        public string DeliveryAddress { get; set; } = string.Empty;
        public string? CustomerCity { get; set; } // Город клиента
        public string? FarmerCity { get; set; } // Город фермера
        public string? CustomerNotes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<OrderItemDto> Items { get; set; } = new();
        public List<OrderStatusHistoryDto> StatusHistory { get; set; } = new();
    }

    public class OrderStatusHistoryDto
    {
        public string Status { get; set; } = string.Empty;
        public DateTime ChangedAt { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateOrderStatusDto
    {
        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Notes { get; set; }
    }

    // DTO для указания реального веса фермером
    public class UpdateOrderWeightsDto
    {
        [Required]
        public List<OrderItemWeightDto> Items { get; set; } = new();
    }

    public class OrderItemWeightDto
    {
        [Required]
        public int OrderItemId { get; set; }

        [Required]
        [Range(0.001, 1000)]
        public decimal ActualWeight { get; set; } // Реальный вес в кг
    }
}