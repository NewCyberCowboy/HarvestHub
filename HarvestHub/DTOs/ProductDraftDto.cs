using System.ComponentModel.DataAnnotations;

namespace HarvestHub.DTOs
{
    public class ProductDraftDto
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
    }

    public class CreateProductDraftDto
    {
        public string? DeviceId { get; set; }
        public string? LocalDraftId { get; set; }
        
        [Required(ErrorMessage = "Название обязательно")]
        [StringLength(200, ErrorMessage = "Название не может быть длиннее 200 символов")]
        public string Name { get; set; } = string.Empty;
        
        [StringLength(2000, ErrorMessage = "Описание не может быть длиннее 2000 символов")]
        public string? Description { get; set; }
        
        [Required(ErrorMessage = "Цена обязательна")]
        [Range(0.01, 999999.99, ErrorMessage = "Цена должна быть от 0.01 до 999999.99")]
        public decimal BasePrice { get; set; }
        
        [Range(0, 999999.99, ErrorMessage = "Цена со скидкой должна быть положительной")]
        public decimal? DiscountPrice { get; set; }
        
        [Required(ErrorMessage = "Количество обязательно")]
        [Range(0, int.MaxValue, ErrorMessage = "Количество должно быть положительным")]
        public int CurrentStock { get; set; }
        
        [Required(ErrorMessage = "Единица измерения обязательна")]
        [StringLength(50, ErrorMessage = "Единица измерения не может быть длиннее 50 символов")]
        public string Unit { get; set; } = "кг";
        
        public int? CategoryId { get; set; }
        
        [StringLength(500, ErrorMessage = "Условия хранения не могут быть длиннее 500 символов")]
        public string? StorageConditions { get; set; }
        
        [StringLength(200, ErrorMessage = "Срок годности не может быть длиннее 200 символов")]
        public string? ShelfLife { get; set; }

        public string? ImageBase64 { get; set; }

        public string? ImageUrl { get; set; }

        public bool AllowCustomWeight { get; set; } = true;
    }

    public class UpdateProductDraftDto
    {
        [StringLength(200, ErrorMessage = "Название не может быть длиннее 200 символов")]
        public string? Name { get; set; }
        
        [StringLength(2000, ErrorMessage = "Описание не может быть длиннее 2000 символов")]
        public string? Description { get; set; }
        
        [Range(0.01, 999999.99, ErrorMessage = "Цена должна быть от 0.01 до 999999.99")]
        public decimal? BasePrice { get; set; }
        
        [Range(0, 999999.99, ErrorMessage = "Цена со скидкой должна быть положительной")]
        public decimal? DiscountPrice { get; set; }
        
        [Range(0, int.MaxValue, ErrorMessage = "Количество должно быть положительным")]
        public int? CurrentStock { get; set; }
        
        [StringLength(50, ErrorMessage = "Единица измерения не может быть длиннее 50 символов")]
        public string? Unit { get; set; }
        
        public int? CategoryId { get; set; }
        
        [StringLength(500, ErrorMessage = "Условия хранения не могут быть длиннее 500 символов")]
        public string? StorageConditions { get; set; }
        
        [StringLength(200, ErrorMessage = "Срок годности не может быть длиннее 200 символов")]
        public string? ShelfLife { get; set; }

        public string? ImageBase64 { get; set; }

        public string? ImageUrl { get; set; }

        public bool? IsImageUploaded { get; set; }
    }

    public class SyncDraftsRequestDto
    {
        public string DeviceId { get; set; } = string.Empty;
        public List<CreateProductDraftDto> Drafts { get; set; } = new();
    }

    public class SyncDraftsResponseDto
    {
        public List<ProductDraftDto> SyncedDrafts { get; set; } = new();
        public List<string> FailedLocalIds { get; set; } = new();
    }
}
