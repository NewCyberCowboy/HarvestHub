using HarvestHub.DTOs;

namespace HarvestHub.Services.Interfaces
{
    public interface IProductDraftService
    {
        Task<ProductDraftDto?> GetByIdAsync(int draftId);
        Task<IEnumerable<ProductDraftDto>> GetByOwnerAsync(int ownerUserId);
        Task<ProductDraftDto> CreateAsync(int ownerUserId, CreateProductDraftDto dto);
        Task<ProductDraftDto> UpdateAsync(int draftId, UpdateProductDraftDto dto);
        Task DeleteAsync(int draftId);
        Task<SyncDraftsResponseDto> SyncDraftsAsync(int ownerUserId, SyncDraftsRequestDto request);
    }
}
