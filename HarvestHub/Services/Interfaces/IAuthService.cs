using HarvestHub.DTOs;
using HarvestHub.Models;

namespace HarvestHub.Services.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto);
        Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
        Task<bool> UserExistsAsync(string email);
        string GenerateJwtToken(User user);
    }
}