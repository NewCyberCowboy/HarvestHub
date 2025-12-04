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
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;
        private readonly ILogger<ReviewsController> _logger;

        public ReviewsController(IReviewService reviewService, ILogger<ReviewsController> logger)
        {
            _reviewService = reviewService;
            _logger = logger;
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<ReviewDto>>> GetReview(int id)
        {
            try
            {
                var review = await _reviewService.GetReviewByIdAsync(id);
                return Ok(ApiResponse<ReviewDto>.SuccessResult(review));
            }
            catch (NotFoundException ex)
            {
                return NotFound(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving review with ID {ReviewId}", id);
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpGet("product/{productId}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<List<ReviewDto>>>> GetProductReviews(int productId)
        {
            try
            {
                var reviews = await _reviewService.GetProductReviewsAsync(productId);
                return Ok(ApiResponse<List<ReviewDto>>.SuccessResult(reviews));
            }
            catch (NotFoundException ex)
            {
                return NotFound(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving reviews for product {ProductId}", productId);
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpGet("product/{productId}/summary")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<ProductReviewsDto>>> GetProductReviewsSummary(int productId)
        {
            try
            {
                var summary = await _reviewService.GetProductReviewsSummaryAsync(productId);
                return Ok(ApiResponse<ProductReviewsDto>.SuccessResult(summary));
            }
            catch (NotFoundException ex)
            {
                return NotFound(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving reviews summary for product {ProductId}", productId);
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpGet("my-reviews")]
        public async Task<ActionResult<ApiResponse<List<ReviewDto>>>> GetMyReviews()
        {
            try
            {
                var customerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var reviews = await _reviewService.GetCustomerReviewsAsync(customerId);
                return Ok(ApiResponse<List<ReviewDto>>.SuccessResult(reviews));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving customer reviews");
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<ApiResponse<ReviewDto>>> CreateReview(CreateReviewDto createDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ApiResponse<string>.ErrorResult("Invalid model state"));

                var customerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var review = await _reviewService.CreateReviewAsync(createDto, customerId);

                return CreatedAtAction(nameof(GetReview), new { id = review.ReviewId },
                    ApiResponse<ReviewDto>.SuccessResult(review, "Review created successfully. Waiting for approval."));
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
                _logger.LogError(ex, "Error creating review");
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<ApiResponse<ReviewDto>>> UpdateReview(int id, UpdateReviewDto updateDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ApiResponse<string>.ErrorResult("Invalid model state"));

                var customerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var review = await _reviewService.UpdateReviewAsync(id, updateDto, customerId);

                return Ok(ApiResponse<ReviewDto>.SuccessResult(review, "Review updated successfully"));
            }
            catch (NotFoundException ex)
            {
                return NotFound(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (BusinessException ex)
            {
                return BadRequest(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating review {ReviewId}", id);
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteReview(int id)
        {
            try
            {
                var customerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var result = await _reviewService.DeleteReviewAsync(id, customerId);

                return Ok(ApiResponse<bool>.SuccessResult(result, "Review deleted successfully"));
            }
            catch (NotFoundException ex)
            {
                return NotFound(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting review {ReviewId}", id);
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpGet("pending")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<List<ReviewDto>>>> GetPendingReviews()
        {
            try
            {
                var reviews = await _reviewService.GetPendingReviewsAsync();
                return Ok(ApiResponse<List<ReviewDto>>.SuccessResult(reviews));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving pending reviews");
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpPost("{id}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<bool>>> ApproveReview(int id)
        {
            try
            {
                var adminId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var result = await _reviewService.ApproveReviewAsync(id, adminId);

                return Ok(ApiResponse<bool>.SuccessResult(result, "Review approved successfully"));
            }
            catch (NotFoundException ex)
            {
                return NotFound(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving review {ReviewId}", id);
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpPost("{id}/reject")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<bool>>> RejectReview(int id)
        {
            try
            {
                var adminId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var result = await _reviewService.RejectReviewAsync(id, adminId);

                return Ok(ApiResponse<bool>.SuccessResult(result, "Review rejected successfully"));
            }
            catch (NotFoundException ex)
            {
                return NotFound(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting review {ReviewId}", id);
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }
    }
}