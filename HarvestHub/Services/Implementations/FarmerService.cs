using HarvestHub.DTOs;
using HarvestHub.Models;
using HarvestHub.Repositories.Interfaces;
using HarvestHub.Services.Interfaces;
using HarvestHub.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace HarvestHub.Services.Implementations
{
    public class FarmerService : IFarmerService
    {
        private readonly IUserRepository _userRepository;
        private readonly IProductRepository _productRepository;
        private readonly IReviewService _reviewService;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<FarmerService> _logger;

        public FarmerService(
            IUserRepository userRepository,
            IProductRepository productRepository,
            IReviewService reviewService,
            ApplicationDbContext context,
            ILogger<FarmerService> logger)
        {
            _userRepository = userRepository;
            _productRepository = productRepository;
            _reviewService = reviewService;
            _context = context;
            _logger = logger;
        }

        public async Task<List<FarmerDto>> GetAllFarmersAsync()
        {
            var farmers = await _userRepository.GetByRoleAsync("Farmer");
            var result = new List<FarmerDto>();

            foreach (var farmer in farmers)
            {
                var productCount = await _context.Products
                    .CountAsync(p => p.FarmerId == farmer.UserId);

                // Получаем категории продуктов для определения специализации
                var categories = await _context.Products
                    .Where(p => p.FarmerId == farmer.UserId && p.CategoryId != null)
                    .Include(p => p.Category)
                    .Select(p => p.Category!.Name)
                    .Distinct()
                    .ToListAsync();

                var specialty = categories.Any() ? string.Join(", ", categories) : "Разные продукты";

                result.Add(new FarmerDto
                {
                    FarmerId = farmer.UserId,
                    Email = farmer.Email,
                    FirstName = farmer.Profile?.FirstName ?? "",
                    LastName = farmer.Profile?.LastName ?? "",
                    Phone = farmer.Profile?.Phone ?? "",
                    Address = farmer.Profile?.Address,
                    ProductCount = productCount,
                    CreatedAt = farmer.CreatedAt,
                    Specialty = specialty,
                    Description = farmer.Profile?.PreferredContact // Временно используем это поле для описания
                });
            }

            return result;
        }

        public async Task<FarmerDetailDto> GetFarmerDetailAsync(int farmerId)
        {
            var farmer = await _userRepository.GetByIdAsync(farmerId);
            if (farmer == null || farmer.Role != "Farmer")
                throw new NotFoundException($"Farmer with ID {farmerId} not found");

            // Получаем продукты фермера
            var products = await _context.Products
                .Where(p => p.FarmerId == farmerId)
                .Include(p => p.Category)
                .Include(p => p.Farmer)
                    .ThenInclude(f => f.Profile)
                .ToListAsync();

            var productDtos = products.Select(p => new ProductDto
            {
                ProductId = p.ProductId,
                Name = p.Name,
                Description = p.Description,
                BasePrice = p.BasePrice,
                CurrentStock = p.CurrentStock,
                Status = p.Status,
                HarvestDate = p.HarvestDate,
                ExpiryDate = p.ExpiryDate,
                StorageConditions = p.StorageConditions,
                CreatedAt = p.CreatedAt,
                CategoryId = p.CategoryId ?? 0,
                CategoryName = p.Category?.Name ?? "Без категории",
                FarmerId = p.FarmerId,
                FarmerName = $"{farmer.Profile?.FirstName} {farmer.Profile?.LastName}".Trim(),
                FarmerAddress = farmer.Profile?.Address,
                ImageUrl = p.ImageUrl
            }).ToList();

            // Получаем отзывы о продуктах фермера
            var productIds = products.Select(p => p.ProductId).ToList();
            var allReviews = new List<ReviewDto>();

            foreach (var productId in productIds)
            {
                try
                {
                    var reviews = await _reviewService.GetProductReviewsAsync(productId);
                    allReviews.AddRange(reviews);
                }
                catch
                {
                    // Игнорируем ошибки для продуктов без отзывов
                }
            }

            // Вычисляем средний рейтинг
            var approvedReviews = allReviews.Where(r => r.IsApproved).ToList();
            var averageRating = approvedReviews.Any()
                ? approvedReviews.Average(r => r.Rating)
                : 0.0;

            // Получаем категории для специализации
            var categories = products
                .Where(p => p.Category != null)
                .Select(p => p.Category!.Name)
                .Distinct()
                .ToList();

            var specialty = categories.Any() ? string.Join(", ", categories) : "Разные продукты";

            // Парсим галерею изображений и приветственный текст из JSON (если есть)
            List<string>? galleryImages = null;
            string? welcomeText = null;
            string? profileImageUrl = null;
            string? description = null;

            if (!string.IsNullOrWhiteSpace(farmer.Profile?.PreferredContact))
            {
                try
                {
                    var jsonString = farmer.Profile.PreferredContact.Trim();
                    
                    // Проверяем, является ли это JSON
                    if (jsonString.StartsWith("{") && jsonString.EndsWith("}"))
                    {
                        // Используем JsonDocument для более гибкого парсинга
                        using var doc = System.Text.Json.JsonDocument.Parse(jsonString);
                        var root = doc.RootElement;

                        if (root.TryGetProperty("GalleryImages", out var galleryElement))
                        {
                            if (galleryElement.ValueKind == System.Text.Json.JsonValueKind.Array)
                            {
                                galleryImages = new List<string>();
                                foreach (var item in galleryElement.EnumerateArray())
                                {
                                    if (item.ValueKind == System.Text.Json.JsonValueKind.String)
                                    {
                                        var imageUrl = item.GetString();
                                        if (!string.IsNullOrWhiteSpace(imageUrl))
                                        {
                                            galleryImages.Add(imageUrl);
                                        }
                                    }
                                }
                                _logger.LogInformation("Loaded {Count} gallery images for farmer {FarmerId}", galleryImages.Count, farmerId);
                            }
                        }

                        if (root.TryGetProperty("WelcomeText", out var welcomeElement))
                        {
                            welcomeText = welcomeElement.GetString();
                        }

                        if (root.TryGetProperty("ProfileImageUrl", out var profileElement))
                        {
                            profileImageUrl = profileElement.GetString();
                        }

                        if (root.TryGetProperty("Description", out var descElement))
                        {
                            description = descElement.GetString();
                        }
                    }
                    else
                    {
                        // Если не JSON, используем как обычное описание
                        description = farmer.Profile.PreferredContact;
                    }
                }
                catch (Exception ex)
                {
                    // Если не удалось распарсить, используем как обычное описание
                    _logger.LogWarning(ex, "Failed to parse PreferredContact as JSON for farmer {FarmerId}", farmerId);
                    description = farmer.Profile.PreferredContact;
                }
            }

            return new FarmerDetailDto
            {
                FarmerId = farmer.UserId,
                Email = farmer.Email,
                FirstName = farmer.Profile?.FirstName ?? "",
                LastName = farmer.Profile?.LastName ?? "",
                Phone = farmer.Profile?.Phone ?? "",
                Address = farmer.Profile?.Address,
                Specialty = specialty,
                Description = description,
                CreatedAt = farmer.CreatedAt,
                Products = productDtos,
                Reviews = approvedReviews,
                AverageRating = averageRating,
                TotalReviews = approvedReviews.Count,
                ProfileImageUrl = profileImageUrl,
                GalleryImages = galleryImages ?? new List<string>(),
                WelcomeText = welcomeText
            };
        }

        public async Task<FarmerDetailDto> UpdateFarmerInfoAsync(int farmerId, UpdateFarmerInfoDto updateDto)
        {
            var farmer = await _userRepository.GetByIdAsync(farmerId);
            if (farmer == null || farmer.Role != "Farmer")
                throw new NotFoundException($"Farmer with ID {farmerId} not found");

            var profile = await _userRepository.GetProfileAsync(farmerId);
            if (profile == null)
                throw new NotFoundException($"Profile for farmer {farmerId} not found");

            // Обновляем профиль
            if (!string.IsNullOrWhiteSpace(updateDto.FirstName))
                profile.FirstName = updateDto.FirstName;

            if (!string.IsNullOrWhiteSpace(updateDto.LastName))
                profile.LastName = updateDto.LastName;

            if (!string.IsNullOrWhiteSpace(updateDto.Phone))
                profile.Phone = updateDto.Phone;

            if (updateDto.Address != null)
                profile.Address = updateDto.Address;

            // Сохраняем расширенные данные в JSON формате в PreferredContact
            var extendedData = new Dictionary<string, object>();
            
            if (updateDto.Description != null)
                extendedData["Description"] = updateDto.Description;

            if (updateDto.ProfileImageUrl != null)
                extendedData["ProfileImageUrl"] = updateDto.ProfileImageUrl;

            if (updateDto.GalleryImages != null && updateDto.GalleryImages.Any())
            {
                // Ограничиваем до 15 изображений и сохраняем как массив напрямую (не как JSON строку)
                var limitedGallery = updateDto.GalleryImages.Take(15).ToList();
                extendedData["GalleryImages"] = limitedGallery; // Сохраняем как массив, не как JSON строку
                _logger.LogInformation("Saving {Count} gallery images for farmer {FarmerId}", limitedGallery.Count, farmerId);
            }

            if (updateDto.WelcomeText != null)
                extendedData["WelcomeText"] = updateDto.WelcomeText;

            // Сохраняем как JSON строку
            if (extendedData.Any())
            {
                var options = new System.Text.Json.JsonSerializerOptions
                {
                    WriteIndented = false,
                    Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
                };
                profile.PreferredContact = System.Text.Json.JsonSerializer.Serialize(extendedData, options);
                _logger.LogInformation("Saved extended data for farmer {FarmerId}: {Json}", farmerId, profile.PreferredContact);
            }
            else if (updateDto.Description != null)
            {
                // Если только описание, сохраняем просто как строку
                profile.PreferredContact = updateDto.Description;
            }

            await _context.SaveChangesAsync();

            // Возвращаем обновленную информацию
            return await GetFarmerDetailAsync(farmerId);
        }
    }
}

