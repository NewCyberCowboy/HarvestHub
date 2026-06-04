using HarvestHub.Models;
using HarvestHub.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HarvestHub.Repositories.Implementations
{
    public class ProductDraftRepository : IProductDraftRepository
    {
        private readonly ApplicationDbContext _context;

        public ProductDraftRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ProductDraft?> GetByIdAsync(int draftId)
        {
            return await _context.ProductDrafts
                .AsNoTracking()
                .Include(pd => pd.Category)
                .FirstOrDefaultAsync(pd => pd.DraftId == draftId);
        }

        public async Task<ProductDraft?> GetByLocalIdAsync(int ownerUserId, string localDraftId)
        {
            return await _context.ProductDrafts
                .AsNoTracking()
                .Include(pd => pd.Category)
                .FirstOrDefaultAsync(pd => pd.OwnerUserId == ownerUserId && pd.LocalDraftId == localDraftId);
        }

        public async Task<IEnumerable<ProductDraft>> GetByOwnerAsync(int ownerUserId)
        {
            return await _context.ProductDrafts
                .AsNoTracking()
                .Include(pd => pd.Category)
                .Where(pd => pd.OwnerUserId == ownerUserId)
                .OrderByDescending(pd => pd.UpdatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<ProductDraft>> GetByDeviceAsync(string deviceId)
        {
            return await _context.ProductDrafts
                .AsNoTracking()
                .Include(pd => pd.Category)
                .Where(pd => pd.DeviceId == deviceId)
                .OrderByDescending(pd => pd.UpdatedAt)
                .ToListAsync();
        }

        public async Task<ProductDraft> CreateAsync(ProductDraft draft)
        {
            draft.CreatedAt = DateTime.UtcNow;
            draft.UpdatedAt = DateTime.UtcNow;
            _context.ProductDrafts.Add(draft);
            await _context.SaveChangesAsync();
            return draft;
        }

        public async Task<ProductDraft> UpdateAsync(ProductDraft draft)
        {
            draft.UpdatedAt = DateTime.UtcNow;
            _context.ProductDrafts.Update(draft);
            await _context.SaveChangesAsync();
            return draft;
        }

        public async Task DeleteAsync(int draftId)
        {
            var draft = await _context.ProductDrafts.FindAsync(draftId);
            if (draft != null)
            {
                _context.ProductDrafts.Remove(draft);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> ExistsAsync(int ownerUserId, string localDraftId)
        {
            return await _context.ProductDrafts
                .AnyAsync(pd => pd.OwnerUserId == ownerUserId && pd.LocalDraftId == localDraftId);
        }
    }
}
