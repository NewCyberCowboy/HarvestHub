using HarvestHub.DTOs;
using HarvestHub.Models;
using HarvestHub.Repositories.Interfaces;
using HarvestHub.Services.Interfaces;
using HarvestHub.Exceptions;

namespace HarvestHub.Services.Implementations
{
    public class ReviewService : IReviewService
    {
        private readonly IReviewRepository _reviewRepository;
        private readonly IProductRepository _productRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<ReviewService> _logger;

        public ReviewService(
            IReviewRepository reviewRepository,
            IProductRepository productRepository,
            IOrderRepository orderRepository,
            IUserRepository userRepository,
            ILogger<ReviewService> logger)
        {
            _reviewRepository = reviewRepository;
            _productRepository = productRepository;
            _orderRepository = orderRepository;
            _userRepository = userRepository;
            _logger = logger;
        }

        public async Task<ReviewDto> GetReviewByIdAsync(int reviewId)
        {
            var review = await _reviewRepository.GetByIdAsync(reviewId);
            if (review == null)
                throw new NotFoundException($"Review with ID {reviewId} not found");

            return MapToReviewDto(review);
        }

        public async Task<List<ReviewDto>> GetProductReviewsAsync(int productId)
        {
            if (!await _productRepository.ExistsAsync(productId))
                throw new NotFoundException($"Product with ID {productId} not found");

            var reviews = await _reviewRepository.GetReviewsByProductIdAsync(productId);
            return reviews.Select(MapToReviewDto).ToList();
        }

        public async Task<List<ReviewDto>> GetCustomerReviewsAsync(int customerId)
        {
            var customer = await _userRepository.GetByIdAsync(customerId);
            if (customer == null || customer.Role != "Customer")
                throw new NotFoundException($"Customer with ID {customerId} not found");

            var reviews = await _reviewRepository.GetReviewsByCustomerIdAsync(customerId);
            return reviews.Select(MapToReviewDto).ToList();
        }

        public async Task<ProductReviewsDto> GetProductReviewsSummaryAsync(int productId)
        {
            if (!await _productRepository.ExistsAsync(productId))
                throw new NotFoundException($"Product with ID {productId} not found");

            var averageRating = await _reviewRepository.GetProductAverageRatingAsync(productId);
            var reviewCount = await _reviewRepository.GetProductReviewCountAsync(productId);
            var reviews = await _reviewRepository.GetReviewsByProductIdAsync(productId);

            return new ProductReviewsDto
            {
                AverageRating = Math.Round(averageRating, 1),
                TotalReviews = reviewCount,
                Reviews = reviews.Select(MapToReviewDto).ToList()
            };
        }

        public async Task<ReviewDto> CreateReviewAsync(CreateReviewDto createDto, int customerId)
        {
            // Проверка существования продукта
            var product = await _productRepository.GetByIdAsync(createDto.ProductId);
            if (product == null)
                throw new NotFoundException($"Product with ID {createDto.ProductId} not found");

            // Проверка существования заказа
            var order = await _orderRepository.GetByIdAsync(createDto.OrderId);
            if (order == null)
                throw new NotFoundException($"Order with ID {createDto.OrderId} not found");

            // Проверка что заказ принадлежит пользователю
            if (order.CustomerId != customerId)
                throw new BusinessException("You can only review products from your own orders");

            // Проверка что заказ доставлен
            if (order.Status != "Delivered")
                throw new BusinessException("You can only review products from delivered orders");

            // Проверка что продукт есть в заказе
            var orderItem = order.OrderItems.FirstOrDefault(i => i.ProductId == createDto.ProductId);
            if (orderItem == null)
                throw new BusinessException("This product is not in the specified order");

            // Проверка что пользователь еще не оставлял отзыв на этот продукт
            if (await _reviewRepository.HasCustomerReviewedProductAsync(customerId, createDto.ProductId))
                throw new BusinessException("You have already reviewed this product");

            // Валидация рейтинга
            if (createDto.Rating < 1 || createDto.Rating > 5)
                throw new BusinessException("Rating must be between 1 and 5");

            var review = new Review
            {
                ProductId = createDto.ProductId,
                CustomerId = customerId,
                OrderId = createDto.OrderId,
                Rating = createDto.Rating,
                Comment = createDto.Comment,
                IsApproved = false, // Требует модерации
                CreatedAt = DateTime.UtcNow
            };

            var createdReview = await _reviewRepository.AddAsync(review);
            _logger.LogInformation("Review created: {ReviewId} for product {ProductId}", createdReview.ReviewId, createDto.ProductId);

            return MapToReviewDto(createdReview);
        }

