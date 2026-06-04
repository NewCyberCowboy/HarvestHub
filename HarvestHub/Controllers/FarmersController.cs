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
    public class FarmersController : ControllerBase
    {
        private readonly IFarmerService _farmerService;
        private readonly ILogger<FarmersController> _logger;

        public FarmersController(IFarmerService farmerService, ILogger<FarmersController> logger)
        {
            _farmerService = farmerService;
            _logger = logger;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<List<FarmerDto>>>> GetAllFarmers()
        {
            try
            {
                var farmers = await _farmerService.GetAllFarmersAsync();
                return Ok(ApiResponse<List<FarmerDto>>.SuccessResult(farmers));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all farmers");
                return StatusCode(500, ApiResponse<string>.ErrorResult($"Error: {ex.Message}"));
            }
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<FarmerDetailDto>>> GetFarmerDetail(int id)
        {
            try
            {
                var farmer = await _farmerService.GetFarmerDetailAsync(id);
                return Ok(ApiResponse<FarmerDetailDto>.SuccessResult(farmer));
            }
            catch (NotFoundException ex)
            {
                return NotFound(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting farmer detail: {FarmerId}", id);
                return StatusCode(500, ApiResponse<string>.ErrorResult($"Error: {ex.Message}"));
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Farmer,Admin")]
        public async Task<ActionResult<ApiResponse<FarmerDetailDto>>> UpdateFarmerInfo(
            int id, 
            [FromBody] UpdateFarmerInfoDto updateDto)
        {
            try
            {
                // Проверяем, что пользователь обновляет свою информацию или является админом
                var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
                var isAdmin = User.IsInRole("Admin");

                if (!isAdmin && userId != id)
                {
                    return Forbid("You can only update your own information");
                }

                var farmer = await _farmerService.UpdateFarmerInfoAsync(id, updateDto);
                return Ok(ApiResponse<FarmerDetailDto>.SuccessResult(farmer, "Farmer information updated successfully"));
            }
            catch (NotFoundException ex)
            {
                return NotFound(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating farmer info: {FarmerId}", id);
                return StatusCode(500, ApiResponse<string>.ErrorResult($"Error: {ex.Message}"));
            }
        }
    }
}

