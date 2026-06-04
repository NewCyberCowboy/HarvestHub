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
    public class FarmerApplicationsController : ControllerBase
    {
        private readonly IFarmerApplicationService _applicationService;
        private readonly ILogger<FarmerApplicationsController> _logger;

        public FarmerApplicationsController(
            IFarmerApplicationService applicationService,
            ILogger<FarmerApplicationsController> logger)
        {
            _applicationService = applicationService;
            _logger = logger;
        }

        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<ApiResponse<FarmerApplicationDto>>> CreateApplication([FromBody] CreateFarmerApplicationDto createDto)
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
                    _logger.LogWarning("Validation errors for farmer application: {Errors}", errorMessage);
                    return BadRequest(ApiResponse<string>.ErrorResult(errorMessage));
                }

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var application = await _applicationService.CreateApplicationAsync(createDto, userId);
                return Ok(ApiResponse<FarmerApplicationDto>.SuccessResult(application, "Application submitted successfully"));
            }
            catch (BusinessException ex)
            {
                _logger.LogWarning(ex, "Business logic error creating application: {ErrorMessage}", ex.Message);
                return BadRequest(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating farmer application");
                return StatusCode(500, ApiResponse<string>.ErrorResult($"Error: {ex.Message}"));
            }
        }

        [HttpGet("my")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<FarmerApplicationDto>>> GetMyApplication()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var application = await _applicationService.GetUserApplicationAsync(userId);
                
                if (application == null)
                    return NotFound(ApiResponse<string>.ErrorResult("Application not found"));

                return Ok(ApiResponse<FarmerApplicationDto>.SuccessResult(application));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user application");
                return StatusCode(500, ApiResponse<string>.ErrorResult($"Error: {ex.Message}"));
            }
        }

        [HttpGet("pending")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<List<FarmerApplicationDto>>>> GetPendingApplications()
        {
            try
            {
                var applications = await _applicationService.GetPendingApplicationsAsync();
                return Ok(ApiResponse<List<FarmerApplicationDto>>.SuccessResult(applications));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving pending applications");
                return StatusCode(500, ApiResponse<string>.ErrorResult($"Error: {ex.Message}"));
            }
        }

        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<List<FarmerApplicationDto>>>> GetAllApplications()
        {
            try
            {
                var applications = await _applicationService.GetAllApplicationsAsync();
                return Ok(ApiResponse<List<FarmerApplicationDto>>.SuccessResult(applications));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all applications");
                return StatusCode(500, ApiResponse<string>.ErrorResult($"Error: {ex.Message}"));
            }
        }

        [HttpGet("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<FarmerApplicationDto>>> GetApplication(int id)
        {
            try
            {
                var application = await _applicationService.GetApplicationByIdAsync(id);
                return Ok(ApiResponse<FarmerApplicationDto>.SuccessResult(application));
            }
            catch (NotFoundException ex)
            {
                _logger.LogWarning(ex, "Application not found: {ApplicationId}", id);
                return NotFound(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving application {ApplicationId}", id);
                return StatusCode(500, ApiResponse<string>.ErrorResult($"Error: {ex.Message}"));
            }
        }

        [HttpPut("{id:int}/review")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<FarmerApplicationDto>>> ReviewApplication(
            int id,
            [FromBody] ReviewFarmerApplicationDto reviewDto)
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
                    _logger.LogWarning("Validation errors for application review: {Errors}", errorMessage);
                    return BadRequest(ApiResponse<string>.ErrorResult(errorMessage));
                }

                if (reviewDto.Status != "Approved" && reviewDto.Status != "Rejected")
                {
                    return BadRequest(ApiResponse<string>.ErrorResult("Status must be 'Approved' or 'Rejected'"));
                }

                var adminId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var application = await _applicationService.ReviewApplicationAsync(id, reviewDto, adminId);
                return Ok(ApiResponse<FarmerApplicationDto>.SuccessResult(application, 
                    $"Application {reviewDto.Status.ToLower()} successfully"));
            }
            catch (NotFoundException ex)
            {
                _logger.LogWarning(ex, "Application not found for review: {ApplicationId}", id);
                return NotFound(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (BusinessException ex)
            {
                _logger.LogWarning(ex, "Business logic error reviewing application: {ErrorMessage}", ex.Message);
                return BadRequest(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized access error reviewing application: {ErrorMessage}", ex.Message);
                return Unauthorized(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reviewing application {ApplicationId}", id);
                return StatusCode(500, ApiResponse<string>.ErrorResult($"Error: {ex.Message}"));
            }
        }

        [HttpGet("check")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<bool>>> CheckPendingApplication()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var hasPending = await _applicationService.HasPendingApplicationAsync(userId);
                return Ok(ApiResponse<bool>.SuccessResult(hasPending));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking pending application");
                return StatusCode(500, ApiResponse<string>.ErrorResult($"Error: {ex.Message}"));
            }
        }
    }
}










