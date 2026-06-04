namespace HarvestHub.DTOs
{
    public class FavoriteDto
    {
        public int FavoriteId { get; set; }
        public int UserId { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public decimal ProductPrice { get; set; }
        public string? ProductImageUrl { get; set; }
        public string? ProductDescription { get; set; }
        public string ProductStatus { get; set; } = string.Empty;
        public int ProductStock { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class AddFavoriteDto
    {
        public int ProductId { get; set; }
    }
}










