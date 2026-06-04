using HarvestHub.DTOs;
using HarvestHub.Models;

namespace HarvestHub.Repositories.Interfaces
{
    public interface IProductDraftRepository
    {
        Task<ProductDraft?> GetByIdAsync(int draftId);
        Task<ProductDraft?> GetByLocalIdAsync(int ownerUserId, string localDraftId);
        Task<IEnumerable<ProductDraft>> GetByOwnerAsync(int ownerUserId);
        Task<IEnumerable<ProductDraft>> GetByDeviceAsync(string deviceId);
        Task<ProductDraft> CreateAsync(ProductDraft draft);
        Task<ProductDraft> UpdateAsync(ProductDraft draft);
        Task DeleteAsync(int draftId);
        Task<bool> ExistsAsync(int ownerUserId, string localDraftId);
    }
}
