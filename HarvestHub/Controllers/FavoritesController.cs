using HarvestHub.Common;
using HarvestHub.DTOs;
using HarvestHub.Exceptions;
using HarvestHub.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HarvestHub.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FavoritesController : ControllerBase
    {
        private readonly IFavoriteService _favoriteService;
        private readonly ILogger<FavoritesController> _logger;

        public FavoritesController(IFavoriteService favoriteService, ILogger<FavoritesController> logger)
        {
            _favoriteService = favoriteService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<FavoriteDto>>>> GetMyFavorites()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var favorites = await _favoriteService.GetUserFavoritesAsync(userId);
                return Ok(ApiResponse<List<FavoriteDto>>.SuccessResult(favorites));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving favorites");
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<FavoriteDto>>> AddFavorite([FromBody] AddFavoriteDto addDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ApiResponse<string>.ErrorResult("Invalid model state"));

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var favorite = await _favoriteService.AddFavoriteAsync(addDto.ProductId, userId);

                return Ok(ApiResponse<FavoriteDto>.SuccessResult(favorite, "Product added to favorites"));
            }
            catch (NotFoundException ex)
            {
                return NotFound(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (BusinessException ex)
            {
                return BadRequest(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding favorite");
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpDelete("{productId}")]
        public async Task<ActionResult<ApiResponse<bool>>> RemoveFavorite(int productId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var result = await _favoriteService.RemoveFavoriteAsync(productId, userId);

                if (!result)
                    return NotFound(ApiResponse<string>.ErrorResult("Favorite not found"));

                return Ok(ApiResponse<bool>.SuccessResult(result, "Product removed from favorites"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing favorite");
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpGet("check/{productId}")]
        public async Task<ActionResult<ApiResponse<bool>>> CheckFavorite(int productId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var isFavorite = await _favoriteService.IsFavoriteAsync(productId, userId);
                return Ok(ApiResponse<bool>.SuccessResult(isFavorite));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking favorite");
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }
    }
}

