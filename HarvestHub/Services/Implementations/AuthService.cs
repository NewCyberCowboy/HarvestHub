using HarvestHub.DTOs;
using HarvestHub.Exceptions;
using HarvestHub.Models;
using HarvestHub.Repositories.Interfaces;
using HarvestHub.Services.Interfaces;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;

namespace HarvestHub.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthService> _logger;

        public AuthService(IUserRepository userRepository, IConfiguration configuration, ILogger<AuthService> logger)
        {
            _userRepository = userRepository;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
        {
            if (await UserExistsAsync(registerDto.Email))
                throw new BusinessException("User with this email already exists");

            // Хеширование пароля
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);

            var user = new User
            {
                Email = registerDto.Email,
                PasswordHash = passwordHash,
                Role = registerDto.Role,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var createdUser = await _userRepository.AddAsync(user);

            // Создаем профиль
            var profile = new Profile
            {
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                Phone = registerDto.Phone,
                Address = registerDto.Address ?? "Не указан",
                PreferredContact = "email",
                UserId = createdUser.UserId
            };

            await _userRepository.AddProfileAsync(profile);

            _logger.LogInformation("User registered: {Email}, Role: {Role}", user.Email, user.Role);

            var token = GenerateJwtToken(createdUser);
            return new AuthResponseDto
            {
                Token = token,
                Expires = DateTime.UtcNow.AddDays(7),
                User = MapToUserDto(createdUser, profile)
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
        {
            var user = await _userRepository.GetByEmailAsync(loginDto.Email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
                throw new BusinessException("Invalid email or password");

            var profile = await _userRepository.GetProfileAsync(user.UserId);
            var token = GenerateJwtToken(user);

            _logger.LogInformation("User logged in: {Email}", user.Email);

            return new AuthResponseDto
            {
                Token = token,
                Expires = DateTime.UtcNow.AddDays(7),
                User = MapToUserDto(user, profile)
            };
        }

        public async Task<bool> UserExistsAsync(string email)
        {
            return await _userRepository.GetByEmailAsync(email) != null;
        }

        public string GenerateJwtToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private AuthUserDto MapToUserDto(User user, Profile profile)  
        {
            return new AuthUserDto 
            {
                UserId = user.UserId,
                Email = user.Email,
                Role = user.Role,
                FirstName = profile?.FirstName,
                LastName = profile?.LastName,
                Phone = profile?.Phone,
                Address = profile?.Address
            };
        }
    }
}