        public async Task<ReviewDto> UpdateReviewAsync(int reviewId, UpdateReviewDto updateDto, int customerId)
        {
            var review = await _reviewRepository.GetByIdAsync(reviewId);
            if (review == null)
                throw new NotFoundException($"Review with ID {reviewId} not found");

            // Проверка прав доступа
            if (review.CustomerId != customerId)
                throw new UnauthorizedAccessException("You can only update your own reviews");

            // Валидация рейтинга
            if (updateDto.Rating < 1 || updateDto.Rating > 5)
                throw new BusinessException("Rating must be between 1 and 5");

            review.Rating = updateDto.Rating;
            review.Comment = updateDto.Comment;
            review.IsApproved = false; // Сбрасываем одобрение при редактировании

            var updatedReview = await _reviewRepository.UpdateAsync(review);
            _logger.LogInformation("Review updated: {ReviewId}", reviewId);

            return MapToReviewDto(updatedReview);
        }

        public async Task<bool> DeleteReviewAsync(int reviewId, int customerId)
        {
            var review = await _reviewRepository.GetByIdAsync(reviewId);
            if (review == null)
                throw new NotFoundException($"Review with ID {reviewId} not found");

            // Проверка прав доступа
            if (review.CustomerId != customerId)
                throw new UnauthorizedAccessException("You can only delete your own reviews");

            var result = await _reviewRepository.DeleteAsync(reviewId);
            if (result)
                _logger.LogInformation("Review deleted: {ReviewId}", reviewId);

            return result;
        }

        public async Task<bool> ApproveReviewAsync(int reviewId, int adminId)
        {
            var review = await _reviewRepository.GetByIdAsync(reviewId);
            if (review == null)
                throw new NotFoundException($"Review with ID {reviewId} not found");

            review.IsApproved = true;

            await _reviewRepository.UpdateAsync(review);
            _logger.LogInformation("Review approved: {ReviewId} by admin {AdminId}", reviewId, adminId);

            return true;
        }

        public async Task<bool> RejectReviewAsync(int reviewId, int adminId)
        {
            var review = await _reviewRepository.GetByIdAsync(reviewId);
            if (review == null)
                throw new NotFoundException($"Review with ID {reviewId} not found");

            var result = await _reviewRepository.DeleteAsync(reviewId);
            if (result)
                _logger.LogInformation("Review rejected and deleted: {ReviewId} by admin {AdminId}", reviewId, adminId);

            return result;
        }

        public async Task<List<ReviewDto>> GetPendingReviewsAsync()
        {
            var reviews = await _reviewRepository.GetPendingReviewsAsync();
            return reviews.Select(MapToReviewDto).ToList();
        }

        private ReviewDto MapToReviewDto(Review review)
        {
            string customerFullName = "Anonymous";

            if (review.Customer?.Profile != null)
            {
                var firstName = review.Customer.Profile.FirstName ?? "";
                var lastName = review.Customer.Profile.LastName ?? "";
                customerFullName = $"{firstName} {lastName}".Trim();
                if (string.IsNullOrEmpty(customerFullName))
                    customerFullName = "Anonymous";
            }

            return new ReviewDto
            {
                ReviewId = review.ReviewId,
                ProductId = review.ProductId,
                ProductName = review.Product?.Name ?? string.Empty,
                CustomerId = review.CustomerId,
                CustomerName = customerFullName,
                OrderId = review.OrderId,
                Rating = review.Rating,
                Comment = review.Comment,
                IsApproved = review.IsApproved,
                CreatedAt = review.CreatedAt
            };
        }
    }
}