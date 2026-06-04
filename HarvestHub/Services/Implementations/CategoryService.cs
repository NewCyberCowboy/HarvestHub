using HarvestHub.DTOs;
using HarvestHub.Repositories.Interfaces;
using HarvestHub.Services.Interfaces;
using HarvestHub.Exceptions;
using HarvestHub.Models;

namespace HarvestHub.Services.Implementations
{
    public class CategoryService : ICategoryService
    {
        private readonly ICategoryRepository _categoryRepository;
        private readonly IProductRepository _productRepository;
        private readonly ILogger<CategoryService> _logger;

        public CategoryService(
            ICategoryRepository categoryRepository,
            IProductRepository productRepository,
            ILogger<CategoryService> logger)
        {
            _categoryRepository = categoryRepository;
            _productRepository = productRepository;
            _logger = logger;
        }

        public async Task<CategoryDto> GetCategoryByIdAsync(int id)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
                throw new NotFoundException($"Category with ID {id} not found");

            return MapToCategoryDto(category);
        }

        public async Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync()
        {
            var categories = await _categoryRepository.GetAllAsync();
            return categories.Select(MapToCategoryDto);
        }

        public async Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto createDto)
        {
            // Валидация уникальности имени
            if (await _categoryRepository.ExistsByNameAsync(createDto.Name))
                throw new BusinessException($"Category with name '{createDto.Name}' already exists");

            var category = new Category
            {
                Name = createDto.Name,
                Description = createDto.Description,
                ParentId = createDto.ParentId
            };

            var created = await _categoryRepository.AddAsync(category);
            _logger.LogInformation("Category created: {CategoryId}, {CategoryName}", created.CategoryId, created.Name);

            return MapToCategoryDto(created);
        }

        public async Task<IEnumerable<CategoryDto>> GetCategoryTreeAsync()
        {
            var categories = await _categoryRepository.GetAllAsync();
            var rootCategories = categories.Where(c => c.ParentId == null);
            return await BuildCategoryTreeAsync(rootCategories);
        }

        private async Task<IEnumerable<CategoryDto>> BuildCategoryTreeAsync(IEnumerable<Category> rootCategories)
        {
            var result = new List<CategoryDto>();

            foreach (var category in rootCategories)
            {
                var categoryDto = MapToCategoryDto(category);

                // Рекурсивно получаем детей для текущей категории
                var children = await _categoryRepository.GetChildrenAsync(category.CategoryId);
                if (children.Any())
                {
                    categoryDto.Children = await BuildCategoryTreeAsync(children);
                }
                else
                {
                    categoryDto.Children = new List<CategoryDto>();
                }

                result.Add(categoryDto);
            }

            return result;
        }

        public async Task<CategoryDto> UpdateCategoryAsync(int id, UpdateCategoryDto updateDto)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
                throw new NotFoundException($"Category with ID {id} not found");

            // Проверка уникальности имени (если имя изменено)
            if (!string.IsNullOrEmpty(updateDto.Name) &&
                updateDto.Name != category.Name &&
                await _categoryRepository.ExistsByNameAsync(updateDto.Name))
            {
                throw new BusinessException($"Category with name '{updateDto.Name}' already exists");
            }

            // Обновление полей
            if (!string.IsNullOrEmpty(updateDto.Name))
                category.Name = updateDto.Name;

            if (!string.IsNullOrEmpty(updateDto.Description))
                category.Description = updateDto.Description;

            // Проверка циклических ссылок при изменении родителя
            if (updateDto.ParentId.HasValue && updateDto.ParentId.Value != category.ParentId)
            {
                if (updateDto.ParentId.Value == id)
                    throw new BusinessException("Category cannot be its own parent");

                if (await WouldCreateCycleAsync(id, updateDto.ParentId.Value))
                    throw new BusinessException("Moving category would create circular reference");

                category.ParentId = updateDto.ParentId.Value;
            }

            var updated = await _categoryRepository.UpdateAsync(category);
            _logger.LogInformation("Category updated: {CategoryId}", id);

            return MapToCategoryDto(updated);
        }

        public async Task<bool> DeleteCategoryAsync(int id)
        {
            if (!await CanDeleteCategoryAsync(id))
                throw new BusinessException($"Category with ID {id} cannot be deleted. It may contain products or subcategories.");

            var result = await _categoryRepository.DeleteAsync(id);
            if (result)
                _logger.LogInformation("Category deleted: {CategoryId}", id);

            return result;
        }

        public async Task<IEnumerable<CategoryDto>> GetRootCategoriesAsync()
        {
            var rootCategories = await _categoryRepository.GetRootCategoriesAsync();
            return rootCategories.Select(MapToCategoryDto);
        }

        public async Task<IEnumerable<CategoryDto>> GetChildCategoriesAsync(int parentId)
        {
            if (!await _categoryRepository.ExistsAsync(parentId))
                throw new NotFoundException($"Parent category with ID {parentId} not found");

            var children = await _categoryRepository.GetChildrenAsync(parentId);
            return children.Select(MapToCategoryDto);
        }

        public async Task<bool> MoveCategoryAsync(int categoryId, int? newParentId)
        {
            var category = await _categoryRepository.GetByIdAsync(categoryId);
            if (category == null)
                throw new NotFoundException($"Category with ID {categoryId} not found");

            // Проверка циклических ссылок
            if (newParentId.HasValue)
            {
                if (newParentId.Value == categoryId)
                    throw new BusinessException("Category cannot be its own parent");

                if (await WouldCreateCycleAsync(categoryId, newParentId.Value))
                    throw new BusinessException("Moving category would create circular reference");

                if (!await _categoryRepository.ExistsAsync(newParentId.Value))
                    throw new NotFoundException($"Target parent category with ID {newParentId} not found");
            }

            category.ParentId = newParentId;
            await _categoryRepository.UpdateAsync(category);

            _logger.LogInformation("Category {CategoryId} moved to parent {ParentId}", categoryId, newParentId);
            return true;
        }

        public async Task<IEnumerable<ProductDto>> GetCategoryProductsAsync(int categoryId)
        {
            if (!await _categoryRepository.ExistsAsync(categoryId))
                throw new NotFoundException($"Category with ID {categoryId} not found");

            // Получаем все ID категорий в поддереве (включая саму категорию)
            var categoryIds = await GetCategorySubtreeIdsAsync(categoryId);
            var products = await _productRepository.GetByCategoriesAsync(categoryIds);

            return products.Select(MapToProductDto);
        }

        public async Task<int> GetCategoryProductCountAsync(int categoryId)
        {
            if (!await _categoryRepository.ExistsAsync(categoryId))
                throw new NotFoundException($"Category with ID {categoryId} not found");

            var categoryIds = await GetCategorySubtreeIdsAsync(categoryId);
            return await _productRepository.GetCountByCategoriesAsync(categoryIds);
        }

        public async Task<IEnumerable<CategoryWithStatsDto>> GetCategoriesWithStatsAsync()
        {
            var categories = await _categoryRepository.GetAllAsync();
            var result = new List<CategoryWithStatsDto>();

            foreach (var category in categories)
            {
                var categoryIds = await GetCategorySubtreeIdsAsync(category.CategoryId);
                var productCount = await _productRepository.GetCountByCategoriesAsync(categoryIds);
                var salesData = await _productRepository.GetSalesDataByCategoriesAsync(categoryIds);

                result.Add(new CategoryWithStatsDto
                {
                    CategoryId = category.CategoryId,
                    Name = category.Name,
                    ProductCount = productCount,
                    TotalSales = salesData.TotalSales,
                    TotalRevenue = salesData.TotalRevenue,
                    Level = await CalculateCategoryLevelAsync(category.CategoryId)
                });
            }

            return result;
        }

        public async Task<bool> CategoryExistsAsync(int id)
        {
            return await _categoryRepository.ExistsAsync(id);
        }

        public async Task<bool> CategoryNameExistsAsync(string name, int? excludeCategoryId = null)
        {
            return await _categoryRepository.ExistsByNameAsync(name, excludeCategoryId);
        }

        public async Task<bool> CanDeleteCategoryAsync(int id)
        {
            var hasProducts = await _categoryRepository.HasProductsAsync(id);
            var hasChildren = await _categoryRepository.HasChildrenAsync(id);

            return !hasProducts && !hasChildren;
        }

        public async Task<IEnumerable<CategoryDto>> SearchCategoriesAsync(string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return await GetAllCategoriesAsync();

            var categories = await _categoryRepository.SearchAsync(searchTerm);
            return categories.Select(MapToCategoryDto);
        }

        public async Task RebuildCategoryTreeAsync()
        {
            await _categoryRepository.UpdateTreeStructureAsync();
            _logger.LogInformation("Category tree structure rebuilt");
        }

        private async Task<bool> WouldCreateCycleAsync(int categoryId, int potentialParentId)
        {
            int? currentParentId = potentialParentId;
            while (currentParentId != null)
            {
                if (currentParentId == categoryId)
                    return true;

                var parent = await _categoryRepository.GetByIdAsync(currentParentId.Value);
                currentParentId = parent?.ParentId;
            }
            return false;
        }

        private async Task<List<int>> GetCategorySubtreeIdsAsync(int categoryId)
        {
            var ids = new List<int> { categoryId };
            await AddChildCategoryIdsAsync(categoryId, ids);
            return ids;
        }

        private async Task AddChildCategoryIdsAsync(int parentId, List<int> ids)
        {
            var children = await _categoryRepository.GetChildrenAsync(parentId);
            foreach (var child in children)
            {
                ids.Add(child.CategoryId);
                await AddChildCategoryIdsAsync(child.CategoryId, ids);
            }
        }

        private async Task<int> CalculateCategoryLevelAsync(int categoryId)
        {
            var level = 0;
            var currentId = categoryId;

            while (currentId != 0)
            {
                var category = await _categoryRepository.GetByIdAsync(currentId);
                if (category?.ParentId == null)
                    break;

                level++;
                currentId = category.ParentId.Value;
            }

            return level;
        }

        // Методы для ручного маппинга
        private CategoryDto MapToCategoryDto(Category category)
        {
            return new CategoryDto
            {
                CategoryId = category.CategoryId,
                Name = category.Name,
                Description = category.Description,
                ParentId = category.ParentId,
                ParentName = category.Parent?.Name,
                Children = new List<CategoryDto>() // Заполняется в дереве
            };
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
                farmerAddress = product.Farmer.Profile.Address;
            }

            // Парсим WeightOptions из JSON
            List<decimal>? weightOptions = null;
            if (!string.IsNullOrWhiteSpace(product.WeightOptions))
            {
                try
                {
                    weightOptions = System.Text.Json.JsonSerializer.Deserialize<List<decimal>>(product.WeightOptions);
                }
                catch
                {
                    weightOptions = null;
                }
            }

            return new ProductDto
            {
                ProductId = product.ProductId,
                Name = product.Name,
                Description = product.Description,
                BasePrice = product.BasePrice,
                CurrentStock = product.CurrentStock,
                Unit = product.Unit ?? "кг",
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
    }
}