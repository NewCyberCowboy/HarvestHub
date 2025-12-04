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

        public ProductsController(IProductService productService)
        {
            _productService = productService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<IEnumerable<ProductDto>>>> GetProducts()
        {
            try
            {
                var products = await _productService.GetAllProductsAsync();
                return Ok(ApiResponse<IEnumerable<ProductDto>>.SuccessResult(products));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<ProductDto>>> GetProduct(int id)
        {
            try
            {
                var product = await _productService.GetProductByIdAsync(id);
                return Ok(ApiResponse<ProductDto>.SuccessResult(product));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpPost]
        //[AllowAnonymous]
        public async Task<ActionResult<ApiResponse<ProductDto>>> CreateProduct(CreateProductDto createDto)
        {
            try
            {
                // Используем существующего админа с ID 24
                int farmerId = 24; // ID пользователя admin@harvesthub.com

                var product = await _productService.CreateProductAsync(createDto, farmerId);
                return Ok(ApiResponse<ProductDto>.SuccessResult(product, "Product created successfully"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.ErrorResult($"Error: {ex.Message}"));
            }
        }
        [HttpGet("farmer/my-products")]
        [Authorize(Roles = "Farmer,Admin")]
        public async Task<ActionResult<ApiResponse<IEnumerable<ProductDto>>>> GetMyProducts()
        {
            try
            {
                var farmerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var products = await _productService.GetFarmerProductsAsync(farmerId);
                return Ok(ApiResponse<IEnumerable<ProductDto>>.SuccessResult(products));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }
        [HttpGet("category/{categoryId}")]
        public async Task<ActionResult<ApiResponse<IEnumerable<ProductDto>>>> GetProductsByCategory(int categoryId)
        {
            try
            {
                var products = await _productService.GetProductsByCategoryAsync(categoryId);
                return Ok(ApiResponse<IEnumerable<ProductDto>>.SuccessResult(products));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpGet("low-stock")]
        public async Task<ActionResult<ApiResponse<IEnumerable<ProductDto>>>> GetLowStockProducts()
        {
            try
            {
                var products = await _productService.GetLowStockProductsAsync();
                return Ok(ApiResponse<IEnumerable<ProductDto>>.SuccessResult(products));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpGet("expiring")]
        public async Task<ActionResult<ApiResponse<IEnumerable<ProductDto>>>> GetExpiringProducts([FromQuery] int days = 7)
        {
            try
            {
                var products = await _productService.GetExpiringProductsAsync(days);
                return Ok(ApiResponse<IEnumerable<ProductDto>>.SuccessResult(products));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpGet("search")]
        public async Task<ActionResult<ApiResponse<IEnumerable<ProductDto>>>> SearchProducts([FromQuery] string term)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(term))
                    return BadRequest(ApiResponse<string>.ErrorResult("Search term is required"));

                var products = await _productService.SearchProductsAsync(term);
                return Ok(ApiResponse<IEnumerable<ProductDto>>.SuccessResult(products));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Farmer,Admin")]
        public async Task<ActionResult<ApiResponse<ProductDto>>> UpdateProduct(int id, UpdateProductDto updateDto)
        {
            try
            {
                var product = await _productService.UpdateProductAsync(id, updateDto);
                return Ok(ApiResponse<ProductDto>.SuccessResult(product, "Product updated successfully"));
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
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

     
        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteProduct(int id)
        {
            try
            {
                var result = await _productService.DeleteProductAsync(id);
                return Ok(ApiResponse<bool>.SuccessResult(result, "Product deleted successfully"));
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
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpPatch("{id}/stock")]
        [Authorize(Roles = "Farmer,Admin")]
        public async Task<ActionResult<ApiResponse<bool>>> UpdateStock(int id, [FromBody] UpdateStockRequest request)
        {
            try
            {
                await _productService.UpdateProductStockAsync(id, request.Quantity);
                return Ok(ApiResponse<bool>.SuccessResult(true, "Stock updated successfully"));
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
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        public class UpdateStockRequest
        {
            public int Quantity { get; set; }
        }
    }
}