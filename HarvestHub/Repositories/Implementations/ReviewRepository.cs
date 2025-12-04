using HarvestHub.Models;
using HarvestHub.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HarvestHub.Repositories.Implementations
{
    public class ReviewRepository : IReviewRepository
    {
        private readonly ApplicationDbContext _context;

        public ReviewRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Review> GetByIdAsync(int id)
        {
            return await _context.Reviews
                .Include(r => r.Product)
                .Include(r => r.Customer)
                    .ThenInclude(c => c.Profile)
                .Include(r => r.Order)
                .FirstOrDefaultAsync(r => r.ReviewId == id);
        }

        public async Task<IEnumerable<Review>> GetAllAsync()
        {
            return await _context.Reviews
                .Include(r => r.Product)
                .Include(r => r.Customer)
                .ToListAsync();
        }

        public async Task<IEnumerable<Review>> FindAsync(System.Linq.Expressions.Expression<Func<Review, bool>> predicate)
        {
            return await _context.Reviews
                .Include(r => r.Product)
                .Include(r => r.Customer)
                .Where(predicate)
                .ToListAsync();
        }

        public async Task<Review> AddAsync(Review entity)
        {
            _context.Reviews.Add(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<Review> UpdateAsync(Review entity)
        {
            _context.Reviews.Update(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var review = await GetByIdAsync(id);
            if (review == null) return false;

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _context.Reviews.AnyAsync(r => r.ReviewId == id);
        }

        public async Task<List<Review>> GetReviewsByProductIdAsync(int productId)
        {
            return await _context.Reviews
                .Where(r => r.ProductId == productId && r.IsApproved)
                .Include(r => r.Customer)
                    .ThenInclude(c => c.Profile)
                .Include(r => r.Order)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Review>> GetReviewsByCustomerIdAsync(int customerId)
        {
            return await _context.Reviews
                .Where(r => r.CustomerId == customerId)
                .Include(r => r.Product)
                .Include(r => r.Order)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Review>> GetPendingReviewsAsync()
        {
            return await _context.Reviews
                .Where(r => !r.IsApproved)
                .Include(r => r.Product)
                .Include(r => r.Customer)
                    .ThenInclude(c => c.Profile)
                .OrderBy(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<bool> HasCustomerReviewedProductAsync(int customerId, int productId)
        {
            return await _context.Reviews
                .AnyAsync(r => r.CustomerId == customerId && r.ProductId == productId);
        }

        public async Task<bool> HasCustomerOrderedProductAsync(int customerId, int productId)
        {
            return await _context.OrderItems
                .AnyAsync(oi => oi.Order.CustomerId == customerId &&
                               oi.ProductId == productId &&
                               oi.Order.Status == "Delivered");
        }

        public async Task<double> GetProductAverageRatingAsync(int productId)
        {
            var reviews = await _context.Reviews
                .Where(r => r.ProductId == productId && r.IsApproved)
                .ToListAsync();

            return reviews.Any() ? reviews.Average(r => r.Rating) : 0;
        }

        public async Task<int> GetProductReviewCountAsync(int productId)
        {
            return await _context.Reviews
                .CountAsync(r => r.ProductId == productId && r.IsApproved);
        }
    }
}