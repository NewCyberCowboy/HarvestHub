using HarvestHub.DTOs;

namespace HarvestHub.Services.Interfaces
{
    public interface ICategoryService
    {
        // Основные CRUD операции
        Task<CategoryDto> GetCategoryByIdAsync(int id);
        Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync();
        Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto createDto);
        Task<CategoryDto> UpdateCategoryAsync(int id, UpdateCategoryDto updateDto);
        Task<bool> DeleteCategoryAsync(int id);

        // Специфичные методы для древовидной структуры
        Task<IEnumerable<CategoryDto>> GetRootCategoriesAsync();
        Task<IEnumerable<CategoryDto>> GetChildCategoriesAsync(int parentId);
        Task<IEnumerable<CategoryDto>> GetCategoryTreeAsync();
        Task<bool> MoveCategoryAsync(int categoryId, int? newParentId);

        // Методы для продуктов категории
        Task<IEnumerable<ProductDto>> GetCategoryProductsAsync(int categoryId);
        Task<int> GetCategoryProductCountAsync(int categoryId);
        Task<IEnumerable<CategoryWithStatsDto>> GetCategoriesWithStatsAsync();

        // Валидация и проверки
        Task<bool> CategoryExistsAsync(int id);
        Task<bool> CategoryNameExistsAsync(string name, int? excludeCategoryId = null);
        Task<bool> CanDeleteCategoryAsync(int id);

        // Вспомогательные методы
        Task<IEnumerable<CategoryDto>> SearchCategoriesAsync(string searchTerm);
        Task RebuildCategoryTreeAsync();
    }
}