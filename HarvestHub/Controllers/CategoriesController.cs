using HarvestHub.Common;
using HarvestHub.DTOs;
using HarvestHub.Exceptions;
using HarvestHub.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HarvestHub.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryService _categoryService;
        private readonly ILogger<CategoriesController> _logger;

        public CategoriesController(ICategoryService categoryService, ILogger<CategoriesController> logger)
        {
            _categoryService = categoryService;
            _logger = logger;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<IEnumerable<CategoryDto>>>> GetCategories()
        {
            try
            {
                var categories = await _categoryService.GetAllCategoriesAsync();
                return Ok(ApiResponse<IEnumerable<CategoryDto>>.SuccessResult(categories));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving categories");
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpGet("{id:int}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<CategoryDto>>> GetCategory(int id)
        {
            try
            {
                var category = await _categoryService.GetCategoryByIdAsync(id);
                return Ok(ApiResponse<CategoryDto>.SuccessResult(category));
            }
            catch (NotFoundException ex)
            {
                return NotFound(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving category with ID {CategoryId}", id);
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Farmer")]
        public async Task<ActionResult<ApiResponse<CategoryDto>>> CreateCategory(CreateCategoryDto createDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ApiResponse<string>.ErrorResult("Invalid model state"));

                var category = await _categoryService.CreateCategoryAsync(createDto);
                return CreatedAtAction(nameof(GetCategory), new { id = category.CategoryId },
                    ApiResponse<CategoryDto>.SuccessResult(category, "Category created successfully"));
            }
            catch (BusinessException ex)
            {
                return BadRequest(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating category");
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin,Farmer")]
        public async Task<ActionResult<ApiResponse<CategoryDto>>> UpdateCategory(int id, UpdateCategoryDto updateDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ApiResponse<string>.ErrorResult("Invalid model state"));

                var category = await _categoryService.UpdateCategoryAsync(id, updateDto);
                return Ok(ApiResponse<CategoryDto>.SuccessResult(category, "Category updated successfully"));
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
                _logger.LogError(ex, "Error updating category with ID {CategoryId}", id);
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteCategory(int id)
        {
            try
            {
                var result = await _categoryService.DeleteCategoryAsync(id);
                return Ok(ApiResponse<bool>.SuccessResult(result, "Category deleted successfully"));
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
                _logger.LogError(ex, "Error deleting category with ID {CategoryId}", id);
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpGet("tree")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<IEnumerable<CategoryDto>>>> GetCategoryTree()
        {
            try
            {
                var tree = await _categoryService.GetCategoryTreeAsync();
                return Ok(ApiResponse<IEnumerable<CategoryDto>>.SuccessResult(tree));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving category tree");
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpGet("{id:int}/products")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<IEnumerable<ProductDto>>>> GetCategoryProducts(int id)
        {
            try
            {
                var products = await _categoryService.GetCategoryProductsAsync(id);
                return Ok(ApiResponse<IEnumerable<ProductDto>>.SuccessResult(products));
            }
            catch (NotFoundException ex)
            {
                return NotFound(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving products for category {CategoryId}", id);
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<IEnumerable<CategoryDto>>>> SearchCategories([FromQuery] string term)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(term))
                    return BadRequest(ApiResponse<string>.ErrorResult("Search term is required"));

                var categories = await _categoryService.SearchCategoriesAsync(term);
                return Ok(ApiResponse<IEnumerable<CategoryDto>>.SuccessResult(categories));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching categories with term {SearchTerm}", term);
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }

        [HttpPost("{id:int}/move")]
        [Authorize(Roles = "Admin,Farmer")]
        public async Task<ActionResult<ApiResponse<bool>>> MoveCategory(int id, [FromBody] MoveCategoryRequest request)
        {
            try
            {
                var result = await _categoryService.MoveCategoryAsync(id, request.NewParentId);
                return Ok(ApiResponse<bool>.SuccessResult(result, "Category moved successfully"));
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
                _logger.LogError(ex, "Error moving category {CategoryId} to parent {ParentId}", id, request.NewParentId);
                return StatusCode(500, ApiResponse<string>.ErrorResult("Internal server error"));
            }
        }
    }

    public class MoveCategoryRequest
    {
        public int? NewParentId { get; set; }
    }
}