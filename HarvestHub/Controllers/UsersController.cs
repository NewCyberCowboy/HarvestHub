// HarvestHub/Controllers/UsersController.cs
using HarvestHub.Common;
using HarvestHub.DTOs;
using HarvestHub.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HarvestHub.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<UsersController> _logger;

        public UsersController(IUserService userService, ILogger<UsersController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<IEnumerable<UserDto>>>> GetAllUsers()
        {
            try
            {
                var users = await _userService.GetAllUsersAsync();
                return Ok(ApiResponse<IEnumerable<UserDto>>.SuccessResult(users));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all users");
                return StatusCode(500, ApiResponse<string>.ErrorResult($"Error: {ex.Message}"));
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<UserDto>>> GetUserById(int id)
        {
            try
            {
                var user = await _userService.GetUserByIdAsync(id);
                return Ok(ApiResponse<UserDto>.SuccessResult(user));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user by ID: {UserId}", id);
                return StatusCode(500, ApiResponse<string>.ErrorResult($"Error: {ex.Message}"));
            }
        }

        [HttpPut("{id}/role")]
        public async Task<ActionResult<ApiResponse<UserDto>>> UpdateUserRole(int id, [FromBody] UpdateUserRoleDto roleDto)
        {
            try
            {
                var user = await _userService.UpdateUserRoleAsync(id, roleDto);
                return Ok(ApiResponse<UserDto>.SuccessResult(user, "User role updated successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user role: {UserId}", id);
                return StatusCode(500, ApiResponse<string>.ErrorResult($"Error: {ex.Message}"));
            }
        }

        [HttpPut("{id}/status")]
        public async Task<ActionResult<ApiResponse<UserDto>>> UpdateUserStatus(int id, [FromBody] UpdateUserStatusDto statusDto)
        {
            try
            {
                var user = await _userService.UpdateUserStatusAsync(id, statusDto);
                return Ok(ApiResponse<UserDto>.SuccessResult(user, "User status updated successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user status: {UserId}", id);
                return StatusCode(500, ApiResponse<string>.ErrorResult($"Error: {ex.Message}"));
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteUser(int id)
        {
            try
            {
                var result = await _userService.DeleteUserAsync(id);
                return Ok(ApiResponse<bool>.SuccessResult(result, "User deleted successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user: {UserId}", id);
                return StatusCode(500, ApiResponse<string>.ErrorResult($"Error: {ex.Message}"));
            }
        }

        [HttpGet("role/{role}")]
        public async Task<ActionResult<ApiResponse<IEnumerable<UserDto>>>> GetUsersByRole(string role)
        {
            try
            {
                var users = await _userService.GetUsersByRoleAsync(role);
                return Ok(ApiResponse<IEnumerable<UserDto>>.SuccessResult(users));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users by role: {Role}", role);
                return StatusCode(500, ApiResponse<string>.ErrorResult($"Error: {ex.Message}"));
            }
        }

        [HttpGet("stats")]
        public async Task<ActionResult<ApiResponse<UserStatsDto>>> GetUserStats()
        {
            try
            {
                var stats = await _userService.GetUserStatsAsync();
                return Ok(ApiResponse<UserStatsDto>.SuccessResult(stats));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user stats");
                return StatusCode(500, ApiResponse<string>.ErrorResult($"Error: {ex.Message}"));
            }
        }

        [HttpGet("search")]
        public async Task<ActionResult<ApiResponse<IEnumerable<UserDto>>>> SearchUsers([FromQuery] string term)
        {
            try
            {
                var users = await _userService.SearchUsersAsync(term);
                return Ok(ApiResponse<IEnumerable<UserDto>>.SuccessResult(users));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching users");
                return StatusCode(500, ApiResponse<string>.ErrorResult($"Error: {ex.Message}"));
            }
        }
    }
}