using HarvestHub.Models;

namespace HarvestHub.Repositories.Interfaces
{
    public interface IReviewRepository : IRepository<Review>
    {
        Task<List<Review>> GetReviewsByProductIdAsync(int productId);
        Task<List<Review>> GetReviewsByCustomerIdAsync(int customerId);
        Task<List<Review>> GetPendingReviewsAsync();
        Task<bool> HasCustomerReviewedProductAsync(int customerId, int productId);
        Task<bool> HasCustomerOrderedProductAsync(int customerId, int productId);
        Task<double> GetProductAverageRatingAsync(int productId);
        Task<int> GetProductReviewCountAsync(int productId);
    }
}