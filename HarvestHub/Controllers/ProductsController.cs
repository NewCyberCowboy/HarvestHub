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
    public class ProductsController : ControllerBase
    {
        private readonly IProductService _productService;
        private readonly ILogger<ProductsController> _logger;

        public ProductsController(IProductService productService, ILogger<ProductsController> logger)
        {
            _productService = productService;
            _logger = logger;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<IEnumerable<ProductDto>>>> GetProducts()
        {
            try
            {
                var products = await _productService.GetAllProductsAsync();
                return Ok(ApiResponse<IEnumerable<ProductDto>>.SuccessResult(products));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving products");
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpGet("{id:int}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<ProductDto>>> GetProduct(int id)
        {
            try
            {
                var product = await _productService.GetProductByIdAsync(id);
                return Ok(ApiResponse<ProductDto>.SuccessResult(product));
            }
            catch (NotFoundException ex)
            {
                return NotFound(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving product with ID {ProductId}", id);
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpGet("category/{categoryId:int}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<IEnumerable<ProductDto>>>> GetProductsByCategory(int categoryId)
        {
            try
            {
                var products = await _productService.GetProductsByCategoryAsync(categoryId);
                return Ok(ApiResponse<IEnumerable<ProductDto>>.SuccessResult(products));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving products by category {CategoryId}", categoryId);
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<IEnumerable<ProductDto>>>> SearchProducts([FromQuery] string term)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(term))
                {
                    return BadRequest(ApiResponse<string>.ErrorResult("Search term is required"));
                }

                var products = await _productService.SearchProductsAsync(term);
                return Ok(ApiResponse<IEnumerable<ProductDto>>.SuccessResult(products));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching products with term {SearchTerm}", term);
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpPost]
        [Authorize(Roles = "Farmer,Admin")]
        public async Task<ActionResult<ApiResponse<ProductDto>>> CreateProduct([FromBody] CreateProductDto createDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(x => x.Value?.Errors.Count > 0)
                        .SelectMany(x => x.Value.Errors.Select(e => $"{x.Key}: {e.ErrorMessage}"))
                        .ToList();
                    var errorMessage = errors.Any()
                        ? string.Join("; ", errors)
                        : "Invalid model state";
                    _logger.LogWarning("Validation errors for product creation: {Errors}", errorMessage);
                    return BadRequest(ApiResponse<string>.ErrorResult(errorMessage));
                }

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var product = await _productService.CreateProductAsync(createDto, userId);
                return CreatedAtAction(nameof(GetProduct), new { id = product.ProductId },
                    ApiResponse<ProductDto>.SuccessResult(product, "Product created successfully"));
            }
            catch (BusinessException ex)
            {
                _logger.LogWarning(ex, "Business logic error creating product: {ErrorMessage}", ex.Message);
                return BadRequest(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product");
                return StatusCode(500, ApiResponse<string>.ErrorResult($"Error: {ex.Message}"));
            }
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Farmer,Admin")]
        public async Task<ActionResult<ApiResponse<ProductDto>>> UpdateProduct(int id, [FromBody] UpdateProductDto updateDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(x => x.Value?.Errors.Count > 0)
                        .SelectMany(x => x.Value.Errors.Select(e => $"{x.Key}: {e.ErrorMessage}"))
                        .ToList();
                    var errorMessage = errors.Any()
                        ? string.Join("; ", errors)
                        : "Invalid model state";
                    _logger.LogWarning("Validation errors for product update: {Errors}", errorMessage);
                    return BadRequest(ApiResponse<string>.ErrorResult(errorMessage));
                }

                var product = await _productService.UpdateProductAsync(id, updateDto);
                return Ok(ApiResponse<ProductDto>.SuccessResult(product, "Product updated successfully"));
            }
            catch (NotFoundException ex)
            {
                _logger.LogWarning(ex, "Product not found: {ProductId}", id);
                return NotFound(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (BusinessException ex)
            {
                _logger.LogWarning(ex, "Business logic error updating product: {ErrorMessage}", ex.Message);
                return BadRequest(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product {ProductId}", id);
                return StatusCode(500, ApiResponse<string>.ErrorResult($"Error: {ex.Message}"));
            }
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Farmer,Admin")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteProduct(int id)
        {
            try
            {
                var result = await _productService.DeleteProductAsync(id);
                if (result)
                {
                    return Ok(ApiResponse<bool>.SuccessResult(true, "Product deleted successfully"));
                }
                return BadRequest(ApiResponse<bool>.ErrorResult("Failed to delete product"));
            }
            catch (NotFoundException ex)
            {
                _logger.LogWarning(ex, "Product not found: {ProductId}", id);
                return NotFound(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (BusinessException ex)
            {
                _logger.LogWarning(ex, "Business logic error deleting product: {ErrorMessage}", ex.Message);
                return BadRequest(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting product {ProductId}", id);
                return StatusCode(500, ApiResponse<string>.ErrorResult($"Error: {ex.Message}"));
            }
        }

        [HttpGet("farmer/my-products")]
        [Authorize(Roles = "Farmer,Admin")]
        public async Task<ActionResult<ApiResponse<IEnumerable<ProductDto>>>> GetMyProducts()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var products = await _productService.GetFarmerProductsAsync(userId);
                return Ok(ApiResponse<IEnumerable<ProductDto>>.SuccessResult(products));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving farmer products");
                return StatusCode(500, ApiResponse<string>.ErrorResult($"Error: {ex.Message}"));
            }
        }

        [HttpDelete("cleanup-invalid-units")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<int>>> CleanupInvalidUnits()
        {
            try
            {
                // Получаем все продукты
                var allProducts = await _productService.GetAllProductsAsync();
                
                // Фильтруем продукты с единицами 'шт' или 'коробка'
                var invalidProducts = allProducts.Where(p => 
                    p.Unit == "шт" || p.Unit == "коробка" || string.IsNullOrEmpty(p.Unit)
                ).ToList();
                
                int deletedCount = 0;
                foreach (var product in invalidProducts)
                {
                    try
                    {
                        await _productService.DeleteProductAsync(product.ProductId);
                        deletedCount++;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Не удалось удалить продукт {ProductId}", product.ProductId);
                    }
                }
                
                return Ok(ApiResponse<int>.SuccessResult(deletedCount, $"Удалено {deletedCount} продуктов с недопустимыми единицами измерения"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при очистке продуктов");
                return StatusCode(500, ApiResponse<string>.ErrorResult("Ошибка при очистке продуктов"));
            }
        }
    }
}
