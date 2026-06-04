using System.Collections.Generic;

namespace HarvestHub.DTOs
{
    public class ProductDto
    {
        public int ProductId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public decimal BasePrice { get; set; }
        public int CurrentStock { get; set; } // Количество в наличии (в кг)
        public string Unit { get; set; } = "кг"; // Единица измерения
        public List<decimal>? WeightOptions { get; set; } // Варианты веса для выбора
        public bool AllowCustomWeight { get; set; } = true; // Разрешить произвольный вес
        public string Status { get; set; }
        public DateTime? HarvestDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public string StorageConditions { get; set; }
        public DateTime CreatedAt { get; set; }

        // Навигационные свойства
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }
        public int FarmerId { get; set; }
        public string FarmerName { get; set; }
        public string? FarmerAddress { get; set; }
        public string? ImageUrl { get; set; }
    }
}