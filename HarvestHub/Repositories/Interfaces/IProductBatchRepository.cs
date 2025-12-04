using HarvestHub.DTOs;
using HarvestHub.Models;

namespace HarvestHub.Repositories.Interfaces
{
    public interface IProductBatchRepository : IRepository<ProductBatch>
    {
        Task<List<ProductBatch>> GetBatchesByProductIdAsync(int productId);
        Task<List<ProductBatch>> GetBatchesByFarmerIdAsync(int farmerId);
        Task<List<ProductBatch>> GetExpiringBatchesAsync(int daysThreshold);
        Task<List<ProductBatch>> GetExpiredBatchesAsync();
        Task<List<ProductBatch>> GetLowStockBatchesAsync(int threshold);
        Task<ProductBatch?> GetBatchByNumberAsync(string batchNumber);
        Task<bool> BatchNumberExistsAsync(string batchNumber, int? excludeBatchId = null);
        Task UpdateBatchQuantityAsync(int batchId, int quantity);
        Task<List<ProductBatch>> GetAvailableBatchesForProductAsync(int productId);
        Task<BatchExpiryReportDto> GetExpiryReportAsync(int farmerId);
    }
}