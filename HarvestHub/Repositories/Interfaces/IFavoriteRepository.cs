using HarvestHub.Models;

namespace HarvestHub.Repositories.Interfaces
{
    public interface IFavoriteRepository
    {
        Task<Favorite?> GetByIdAsync(int id);
        Task<Favorite?> GetByUserAndProductAsync(int userId, int productId);
        Task<IEnumerable<Favorite>> GetUserFavoritesAsync(int userId);
        Task<bool> ExistsAsync(int userId, int productId);
        Task<Favorite> AddAsync(Favorite entity);
        Task<bool> DeleteAsync(int id);
        Task<bool> DeleteByUserAndProductAsync(int userId, int productId);
    }
}










