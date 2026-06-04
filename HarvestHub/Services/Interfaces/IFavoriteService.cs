using HarvestHub.DTOs;

namespace HarvestHub.Services.Interfaces
{
    public interface IFavoriteService
    {
        Task<List<FavoriteDto>> GetUserFavoritesAsync(int userId);
        Task<FavoriteDto> AddFavoriteAsync(int productId, int userId);
        Task<bool> RemoveFavoriteAsync(int productId, int userId);
        Task<bool> IsFavoriteAsync(int productId, int userId);
    }
}










