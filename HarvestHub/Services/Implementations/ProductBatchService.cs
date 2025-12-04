using HarvestHub.DTOs;
using HarvestHub.Models;
using HarvestHub.Repositories.Interfaces;
using HarvestHub.Services.Interfaces;
using HarvestHub.Exceptions;

namespace HarvestHub.Services.Implementations
{
    public class ProductBatchService : IProductBatchService
    {
        private readonly IProductBatchRepository _batchRepository;
        private readonly IProductRepository _productRepository;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<ProductBatchService> _logger;

        public ProductBatchService(
            IProductBatchRepository batchRepository,
            IProductRepository productRepository,
            IUserRepository userRepository,
            ILogger<ProductBatchService> logger)
        {
            _batchRepository = batchRepository;
            _productRepository = productRepository;
            _userRepository = userRepository;
            _logger = logger;
        }

        public async Task<ProductBatchDto> GetBatchByIdAsync(int batchId)
        {
            var batch = await _batchRepository.GetByIdAsync(batchId);
            if (batch == null)
                throw new NotFoundException($"Batch with ID {batchId} not found");

            return MapToBatchDto(batch);
        }

        public async Task<List<ProductBatchDto>> GetBatchesByProductIdAsync(int productId)
        {
            if (!await _productRepository.ExistsAsync(productId))
                throw new NotFoundException($"Product with ID {productId} not found");

            var batches = await _batchRepository.GetBatchesByProductIdAsync(productId);
            return batches.Select(MapToBatchDto).ToList();
        }

        public async Task<List<ProductBatchDto>> GetFarmerBatchesAsync(int farmerId)
        {
            var farmer = await _userRepository.GetByIdAsync(farmerId);
            if (farmer == null || farmer.Role != "Farmer")
                throw new NotFoundException($"Farmer with ID {farmerId} not found");

            var batches = await _batchRepository.GetBatchesByFarmerIdAsync(farmerId);
            return batches.Select(MapToBatchDto).ToList();
        }

