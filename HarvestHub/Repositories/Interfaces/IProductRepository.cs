using HarvestHub.Models;

namespace HarvestHub.Repositories.Interfaces
{
    public interface IProductRepository : IRepository<Product>
    {
        Task<IEnumerable<Product>> GetProductsByCategoryAsync(int categoryId);
        Task<IEnumerable<Product>> GetLowStockProductsAsync();
        Task<IEnumerable<Product>> GetExpiringProductsAsync(int daysThreshold);
        Task UpdateStockAsync(int productId, int quantity);
        Task<bool> ExistsByNameAsync(string name, int? excludeProductId = null);
        Task<bool> HasOrdersAsync(int productId);
        Task<IEnumerable<Product>> SearchAsync(string searchTerm);
        Task<IEnumerable<Product>> GetByCategoriesAsync(IEnumerable<int> categoryIds);
        Task<int> GetCountByCategoriesAsync(IEnumerable<int> categoryIds);
        Task<ProductSalesData> GetSalesDataByCategoriesAsync(IEnumerable<int> categoryIds);
        Task<IEnumerable<Product>> GetProductsByFarmerIdAsync(int farmerId);

        Task<int> GetCountByFarmerIdAsync(int farmerId);
    }
}