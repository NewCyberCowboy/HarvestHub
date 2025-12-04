using HarvestHub.Models;
using HarvestHub.DTOs;
using HarvestHub.Repositories.Interfaces;
using HarvestHub.Services.Interfaces;
using HarvestHub.Exceptions;

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
            // Валидация категории
            if (createDto.CategoryId.HasValue &&
                !await _categoryRepository.ExistsAsync(createDto.CategoryId.Value))
            {
                throw new BusinessException($"Category with ID {createDto.CategoryId} not found");
            }

            // Валидация уникальности имени
            if (await _productRepository.ExistsByNameAsync(createDto.Name))
                throw new BusinessException($"Product with name '{createDto.Name}' already exists");

            var product = new Product
            {
                Name = createDto.Name,
                Description = createDto.Description,
                BasePrice = createDto.BasePrice,
                CurrentStock = createDto.CurrentStock,
                FarmerId = farmerId,
                CategoryId = createDto.CategoryId,
                Status = "Available",
                HarvestDate = createDto.HarvestDate,
                ExpiryDate = createDto.ExpiryDate,
                StorageConditions = createDto.StorageConditions,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var created = await _productRepository.AddAsync(product);
            _logger.LogInformation("Product created: {ProductId}, {ProductName}", created.ProductId, created.Name);

            return MapToProductDto(created);
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

            if (updateDto.CategoryId.HasValue)
            {
                if (!await _categoryRepository.ExistsAsync(updateDto.CategoryId.Value))
                    throw new BusinessException($"Category with ID {updateDto.CategoryId} not found");
                product.CategoryId = updateDto.CategoryId.Value;
            }

            if (!string.IsNullOrEmpty(updateDto.Status))
                product.Status = updateDto.Status;

            if (updateDto.HarvestDate.HasValue)
                product.HarvestDate = updateDto.HarvestDate;

            if (updateDto.ExpiryDate.HasValue)
                product.ExpiryDate = updateDto.ExpiryDate;

            if (!string.IsNullOrEmpty(updateDto.StorageConditions))
                product.StorageConditions = updateDto.StorageConditions;

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

            if (product.Farmer?.Profile != null)
            {
                var firstName = product.Farmer.Profile.FirstName ?? "";
                var lastName = product.Farmer.Profile.LastName ?? "";
                farmerName = $"{firstName} {lastName}".Trim();
                if (string.IsNullOrEmpty(farmerName))
                    farmerName = "Unknown Farmer";
            }

            return new ProductDto
            {
                ProductId = product.ProductId,
                Name = product.Name,
                Description = product.Description,
                BasePrice = product.BasePrice,
                CurrentStock = product.CurrentStock,
                CategoryId = product.CategoryId ?? 0,
                CategoryName = product.Category?.Name,
                Status = product.Status,
                HarvestDate = product.HarvestDate,
                ExpiryDate = product.ExpiryDate,
                StorageConditions = product.StorageConditions,
                CreatedAt = product.CreatedAt,
                FarmerName = farmerName // Добавляем имя фермера
            };
        }
    }
    }
