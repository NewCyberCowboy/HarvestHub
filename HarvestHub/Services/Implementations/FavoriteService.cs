using HarvestHub.DTOs;
using HarvestHub.Models;
using HarvestHub.Repositories.Interfaces;
using HarvestHub.Services.Interfaces;
using HarvestHub.Exceptions;
using Microsoft.Extensions.Logging;

namespace HarvestHub.Services.Implementations
{
    public class FavoriteService : IFavoriteService
    {
        private readonly IFavoriteRepository _favoriteRepository;
        private readonly IProductRepository _productRepository;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<FavoriteService> _logger;

        public FavoriteService(
            IFavoriteRepository favoriteRepository,
            IProductRepository productRepository,
            IUserRepository userRepository,
            ILogger<FavoriteService> logger)
        {
            _favoriteRepository = favoriteRepository;
            _productRepository = productRepository;
            _userRepository = userRepository;
            _logger = logger;
        }

        public async Task<List<FavoriteDto>> GetUserFavoritesAsync(int userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new NotFoundException($"User with ID {userId} not found");

            var favorites = await _favoriteRepository.GetUserFavoritesAsync(userId);
            return favorites.Select(MapToFavoriteDto).ToList();
        }

        public async Task<FavoriteDto> AddFavoriteAsync(int productId, int userId)
        {
            // Проверка существования пользователя
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new NotFoundException($"User with ID {userId} not found");

            // Проверка существования продукта
            var product = await _productRepository.GetByIdAsync(productId);
            if (product == null)
                throw new NotFoundException($"Product with ID {productId} not found");

            // Проверка, не добавлен ли уже продукт в избранное
            if (await _favoriteRepository.ExistsAsync(userId, productId))
                throw new BusinessException("Product is already in favorites");

            var favorite = new Favorite
            {
                UserId = userId,
                ProductId = productId,
                CreatedAt = DateTime.UtcNow
            };

            var createdFavorite = await _favoriteRepository.AddAsync(favorite);
            _logger.LogInformation("Favorite added: UserId={UserId}, ProductId={ProductId}", userId, productId);

            return MapToFavoriteDto(createdFavorite);
        }

        public async Task<bool> RemoveFavoriteAsync(int productId, int userId)
        {
            var result = await _favoriteRepository.DeleteByUserAndProductAsync(userId, productId);
            if (result)
                _logger.LogInformation("Favorite removed: UserId={UserId}, ProductId={ProductId}", userId, productId);

            return result;
        }

        public async Task<bool> IsFavoriteAsync(int productId, int userId)
        {
            return await _favoriteRepository.ExistsAsync(userId, productId);
        }

        private FavoriteDto MapToFavoriteDto(Favorite favorite)
        {
            return new FavoriteDto
            {
                FavoriteId = favorite.FavoriteId,
                UserId = favorite.UserId,
                ProductId = favorite.ProductId,
                ProductName = favorite.Product?.Name ?? string.Empty,
                ProductPrice = favorite.Product?.BasePrice ?? 0,
                ProductDescription = favorite.Product?.Description,
                ProductStatus = favorite.Product?.Status ?? string.Empty,
                ProductStock = favorite.Product?.CurrentStock ?? 0,
                CreatedAt = favorite.CreatedAt
            };
        }
    }
}










