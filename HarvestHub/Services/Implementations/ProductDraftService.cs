using HarvestHub.DTOs;
using HarvestHub.Exceptions;
using HarvestHub.Models;
using HarvestHub.Repositories.Interfaces;
using HarvestHub.Services.Interfaces;

namespace HarvestHub.Services.Implementations
{
    public class ProductDraftService : IProductDraftService
    {
        private readonly IProductDraftRepository _draftRepository;
        private readonly IWebHostEnvironment _environment;

        public ProductDraftService(IProductDraftRepository draftRepository, IWebHostEnvironment environment)
        {
            _draftRepository = draftRepository;
            _environment = environment;
        }

        public async Task<ProductDraftDto?> GetByIdAsync(int draftId)
        {
            var draft = await _draftRepository.GetByIdAsync(draftId);
            return draft == null ? null : MapToDto(draft);
        }

        public async Task<IEnumerable<ProductDraftDto>> GetByOwnerAsync(int ownerUserId)
        {
            var drafts = await _draftRepository.GetByOwnerAsync(ownerUserId);
            return drafts.Select(MapToDto);
        }

        public async Task<ProductDraftDto> CreateAsync(int ownerUserId, CreateProductDraftDto dto)
        {
            // Generate a unique LocalDraftId if not provided
            string localDraftId = dto.LocalDraftId ?? string.Empty;
            if (string.IsNullOrEmpty(localDraftId))
            {
                localDraftId = Guid.NewGuid().ToString();
            }

            // Check if draft with same LocalDraftId already exists
            var existing = await _draftRepository.GetByLocalIdAsync(ownerUserId, localDraftId);
            
            if (existing != null)
            {
                // Update existing draft instead of creating new one
                var updateDto = new UpdateProductDraftDto
                {
                    Name = dto.Name,
                    Description = dto.Description,
                    BasePrice = dto.BasePrice,
                    DiscountPrice = dto.DiscountPrice,
                    CurrentStock = dto.CurrentStock,
                    Unit = dto.Unit,
                    CategoryId = dto.CategoryId,
                    StorageConditions = dto.StorageConditions,
                    ShelfLife = dto.ShelfLife,
                    ImageBase64 = dto.ImageBase64,
                    ImageUrl = dto.ImageUrl
                };
                return await UpdateAsync(existing.DraftId, updateDto);
            }

            var draft = new ProductDraft
            {
                OwnerUserId = ownerUserId,
                DeviceId = dto.DeviceId ?? string.Empty,
                LocalDraftId = localDraftId,
                Name = dto.Name,
                Description = dto.Description,
                BasePrice = dto.BasePrice,
                DiscountPrice = dto.DiscountPrice,
                CurrentStock = dto.CurrentStock,
                Unit = dto.Unit,
                CategoryId = dto.CategoryId,
                StorageConditions = dto.StorageConditions,
                ShelfLife = dto.ShelfLife,
                ImageBase64 = dto.ImageBase64,
                ImageUrl = dto.ImageUrl,
                IsImageUploaded = !string.IsNullOrEmpty(dto.ImageUrl) && dto.ImageUrl.StartsWith("http"),
                IsSynced = false
            };

            // Если есть изображение в Base64, сохраняем его как файл
            if (!string.IsNullOrEmpty(dto.ImageBase64))
            {
                draft.ImageUrl = await SaveImageAsync(dto.ImageBase64, ownerUserId);
                draft.IsImageUploaded = true;
            }

            var created = await _draftRepository.CreateAsync(draft);
            return MapToDto(created);
        }

