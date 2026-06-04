namespace HarvestHub.Models
{
    public class ProductDraft
    {
        public int DraftId { get; set; }
        public int OwnerUserId { get; set; }
        public string DeviceId { get; set; } = string.Empty;
        public string LocalDraftId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal BasePrice { get; set; }
        public decimal? DiscountPrice { get; set; }
        public int CurrentStock { get; set; }
        public string Unit { get; set; } = "кг";
        public int? CategoryId { get; set; }
        public string? StorageConditions { get; set; }
        public string? ShelfLife { get; set; }
        public string? ImageBase64 { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsImageUploaded { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsSynced { get; set; }
        
        // Навигационные свойства
        public User? Owner { get; set; }
        public Category? Category { get; set; }
    }
}
