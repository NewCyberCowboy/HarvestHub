using HarvestHub.DTOs;

namespace HarvestHub.Services.Interfaces
{
    public interface IReviewService
    {
        Task<ReviewDto> GetReviewByIdAsync(int reviewId);
        Task<List<ReviewDto>> GetProductReviewsAsync(int productId);
        Task<List<ReviewDto>> GetCustomerReviewsAsync(int customerId);
        Task<ProductReviewsDto> GetProductReviewsSummaryAsync(int productId);
        Task<ReviewDto> CreateReviewAsync(CreateReviewDto createDto, int customerId);
        Task<ReviewDto> UpdateReviewAsync(int reviewId, UpdateReviewDto updateDto, int customerId);
        Task<bool> DeleteReviewAsync(int reviewId, int customerId);
        Task<bool> ApproveReviewAsync(int reviewId, int adminId);
        Task<bool> RejectReviewAsync(int reviewId, int adminId);
        Task<List<ReviewDto>> GetPendingReviewsAsync();
    }
}