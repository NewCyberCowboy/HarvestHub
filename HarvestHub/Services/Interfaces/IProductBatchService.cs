using HarvestHub.DTOs;

namespace HarvestHub.Services.Interfaces
{
    public interface IProductBatchService
    {
        // CRUD операции
        Task<ProductBatchDto> GetBatchByIdAsync(int batchId);
        Task<List<ProductBatchDto>> GetBatchesByProductIdAsync(int productId);
        Task<List<ProductBatchDto>> GetFarmerBatchesAsync(int farmerId);
        Task<ProductBatchDto> CreateBatchAsync(CreateProductBatchDto createDto, int farmerId);
        Task<ProductBatchDto> UpdateBatchAsync(int batchId, UpdateProductBatchDto updateDto, int farmerId);
        Task<bool> DeleteBatchAsync(int batchId, int farmerId);

        // Бизнес-логика
        Task<List<ProductBatchDto>> GetExpiringBatchesAsync(int daysThreshold, int farmerId);
        Task<List<ProductBatchDto>> GetExpiredBatchesAsync(int farmerId);
        Task<List<ProductBatchDto>> GetLowStockBatchesAsync(int threshold, int farmerId);
        Task<BatchExpiryReportDto> GetExpiryReportAsync(int farmerId);

        // Управление запасами
        Task<bool> AllocateFromBatchAsync(int batchId, int quantity, int farmerId);
        Task<bool> ReturnToBatchAsync(int batchId, int quantity, int farmerId);
        Task<bool> TransferBetweenBatchesAsync(int fromBatchId, int toBatchId, int quantity, int farmerId);

        // Валидация
        Task<bool> CanDeleteBatchAsync(int batchId);
        Task<bool> IsBatchAvailableAsync(int batchId);
    }
}