        public async Task<ProductDraftDto> UpdateAsync(int draftId, UpdateProductDraftDto dto)
        {
            var existing = await _draftRepository.GetByIdAsync(draftId);
            if (existing == null)
                throw new NotFoundException($"Черновик с ID {draftId} не найден");

            if (dto.Name != null) existing.Name = dto.Name;
            if (dto.Description != null) existing.Description = dto.Description;
            if (dto.BasePrice.HasValue) existing.BasePrice = dto.BasePrice.Value;
            if (dto.DiscountPrice.HasValue) existing.DiscountPrice = dto.DiscountPrice.Value;
            if (dto.CurrentStock.HasValue) existing.CurrentStock = dto.CurrentStock.Value;
            if (dto.Unit != null) existing.Unit = dto.Unit;
            if (dto.CategoryId.HasValue) existing.CategoryId = dto.CategoryId.Value;
            if (dto.StorageConditions != null) existing.StorageConditions = dto.StorageConditions;
            if (dto.ShelfLife != null) existing.ShelfLife = dto.ShelfLife;
            if (dto.IsImageUploaded.HasValue) existing.IsImageUploaded = dto.IsImageUploaded.Value;

            // Обновляем изображение если пришло новое
            if (dto.ImageBase64 != null)
            {
                if (!string.IsNullOrEmpty(dto.ImageBase64))
                {
                    existing.ImageUrl = await SaveImageAsync(dto.ImageBase64, existing.OwnerUserId);
                    existing.IsImageUploaded = true;
                }
                else
                {
                    existing.ImageBase64 = null;
                    existing.ImageUrl = null;
                    existing.IsImageUploaded = false;
                }
            }

            // Handle ImageUrl from DTO (for mobile app uploads)
            if (!string.IsNullOrEmpty(dto.ImageUrl))
            {
                existing.ImageUrl = dto.ImageUrl;
                existing.IsImageUploaded = true;
            }

            var updated = await _draftRepository.UpdateAsync(existing);
            return MapToDto(updated);
        }

        public async Task DeleteAsync(int draftId)
        {
            await _draftRepository.DeleteAsync(draftId);
        }

        public async Task<SyncDraftsResponseDto> SyncDraftsAsync(int ownerUserId, SyncDraftsRequestDto request)
        {
            var syncedDrafts = new List<ProductDraftDto>();
            var failedLocalIds = new List<string>();

            foreach (var draftDto in request.Drafts)
            {
                try
                {
                    // Проверяем существует ли черновик
                    var existing = await _draftRepository.GetByLocalIdAsync(ownerUserId, draftDto.LocalDraftId ?? string.Empty);
                    
                    ProductDraftDto result;
                    if (existing != null)
                    {
                        // Обновляем существующий
                        var updateDto = new UpdateProductDraftDto
                        {
                            Name = draftDto.Name,
                            Description = draftDto.Description,
                            BasePrice = draftDto.BasePrice,
                            DiscountPrice = draftDto.DiscountPrice,
                            CurrentStock = draftDto.CurrentStock,
                            Unit = draftDto.Unit,
                            CategoryId = draftDto.CategoryId,
                            StorageConditions = draftDto.StorageConditions,
                            ShelfLife = draftDto.ShelfLife,
                            ImageBase64 = draftDto.ImageBase64
                        };
                        result = await UpdateAsync(existing.DraftId, updateDto);
                    }
                    else
                    {
                        // Создаем новый
                        result = await CreateAsync(ownerUserId, draftDto);
                    }
                    
                    syncedDrafts.Add(result);
                }
                catch (Exception ex)
                {
                    failedLocalIds.Add(draftDto.LocalDraftId ?? "unknown");
                }
            }

            return new SyncDraftsResponseDto
            {
                SyncedDrafts = syncedDrafts,
                FailedLocalIds = failedLocalIds
            };
        }

        private async Task<string?> SaveImageAsync(string base64Image, int userId)
        {
            if (string.IsNullOrEmpty(base64Image))
                return null;

            try
            {
                var bytes = Convert.FromBase64String(base64Image);
                var fileName = $"draft_{userId}_{DateTime.UtcNow.Ticks}.jpg";
                var uploadsFolder = Path.Combine(_environment.WebRootPath ?? "wwwroot", "uploads", "drafts");
                
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                var filePath = Path.Combine(uploadsFolder, fileName);
                await File.WriteAllBytesAsync(filePath, bytes);

                return $"/uploads/drafts/{fileName}";
            }
            catch
            {
                return null;
            }
        }

        private ProductDraftDto MapToDto(ProductDraft draft)
        {
            return new ProductDraftDto
            {
                DraftId = draft.DraftId,
                OwnerUserId = draft.OwnerUserId,
                DeviceId = draft.DeviceId,
                LocalDraftId = draft.LocalDraftId,
                Name = draft.Name,
                Description = draft.Description,
                BasePrice = draft.BasePrice,
                DiscountPrice = draft.DiscountPrice,
                CurrentStock = draft.CurrentStock,
                Unit = draft.Unit,
                CategoryId = draft.CategoryId,
                StorageConditions = draft.StorageConditions,
                ShelfLife = draft.ShelfLife,
                ImageUrl = draft.ImageUrl,
                IsImageUploaded = draft.IsImageUploaded,
                CreatedAt = draft.CreatedAt,
                UpdatedAt = draft.UpdatedAt,
                IsSynced = true
            };
        }
    }
}
