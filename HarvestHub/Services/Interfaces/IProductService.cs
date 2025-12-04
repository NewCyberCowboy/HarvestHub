using HarvestHub.DTOs;

namespace HarvestHub.Services.Interfaces
{
    public interface IProductService
    {
        Task<ProductDto> GetProductByIdAsync(int id);
        Task<IEnumerable<ProductDto>> GetAllProductsAsync();
        Task<IEnumerable<ProductDto>> GetProductsByCategoryAsync(int categoryId);
        Task<IEnumerable<ProductDto>> GetLowStockProductsAsync();
        Task<IEnumerable<ProductDto>> GetExpiringProductsAsync(int daysThreshold);
        Task<IEnumerable<ProductDto>> SearchProductsAsync(string searchTerm);
        Task<ProductDto> CreateProductAsync(CreateProductDto createDto);
        Task<ProductDto> UpdateProductAsync(int id, UpdateProductDto updateDto);
        Task<bool> DeleteProductAsync(int id);
        Task UpdateProductStockAsync(int productId, int quantity);
        Task<ProductDto> CreateProductAsync(CreateProductDto createDto, int farmerId);
        Task<IEnumerable<ProductDto>> GetFarmerProductsAsync(int farmerId);
    }
}