        public async Task<ProductBatchDto> CreateBatchAsync(CreateProductBatchDto createDto, int farmerId)
        {
            // Проверка существования продукта
            var product = await _productRepository.GetByIdAsync(createDto.ProductId);
            if (product == null)
                throw new NotFoundException($"Product with ID {createDto.ProductId} not found");

            // Проверка прав доступа
            if (product.FarmerId != farmerId)
                throw new UnauthorizedAccessException("You can only create batches for your own products");

            // Проверка уникальности номера партии
            if (await _batchRepository.BatchNumberExistsAsync(createDto.BatchNumber))
                throw new BusinessException($"Batch with number '{createDto.BatchNumber}' already exists");

            // Проверка дат
            if (createDto.HarvestDate >= createDto.ExpiryDate)
                throw new BusinessException("Harvest date must be before expiry date");

            if (createDto.ExpiryDate <= DateTime.UtcNow)
                throw new BusinessException("Expiry date must be in the future");

            // Проверка количества
            if (createDto.InitialQuantity <= 0)
                throw new BusinessException("Initial quantity must be greater than 0");

            if (createDto.CurrentQuantity <= 0)
                throw new BusinessException("Current quantity must be greater than 0");

            if (createDto.CurrentQuantity > createDto.InitialQuantity)
                throw new BusinessException("Current quantity cannot exceed initial quantity");

            var batch = new ProductBatch
            {
                ProductId = createDto.ProductId,
                BatchNumber = createDto.BatchNumber,
                HarvestDate = createDto.HarvestDate,
                ExpiryDate = createDto.ExpiryDate,
                InitialQuantity = createDto.InitialQuantity,
                CurrentQuantity = createDto.CurrentQuantity,
                QualityGrade = createDto.QualityGrade,
                StorageLocation = createDto.StorageLocation,
                PurchasePrice = createDto.PurchasePrice,
                SupplierInfo = createDto.SupplierInfo,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var createdBatch = await _batchRepository.AddAsync(batch);

            // Обновляем общий запас продукта
            product.CurrentStock += createDto.CurrentQuantity;
            await _productRepository.UpdateAsync(product);

            _logger.LogInformation("Batch created: {BatchId}, Product: {ProductId}", createdBatch.BatchId, createDto.ProductId);

            return MapToBatchDto(createdBatch);
        }

        public async Task<ProductBatchDto> UpdateBatchAsync(int batchId, UpdateProductBatchDto updateDto, int farmerId)
        {
            var batch = await _batchRepository.GetByIdAsync(batchId);
            if (batch == null)
                throw new NotFoundException($"Batch with ID {batchId} not found");

            // Проверка прав доступа
            if (batch.Product.FarmerId != farmerId)
                throw new UnauthorizedAccessException("You can only update your own batches");

            // Проверка уникальности номера партии
            if (!string.IsNullOrEmpty(updateDto.BatchNumber) &&
                updateDto.BatchNumber != batch.BatchNumber &&
                await _batchRepository.BatchNumberExistsAsync(updateDto.BatchNumber, batchId))
            {
                throw new BusinessException($"Batch with number '{updateDto.BatchNumber}' already exists");
            }

            // Сохраняем старое количество для обновления запаса продукта
            var oldQuantity = batch.CurrentQuantity;

            // Обновление полей
            if (!string.IsNullOrEmpty(updateDto.BatchNumber))
                batch.BatchNumber = updateDto.BatchNumber;

            if (updateDto.HarvestDate.HasValue)
                batch.HarvestDate = updateDto.HarvestDate.Value;

            if (updateDto.ExpiryDate.HasValue)
                batch.ExpiryDate = updateDto.ExpiryDate.Value;

            if (updateDto.CurrentQuantity.HasValue)
            {
                if (updateDto.CurrentQuantity.Value < 0)
                    throw new BusinessException("Current quantity cannot be negative");

                if (updateDto.CurrentQuantity.Value > batch.InitialQuantity)
                    throw new BusinessException("Current quantity cannot exceed initial quantity");

                batch.CurrentQuantity = updateDto.CurrentQuantity.Value;
            }

            if (!string.IsNullOrEmpty(updateDto.QualityGrade))
                batch.QualityGrade = updateDto.QualityGrade;

            if (!string.IsNullOrEmpty(updateDto.StorageLocation))
                batch.StorageLocation = updateDto.StorageLocation;

            if (updateDto.PurchasePrice.HasValue)
                batch.PurchasePrice = updateDto.PurchasePrice;

            if (updateDto.SupplierInfo != null)
                batch.SupplierInfo = updateDto.SupplierInfo;

            batch.UpdatedAt = DateTime.UtcNow;

            var updatedBatch = await _batchRepository.UpdateAsync(batch);

            // Обновляем общий запас продукта если изменилось количество
            if (updateDto.CurrentQuantity.HasValue && updateDto.CurrentQuantity.Value != oldQuantity)
            {
                var product = await _productRepository.GetByIdAsync(batch.ProductId);
                if (product != null)
                {
                    product.CurrentStock += (updateDto.CurrentQuantity.Value - oldQuantity);
                    await _productRepository.UpdateAsync(product);
                }
            }

            _logger.LogInformation("Batch updated: {BatchId}", batchId);

            return MapToBatchDto(updatedBatch);
        }

        public async Task<bool> DeleteBatchAsync(int batchId, int farmerId)
        {
            var batch = await _batchRepository.GetByIdAsync(batchId);
            if (batch == null)
                throw new NotFoundException($"Batch with ID {batchId} not found");

            // Проверка прав доступа
            if (batch.Product.FarmerId != farmerId)
                throw new UnauthorizedAccessException("You can only delete your own batches");

            // Проверка возможности удаления
            if (!await CanDeleteBatchAsync(batchId))
                throw new BusinessException("Cannot delete batch with existing orders or non-zero quantity");

            var result = await _batchRepository.DeleteAsync(batchId);

            if (result)
            {
                // Обновляем общий запас продукта
                var product = await _productRepository.GetByIdAsync(batch.ProductId);
                if (product != null)
                {
                    product.CurrentStock -= batch.CurrentQuantity;
                    await _productRepository.UpdateAsync(product);
                }

                _logger.LogInformation("Batch deleted: {BatchId}", batchId);
            }

            return result;
        }

        public async Task<List<ProductBatchDto>> GetExpiringBatchesAsync(int daysThreshold, int farmerId)
        {
            var batches = await _batchRepository.GetExpiringBatchesAsync(daysThreshold);
            return batches.Where(b => b.Product.FarmerId == farmerId)
                         .Select(MapToBatchDto).ToList();
        }

        public async Task<List<ProductBatchDto>> GetExpiredBatchesAsync(int farmerId)
        {
            var batches = await _batchRepository.GetExpiredBatchesAsync();
            return batches.Where(b => b.Product.FarmerId == farmerId)
                         .Select(MapToBatchDto).ToList();
        }

        public async Task<List<ProductBatchDto>> GetLowStockBatchesAsync(int threshold, int farmerId)
        {
            var batches = await _batchRepository.GetLowStockBatchesAsync(threshold);
            return batches.Where(b => b.Product.FarmerId == farmerId)
                         .Select(MapToBatchDto).ToList();
        }

        public async Task<BatchExpiryReportDto> GetExpiryReportAsync(int farmerId)
        {
            var farmer = await _userRepository.GetByIdAsync(farmerId);
            if (farmer == null || farmer.Role != "Farmer")
                throw new NotFoundException($"Farmer with ID {farmerId} not found");

            return await _batchRepository.GetExpiryReportAsync(farmerId);
        }

        public async Task<bool> AllocateFromBatchAsync(int batchId, int quantity, int farmerId)
        {
            var batch = await _batchRepository.GetByIdAsync(batchId);
            if (batch == null)
                throw new NotFoundException($"Batch with ID {batchId} not found");

            if (batch.Product.FarmerId != farmerId)
                throw new UnauthorizedAccessException("You can only allocate from your own batches");

            if (quantity <= 0)
                throw new BusinessException("Quantity must be greater than 0");

            if (batch.CurrentQuantity < quantity)
                throw new BusinessException("Insufficient quantity in batch");

            if (batch.ExpiryDate < DateTime.UtcNow)
                throw new BusinessException("Cannot allocate from expired batch");

            batch.CurrentQuantity -= quantity;
            await _batchRepository.UpdateAsync(batch);

            // Обновляем общий запас продукта
            var product = await _productRepository.GetByIdAsync(batch.ProductId);
            if (product != null)
            {
                product.CurrentStock -= quantity;
                await _productRepository.UpdateAsync(product);
            }

            _logger.LogInformation("Allocated {Quantity} from batch {BatchId}", quantity, batchId);
            return true;
        }

        public async Task<bool> ReturnToBatchAsync(int batchId, int quantity, int farmerId)
        {
            var batch = await _batchRepository.GetByIdAsync(batchId);
            if (batch == null)
                throw new NotFoundException($"Batch with ID {batchId} not found");

            if (batch.Product.FarmerId != farmerId)
                throw new UnauthorizedAccessException("You can only return to your own batches");

            if (quantity <= 0)
                throw new BusinessException("Quantity must be greater than 0");

            if (batch.CurrentQuantity + quantity > batch.InitialQuantity)
                throw new BusinessException("Cannot exceed initial batch quantity");

            batch.CurrentQuantity += quantity;
            await _batchRepository.UpdateAsync(batch);

            // Обновляем общий запас продукта
            var product = await _productRepository.GetByIdAsync(batch.ProductId);
            if (product != null)
            {
                product.CurrentStock += quantity;
                await _productRepository.UpdateAsync(product);
            }

            _logger.LogInformation("Returned {Quantity} to batch {BatchId}", quantity, batchId);
            return true;
        }

        public async Task<bool> TransferBetweenBatchesAsync(int fromBatchId, int toBatchId, int quantity, int farmerId)
        {
            if (fromBatchId == toBatchId)
                throw new BusinessException("Cannot transfer to the same batch");

            var fromBatch = await _batchRepository.GetByIdAsync(fromBatchId);
            var toBatch = await _batchRepository.GetByIdAsync(toBatchId);

            if (fromBatch == null || toBatch == null)
                throw new NotFoundException("One or both batches not found");

            if (fromBatch.Product.FarmerId != farmerId || toBatch.Product.FarmerId != farmerId)
                throw new UnauthorizedAccessException("You can only transfer between your own batches");

            if (fromBatch.ProductId != toBatch.ProductId)
                throw new BusinessException("Can only transfer between batches of the same product");

            if (quantity <= 0)
                throw new BusinessException("Quantity must be greater than 0");

            if (fromBatch.CurrentQuantity < quantity)
                throw new BusinessException("Insufficient quantity in source batch");

            if (fromBatch.ExpiryDate < DateTime.UtcNow)
                throw new BusinessException("Cannot transfer from expired batch");

            // Выполняем transfer
            fromBatch.CurrentQuantity -= quantity;
            toBatch.CurrentQuantity += quantity;

            await _batchRepository.UpdateAsync(fromBatch);
            await _batchRepository.UpdateAsync(toBatch);

            _logger.LogInformation("Transferred {Quantity} from batch {FromBatchId} to {ToBatchId}",
                quantity, fromBatchId, toBatchId);
            return true;
        }

        public async Task<bool> CanDeleteBatchAsync(int batchId)
        {
            var batch = await _batchRepository.GetByIdAsync(batchId);
            if (batch == null) return false;

            // Нельзя удалить если есть связанные заказы
            if (batch.OrderItems != null && batch.OrderItems.Any())
                return false;

            // Нельзя удалить если есть остаток
            if (batch.CurrentQuantity > 0)
                return false;

            return true;
        }

        public async Task<bool> IsBatchAvailableAsync(int batchId)
        {
            var batch = await _batchRepository.GetByIdAsync(batchId);
            if (batch == null) return false;

            return batch.CurrentQuantity > 0 && batch.ExpiryDate > DateTime.UtcNow;
        }

        private ProductBatchDto MapToBatchDto(ProductBatch batch)
        {
            var daysUntilExpiry = (batch.ExpiryDate - DateTime.UtcNow).Days;
            var isLowStock = batch.CurrentQuantity <= (batch.InitialQuantity * 0.1m);

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