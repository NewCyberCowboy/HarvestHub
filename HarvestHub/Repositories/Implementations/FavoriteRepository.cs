using HarvestHub.Models;
using HarvestHub.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HarvestHub.Repositories.Implementations
{
    public class FavoriteRepository : IFavoriteRepository
    {
        private readonly ApplicationDbContext _context;

        public FavoriteRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Favorite?> GetByIdAsync(int id)
        {
            return await _context.Favorites
                .Include(f => f.Product)
                    .ThenInclude(p => p.Category)
                .Include(f => f.User)
                .FirstOrDefaultAsync(f => f.FavoriteId == id);
        }

        public async Task<Favorite?> GetByUserAndProductAsync(int userId, int productId)
        {
            return await _context.Favorites
                .Include(f => f.Product)
                    .ThenInclude(p => p.Category)
                .Include(f => f.User)
                .FirstOrDefaultAsync(f => f.UserId == userId && f.ProductId == productId);
        }

        public async Task<IEnumerable<Favorite>> GetUserFavoritesAsync(int userId)
        {
            return await _context.Favorites
                .Where(f => f.UserId == userId)
                .Include(f => f.Product)
                    .ThenInclude(p => p.Category)
                .Include(f => f.Product)
                    .ThenInclude(p => p.Farmer)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<bool> ExistsAsync(int userId, int productId)
        {
            return await _context.Favorites
                .AnyAsync(f => f.UserId == userId && f.ProductId == productId);
        }

        public async Task<Favorite> AddAsync(Favorite entity)
        {
            _context.Favorites.Add(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var favorite = await GetByIdAsync(id);
            if (favorite == null) return false;

            _context.Favorites.Remove(favorite);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteByUserAndProductAsync(int userId, int productId)
        {
            var favorite = await GetByUserAndProductAsync(userId, productId);
            if (favorite == null) return false;

            _context.Favorites.Remove(favorite);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}










