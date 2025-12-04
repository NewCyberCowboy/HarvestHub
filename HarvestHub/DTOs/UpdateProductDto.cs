using System.ComponentModel.DataAnnotations;

namespace HarvestHub.DTOs
{
    public class UpdateProductDto
    {
        [StringLength(200)]
        public string Name { get; set; }

        [StringLength(1000)]
        public string Description { get; set; }

        [Range(0.01, 100000)]
        public decimal? BasePrice { get; set; }

        [Range(0, int.MaxValue)]
        public int? CurrentStock { get; set; }

        public string Status { get; set; }
        public DateTime? HarvestDate { get; set; }
        public DateTime? ExpiryDate { get; set; }

        [StringLength(500)]
        public string StorageConditions { get; set; }

        public int? CategoryId { get; set; }
    }
}