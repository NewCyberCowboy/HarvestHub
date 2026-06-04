using HarvestHub.DTOs;

namespace HarvestHub.DTOs
{
    public class FarmerDto
    {
        public int FarmerId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? Address { get; set; } // Адрес из Profile
        public int ProductCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? Specialty { get; set; } // Специализация (можно вычислить из категорий продуктов)
        public string? Description { get; set; } // Описание фермера (можно добавить в Profile)
    }

    public class FarmerDetailDto
    {
        public int FarmerId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? Specialty { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<ProductDto> Products { get; set; } = new();
        public List<ReviewDto> Reviews { get; set; } = new();
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public string? ProfileImageUrl { get; set; }
        public List<string>? GalleryImages { get; set; } // Галерея изображений (до 15)
        public string? WelcomeText { get; set; } // Приветственный текст
    }

    public class UpdateFarmerInfoDto
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? Specialty { get; set; }
        public string? Description { get; set; }
        public string? ProfileImageUrl { get; set; }
        public List<string>? GalleryImages { get; set; } // Галерея изображений (до 15)
        public string? WelcomeText { get; set; } // Приветственный текст
    }
}

