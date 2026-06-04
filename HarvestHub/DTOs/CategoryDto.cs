using System.ComponentModel.DataAnnotations;

namespace HarvestHub.DTOs
{
    public class CategoryDto
    {
        public int CategoryId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public int? ParentId { get; set; }
        public string ParentName { get; set; }
        public IEnumerable<CategoryDto> Children { get; set; } = new List<CategoryDto>();
    }

    public class CreateCategoryDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [StringLength(500)]
        public string Description { get; set; }

        public int? ParentId { get; set; }
    }

    public class UpdateCategoryDto
    {
        [StringLength(100)]
        public string? Name { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        public int? ParentId { get; set; }
    }

    public class CategoryWithStatsDto
    {
        public int CategoryId { get; set; }
        public string Name { get; set; }
        public int ProductCount { get; set; }
        public int TotalSales { get; set; }
        public decimal TotalRevenue { get; set; }
        public int Level { get; set; }
    }
}