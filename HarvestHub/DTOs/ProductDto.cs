public class ProductDto
{
    public int ProductId { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public decimal BasePrice { get; set; }
    public int CurrentStock { get; set; }
    public string Status { get; set; }
    public DateTime? HarvestDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string StorageConditions { get; set; }
    public DateTime CreatedAt { get; set; } // Добавьте это свойство

    // Навигационные свойства
    public int CategoryId { get; set; }
    public string CategoryName { get; set; }
    public string FarmerName { get; set; }
}

public class CreateProductDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal BasePrice { get; set; }
    public int CurrentStock { get; set; }
    public int? CategoryId { get; set; }
    public DateTime? HarvestDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? StorageConditions { get; set; }
}

public class UpdateProductDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public decimal? BasePrice { get; set; }
    public int? CurrentStock { get; set; }
    public int? CategoryId { get; set; }
    public string? Status { get; set; }
    public DateTime? HarvestDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? StorageConditions { get; set; }
}