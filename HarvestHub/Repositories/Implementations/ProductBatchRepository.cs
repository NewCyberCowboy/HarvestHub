using HarvestHub.DTOs;
using HarvestHub.Models;
using HarvestHub.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HarvestHub.Repositories.Implementations
{
    public class ProductBatchRepository : IProductBatchRepository
    {
        private readonly ApplicationDbContext _context;

        public ProductBatchRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ProductBatch> GetByIdAsync(int id)
        {
            return await _context.ProductBatches
                .Include(pb => pb.Product)
                    .ThenInclude(p => p.Farmer)
                .Include(pb => pb.OrderItems)
                .FirstOrDefaultAsync(pb => pb.BatchId == id);
        }

        public async Task<IEnumerable<ProductBatch>> GetAllAsync()
        {
            return await _context.ProductBatches
                .Include(pb => pb.Product)
                .ToListAsync();
        }

        public async Task<IEnumerable<ProductBatch>> FindAsync(System.Linq.Expressions.Expression<Func<ProductBatch, bool>> predicate)
        {
            return await _context.ProductBatches
                .Include(pb => pb.Product)
                .Where(predicate)
                .ToListAsync();
        }

        public async Task<ProductBatch> AddAsync(ProductBatch entity)
        {
            _context.ProductBatches.Add(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<ProductBatch> UpdateAsync(ProductBatch entity)
        {
            _context.ProductBatches.Update(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var batch = await GetByIdAsync(id);
            if (batch == null) return false;

            _context.ProductBatches.Remove(batch);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _context.ProductBatches.AnyAsync(pb => pb.BatchId == id);
        }

        public async Task<List<ProductBatch>> GetBatchesByProductIdAsync(int productId)
        {
            return await _context.ProductBatches
                .Where(pb => pb.ProductId == productId)
                .Include(pb => pb.Product)
                .OrderByDescending(pb => pb.HarvestDate)
                .ToListAsync();
        }

        public async Task<List<ProductBatch>> GetBatchesByFarmerIdAsync(int farmerId)
        {
            return await _context.ProductBatches
                .Where(pb => pb.Product.FarmerId == farmerId)
                .Include(pb => pb.Product)
                .OrderByDescending(pb => pb.HarvestDate)
                .ToListAsync();
        }

        public async Task<List<ProductBatch>> GetExpiringBatchesAsync(int daysThreshold)
        {
            var thresholdDate = DateTime.UtcNow.AddDays(daysThreshold);
            return await _context.ProductBatches
                .Where(pb => pb.ExpiryDate <= thresholdDate && pb.CurrentQuantity > 0)
                .Include(pb => pb.Product)
                .OrderBy(pb => pb.ExpiryDate)
                .ToListAsync();
        }

        public async Task<List<ProductBatch>> GetExpiredBatchesAsync()
        {
            return await _context.ProductBatches
                .Where(pb => pb.ExpiryDate < DateTime.UtcNow && pb.CurrentQuantity > 0)
                .Include(pb => pb.Product)
                .OrderBy(pb => pb.ExpiryDate)
                .ToListAsync();
        }

        public async Task<List<ProductBatch>> GetLowStockBatchesAsync(int threshold)
        {
            return await _context.ProductBatches
                .Where(pb => pb.CurrentQuantity <= threshold && pb.CurrentQuantity > 0)
                .Include(pb => pb.Product)
                .OrderBy(pb => pb.CurrentQuantity)
                .ToListAsync();
        }

        public async Task<ProductBatch?> GetBatchByNumberAsync(string batchNumber)
        {
            return await _context.ProductBatches
                .Include(pb => pb.Product)
                .FirstOrDefaultAsync(pb => pb.BatchNumber == batchNumber);
        }

        public async Task<bool> BatchNumberExistsAsync(string batchNumber, int? excludeBatchId = null)
        {
            var query = _context.ProductBatches.Where(pb => pb.BatchNumber == batchNumber);

            if (excludeBatchId.HasValue)
                query = query.Where(pb => pb.BatchId != excludeBatchId.Value);

            return await query.AnyAsync();
        }

        public async Task UpdateBatchQuantityAsync(int batchId, int quantity)
        {
            var batch = await GetByIdAsync(batchId);
            if (batch != null)
            {
                batch.CurrentQuantity = quantity;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<ProductBatch>> GetAvailableBatchesForProductAsync(int productId)
        {
            return await _context.ProductBatches
                .Where(pb => pb.ProductId == productId &&
                           pb.CurrentQuantity > 0 &&
                           pb.ExpiryDate > DateTime.UtcNow)
                .OrderBy(pb => pb.ExpiryDate) // FIFO - First In, First Out
                .ToListAsync();
        }

        public async Task<BatchExpiryReportDto> GetExpiryReportAsync(int farmerId)
        {
            var batches = await GetBatchesByFarmerIdAsync(farmerId);
            var now = DateTime.UtcNow;

            var expiredBatches = batches.Where(b => b.ExpiryDate < now && b.CurrentQuantity > 0).ToList();
            var expiringSoonBatches = batches.Where(b => b.ExpiryDate >= now && b.ExpiryDate <= now.AddDays(7) && b.CurrentQuantity > 0).ToList();

            decimal totalPotentialLoss = 0;

            foreach (var batch in expiredBatches.Concat(expiringSoonBatches))
            {
                if (batch.Product != null)
                {
                    totalPotentialLoss += batch.CurrentQuantity * batch.Product.BasePrice;
                }
            }

            return new BatchExpiryReportDto
            {
                TotalBatches = batches.Count,
                ExpiredBatches = expiredBatches.Count,
                ExpiringSoonBatches = expiringSoonBatches.Count,
                ExpiringBatches = expiringSoonBatches.Select(b => MapToBatchDto(b)).ToList(),
                TotalPotentialLoss = totalPotentialLoss
            };
        }

        private ProductBatchDto MapToBatchDto(ProductBatch batch)
        {
            if (batch == null)
                throw new ArgumentNullException(nameof(batch));

            var daysUntilExpiry = (batch.ExpiryDate - DateTime.UtcNow).Days;
            var isLowStock = batch.CurrentQuantity <= (batch.InitialQuantity * 0.1m); // 10% от начального количества

            return new ProductBatchDto
            {
                BatchId = batch.BatchId,
                ProductId = batch.ProductId,
                ProductName = batch.Product?.Name ?? string.Empty,
                BatchNumber = batch.BatchNumber,
                HarvestDate = batch.HarvestDate,
                ExpiryDate = batch.ExpiryDate,
                InitialQuantity = batch.InitialQuantity,
                CurrentQuantity = batch.CurrentQuantity,
                QualityGrade = batch.QualityGrade,
                StorageLocation = batch.StorageLocation,
                PurchasePrice = batch.PurchasePrice,
                SupplierInfo = batch.SupplierInfo,
                IsExpired = batch.ExpiryDate < DateTime.UtcNow,
                IsLowStock = isLowStock,
                DaysUntilExpiry = daysUntilExpiry > 0 ? daysUntilExpiry : 0,
                CreatedAt = batch.CreatedAt,
                UpdatedAt = batch.UpdatedAt
            };
        }
    }
}