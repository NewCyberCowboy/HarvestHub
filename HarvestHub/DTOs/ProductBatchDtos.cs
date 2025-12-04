namespace HarvestHub.DTOs
{
    public class CreateProductBatchDto
    {
        public int ProductId { get; set; }
        public string BatchNumber { get; set; } = string.Empty;
        public DateTime HarvestDate { get; set; }
        public DateTime ExpiryDate { get; set; }
        public int InitialQuantity { get; set; }
        public int CurrentQuantity { get; set; }
        public string QualityGrade { get; set; } = "Standard"; // Premium, Standard, Economy
        public string StorageLocation { get; set; } = string.Empty;
        public decimal? PurchasePrice { get; set; }
        public string? SupplierInfo { get; set; }
    }

    public class UpdateProductBatchDto
    {
        public string? BatchNumber { get; set; }
        public DateTime? HarvestDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public int? CurrentQuantity { get; set; }
        public string? QualityGrade { get; set; }
        public string? StorageLocation { get; set; }
        public decimal? PurchasePrice { get; set; }
        public string? SupplierInfo { get; set; }
    }

    public class ProductBatchDto
    {
        public int BatchId { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string BatchNumber { get; set; } = string.Empty;
        public DateTime HarvestDate { get; set; }
        public DateTime ExpiryDate { get; set; }
        public int InitialQuantity { get; set; }
        public int CurrentQuantity { get; set; }
        public string QualityGrade { get; set; } = string.Empty;
        public string StorageLocation { get; set; } = string.Empty;
        public decimal? PurchasePrice { get; set; }
        public string? SupplierInfo { get; set; }
        public bool IsExpired { get; set; }
        public bool IsLowStock { get; set; }
        public int DaysUntilExpiry { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class BatchAllocationDto
    {
        public int BatchId { get; set; }
        public int Quantity { get; set; }
    }

    public class BatchExpiryReportDto
    {
        public int TotalBatches { get; set; }
        public int ExpiredBatches { get; set; }
        public int ExpiringSoonBatches { get; set; }
        public List<ProductBatchDto> ExpiringBatches { get; set; } = new();
        public decimal TotalPotentialLoss { get; set; }
    }
}