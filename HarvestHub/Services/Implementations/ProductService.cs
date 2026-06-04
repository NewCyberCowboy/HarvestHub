using HarvestHub.Models;
using HarvestHub.DTOs;
using HarvestHub.Repositories.Interfaces;
using HarvestHub.Services.Interfaces;
using HarvestHub.Exceptions;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Collections.Generic;

namespace HarvestHub.Services.Implementations
{
    public class ProductService : IProductService
    {
        private readonly IProductRepository _productRepository;
        private readonly ICategoryRepository _categoryRepository;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<ProductService> _logger;

        public ProductService(
            IProductRepository productRepository,
            ICategoryRepository categoryRepository,
            IUserRepository userRepository,
            ILogger<ProductService> logger)
        {
            _productRepository = productRepository;
            _categoryRepository = categoryRepository;
            _userRepository = userRepository;
            _logger = logger;
        }

        public async Task<ProductDto> GetProductByIdAsync(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null)
                throw new NotFoundException($"Product with ID {id} not found");

            return MapToProductDto(product);
        }

        public async Task<IEnumerable<ProductDto>> GetAllProductsAsync()
        {
            var products = await _productRepository.GetAllAsync();
            return products.Select(MapToProductDto);
        }

        // Обновленный метод с farmerId
        public async Task<ProductDto> CreateProductAsync(CreateProductDto createDto, int farmerId)
        {
            // Валидация категории (если указана)
            if (createDto.CategoryId.HasValue)
            {
                if (!await _categoryRepository.ExistsAsync(createDto.CategoryId.Value))
                {
                    throw new BusinessException($"Category with ID {createDto.CategoryId} not found");
                }
            }

            // Валидация уникальности имени
            if (string.IsNullOrWhiteSpace(createDto.Name))
            {
                throw new BusinessException("Product name is required");
            }

            if (await _productRepository.ExistsByNameAsync(createDto.Name))
                throw new BusinessException($"Product with name '{createDto.Name}' already exists");

            // Валидация цены
            if (createDto.BasePrice <= 0)
            {
                throw new BusinessException("Product price must be greater than 0");
            }

            // Проверка существования фермера
            var farmer = await _userRepository.GetByIdAsync(farmerId);
            if (farmer == null)
            {
                throw new NotFoundException($"Farmer with ID {farmerId} not found");
            }

            try
            {
                // Конвертируем даты в UTC, если они указаны
                DateTime? harvestDateUtc = null;
                if (createDto.HarvestDate.HasValue)
                {
                    var harvestDate = createDto.HarvestDate.Value;
                    harvestDateUtc = harvestDate.Kind == DateTimeKind.Unspecified 
                        ? DateTime.SpecifyKind(harvestDate, DateTimeKind.Utc) 
                        : harvestDate.ToUniversalTime();
                }

                DateTime? expiryDateUtc = null;
                if (createDto.ExpiryDate.HasValue)
                {
                    var expiryDate = createDto.ExpiryDate.Value;
                    expiryDateUtc = expiryDate.Kind == DateTimeKind.Unspecified 
                        ? DateTime.SpecifyKind(expiryDate, DateTimeKind.Utc) 
                        : expiryDate.ToUniversalTime();
                }

                // Конвертируем WeightOptions из List<decimal> в JSON строку
                string? weightOptionsJson = null;
                if (createDto.WeightOptions != null && createDto.WeightOptions.Any())
                {
                    weightOptionsJson = System.Text.Json.JsonSerializer.Serialize(createDto.WeightOptions);
                }

                var product = new Product
                {
                    Name = createDto.Name.Trim(),
                    Description = string.IsNullOrWhiteSpace(createDto.Description) ? null : createDto.Description.Trim(),
                    BasePrice = createDto.BasePrice, // Цена за кг
                    CurrentStock = createDto.CurrentStock, // Количество в наличии (в кг)
                    Unit = GetValidUnit(createDto.Unit), // Заменяем "шт" и "коробка" на "кг"
                    WeightOptions = weightOptionsJson,
                    AllowCustomWeight = createDto.AllowCustomWeight,
                    FarmerId = farmerId, // Устанавливаем только ID, не навигационное свойство
                    CategoryId = createDto.CategoryId, // Может быть null
                    Status = "Available", // Статус всегда устанавливается автоматически
                    HarvestDate = harvestDateUtc,
                    ExpiryDate = expiryDateUtc,
                    StorageConditions = string.IsNullOrWhiteSpace(createDto.StorageConditions) ? null : createDto.StorageConditions.Trim(),
                    ImageUrl = string.IsNullOrWhiteSpace(createDto.ImageUrl) ? null : createDto.ImageUrl.Trim(),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                    // НЕ устанавливаем навигационные свойства Farmer и Category - EF сделает это автоматически
                };

                _logger.LogInformation("Attempting to create product: Name={Name}, FarmerId={FarmerId}, CategoryId={CategoryId}, BasePrice={BasePrice}, CurrentStock={CurrentStock}", 
                    product.Name, farmerId, createDto.CategoryId, product.BasePrice, product.CurrentStock);

                var created = await _productRepository.AddAsync(product);
                _logger.LogInformation("Product created successfully: {ProductId}, {ProductName} by Farmer {FarmerId}", 
                    created.ProductId, created.Name, farmerId);

                return MapToProductDto(created);
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error creating product: Name={Name}, FarmerId={FarmerId}, InnerException={InnerException}", 
                    createDto.Name, farmerId, dbEx.InnerException?.Message);
                
                // Проверяем внутреннее исключение для более детальной информации
                if (dbEx.InnerException != null)
                {
                    var innerMessage = dbEx.InnerException.Message;
                    if (innerMessage.Contains("foreign key") || innerMessage.Contains("FOREIGN KEY"))
                    {
                        throw new BusinessException("Ошибка при создании продукта: проверьте, что фермер и категория существуют");
                    }
                    throw new BusinessException($"Ошибка базы данных: {innerMessage}");
                }
                throw new BusinessException($"Ошибка при сохранении продукта: {dbEx.Message}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product: Name={Name}, FarmerId={FarmerId}, Error={ErrorMessage}, StackTrace={StackTrace}", 
                    createDto.Name, farmerId, ex.Message, ex.StackTrace);
                throw;
            }
        }

        // Старый метод для обратной совместимости (можно удалить если не используется)
        public async Task<ProductDto> CreateProductAsync(CreateProductDto createDto)
        {
            // Используем farmerId = 1 как временное решение
            // В реальном приложении нужно получать ID текущего пользователя
            return await CreateProductAsync(createDto, 1);
        }

        public async Task<ProductDto> UpdateProductAsync(int id, UpdateProductDto updateDto)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null)
                throw new NotFoundException($"Product with ID {id} not found");

            // Валидация уникальности имени
            if (!string.IsNullOrEmpty(updateDto.Name) &&
                updateDto.Name != product.Name &&
                await _productRepository.ExistsByNameAsync(updateDto.Name, id))
            {
                throw new BusinessException($"Product with name '{updateDto.Name}' already exists");
            }

            // Обновление полей
            if (!string.IsNullOrEmpty(updateDto.Name))
                product.Name = updateDto.Name;

            if (!string.IsNullOrEmpty(updateDto.Description))
                product.Description = updateDto.Description;

            if (updateDto.BasePrice.HasValue)
                product.BasePrice = updateDto.BasePrice.Value;

            if (updateDto.CurrentStock.HasValue)
                product.CurrentStock = updateDto.CurrentStock.Value;

            if (updateDto.Unit != null)
                product.Unit = GetValidUnit(updateDto.Unit);

            // Обновляем WeightOptions если указаны
            if (updateDto.WeightOptions != null)
            {
                product.WeightOptions = System.Text.Json.JsonSerializer.Serialize(updateDto.WeightOptions);
            }

            // Обновляем AllowCustomWeight если указано
            if (updateDto.AllowCustomWeight.HasValue)
            {
                product.AllowCustomWeight = updateDto.AllowCustomWeight.Value;
            }

            if (updateDto.CategoryId.HasValue)
            {
                if (!await _categoryRepository.ExistsAsync(updateDto.CategoryId.Value))
                    throw new BusinessException($"Category with ID {updateDto.CategoryId} not found");
                product.CategoryId = updateDto.CategoryId.Value;
            }

            if (!string.IsNullOrEmpty(updateDto.Status))
                product.Status = updateDto.Status;

            if (updateDto.HarvestDate.HasValue)
            {
                var harvestDate = updateDto.HarvestDate.Value;
                product.HarvestDate = harvestDate.Kind == DateTimeKind.Unspecified 
                    ? DateTime.SpecifyKind(harvestDate, DateTimeKind.Utc) 
                    : harvestDate.ToUniversalTime();
            }

            if (updateDto.ExpiryDate.HasValue)
            {
                var expiryDate = updateDto.ExpiryDate.Value;
                product.ExpiryDate = expiryDate.Kind == DateTimeKind.Unspecified 
                    ? DateTime.SpecifyKind(expiryDate, DateTimeKind.Utc) 
                    : expiryDate.ToUniversalTime();
            }

            if (!string.IsNullOrEmpty(updateDto.StorageConditions))
                product.StorageConditions = updateDto.StorageConditions;

            if (updateDto.ImageUrl != null)
                product.ImageUrl = string.IsNullOrWhiteSpace(updateDto.ImageUrl) ? null : updateDto.ImageUrl.Trim();

            product.UpdatedAt = DateTime.UtcNow;

            var updated = await _productRepository.UpdateAsync(product);
            _logger.LogInformation("Product updated: {ProductId}", id);

            return MapToProductDto(updated);
        }

        public async Task<bool> DeleteProductAsync(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null)
                throw new NotFoundException($"Product with ID {id} not found");

            // Проверка наличия заказов
            if (await _productRepository.HasOrdersAsync(id))
                throw new BusinessException("Cannot delete product with existing orders");

            var result = await _productRepository.DeleteAsync(id);
            if (result)
                _logger.LogInformation("Product deleted: {ProductId}", id);

            return result;
        }

        public async Task<IEnumerable<ProductDto>> GetProductsByCategoryAsync(int categoryId)
        {
            if (!await _categoryRepository.ExistsAsync(categoryId))
                throw new NotFoundException($"Category with ID {categoryId} not found");

            var products = await _productRepository.GetProductsByCategoryAsync(categoryId);
            return products.Select(MapToProductDto);
        }

        public async Task<IEnumerable<ProductDto>> GetLowStockProductsAsync()
        {
            var products = await _productRepository.GetLowStockProductsAsync();
            return products.Select(MapToProductDto);
        }

        public async Task<IEnumerable<ProductDto>> GetExpiringProductsAsync(int daysThreshold)
        {
            var products = await _productRepository.GetExpiringProductsAsync(daysThreshold);
            return products.Select(MapToProductDto);
        }

        public async Task UpdateProductStockAsync(int productId, int quantity)
        {
            var product = await _productRepository.GetByIdAsync(productId);
            if (product == null)
                throw new NotFoundException($"Product with ID {productId} not found");

            await _productRepository.UpdateStockAsync(productId, quantity);
            _logger.LogInformation("Product stock updated: {ProductId}, New stock: {Quantity}", productId, quantity);
        }

        public async Task<IEnumerable<ProductDto>> SearchProductsAsync(string searchTerm)
        {
            var products = await _productRepository.SearchAsync(searchTerm);
            return products.Select(MapToProductDto);
        }

        // Новый метод для получения продуктов фермера
        public async Task<IEnumerable<ProductDto>> GetFarmerProductsAsync(int farmerId)
        {
            var products = await _productRepository.GetProductsByFarmerIdAsync(farmerId);
            return products.Select(MapToProductDto);
        }

        private ProductDto MapToProductDto(Product product)
        {
            string farmerName = "Unknown Farmer";
            string? farmerAddress = null;

            if (product.Farmer?.Profile != null)
            {
                var firstName = product.Farmer.Profile.FirstName ?? "";
                var lastName = product.Farmer.Profile.LastName ?? "";
                farmerName = $"{firstName} {lastName}".Trim();
                if (string.IsNullOrEmpty(farmerName))
                    farmerName = "Unknown Farmer";
            }

            // Получаем адрес фермера (первый адрес по умолчанию или из Profile)
            if (product.Farmer != null)
            {
                // Сначала пробуем получить из Addresses
                if (product.Farmer.Addresses != null && product.Farmer.Addresses.Any())
                {
                    var defaultAddress = product.Farmer.Addresses.FirstOrDefault(a => a.IsDefault) 
                        ?? product.Farmer.Addresses.First();
                    if (defaultAddress != null)
                    {
                        farmerAddress = $"{defaultAddress.Street}, {defaultAddress.City}, {defaultAddress.PostalCode}";
                    }
                }
                // Если нет адресов, пробуем получить из Profile
                else if (product.Farmer.Profile?.Address != null)
                {
                    farmerAddress = product.Farmer.Profile.Address;
                }
            }

            // Конвертируем WeightOptions из JSON строки в List<decimal>
            List<decimal>? weightOptions = null;
            if (!string.IsNullOrWhiteSpace(product.WeightOptions))
            {
                try
                {
                    weightOptions = System.Text.Json.JsonSerializer.Deserialize<List<decimal>>(product.WeightOptions);
                }
                catch
                {
                    // Если не удалось распарсить, оставляем null
                }
            }

            return new ProductDto
            {
                ProductId = product.ProductId,
                Name = product.Name,
                Description = product.Description,
                BasePrice = product.BasePrice, // Цена за кг
                CurrentStock = product.CurrentStock, // Количество в наличии (в кг)
                Unit = GetValidUnit(product.Unit),
                WeightOptions = weightOptions,
                AllowCustomWeight = product.AllowCustomWeight,
                CategoryId = product.CategoryId ?? 0,
                CategoryName = product.Category?.Name,
                Status = product.Status,
                HarvestDate = product.HarvestDate,
                ExpiryDate = product.ExpiryDate,
                StorageConditions = product.StorageConditions,
                CreatedAt = product.CreatedAt,
                FarmerId = product.FarmerId,
                FarmerName = farmerName,
                FarmerAddress = farmerAddress,
                ImageUrl = product.ImageUrl
            };
        }

        // Вспомогательный метод для валидации единицы измерения
        private string GetValidUnit(string? unit)
        {
            if (string.IsNullOrWhiteSpace(unit))
                return "кг";
            
            var trimmedUnit = unit.Trim();
            
            // Заменяем недопустимые единицы на "кг"
            if (trimmedUnit == "шт" || trimmedUnit == "коробка" || trimmedUnit == "коробки")
                return "кг";
            
            return trimmedUnit;
        }
    }
}
