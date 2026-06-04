using HarvestHub.Models;
using HarvestHub.DTOs;
using HarvestHub.Services.Interfaces;
using HarvestHub.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace HarvestHub.Services.Implementations
{
    public class FarmerApplicationService : IFarmerApplicationService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<FarmerApplicationService> _logger;

        public FarmerApplicationService(
            ApplicationDbContext context,
            ILogger<FarmerApplicationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FarmerApplicationDto> CreateApplicationAsync(CreateFarmerApplicationDto createDto, int userId)
        {
            // Проверяем, что пользователь существует и имеет роль Customer
            var user = await _context.Users
                .Include(u => u.Profile)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
                throw new NotFoundException($"User with ID {userId} not found");

            if (user.Role != "Customer")
                throw new BusinessException("Only customers can apply to become farmers");

            // Проверяем, нет ли уже активной заявки
            var existingApplication = await _context.FarmerApplications
                .FirstOrDefaultAsync(a => a.UserId == userId && a.Status == "Pending");

            if (existingApplication != null)
                throw new BusinessException("You already have a pending application");

            // Создаем новую заявку
            var application = new FarmerApplication
            {
                UserId = userId,
                Message = createDto.Message.Trim(),
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.FarmerApplications.Add(application);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Farmer application created: ApplicationId={ApplicationId}, UserId={UserId}", 
                application.ApplicationId, userId);

            return await MapToDtoAsync(application);
        }

        public async Task<FarmerApplicationDto> GetApplicationByIdAsync(int applicationId)
        {
            var application = await _context.FarmerApplications
                .Include(a => a.User)
                    .ThenInclude(u => u.Profile)
                .Include(a => a.Reviewer)
                    .ThenInclude(r => r.Profile)
                .FirstOrDefaultAsync(a => a.ApplicationId == applicationId);

            if (application == null)
                throw new NotFoundException($"Application with ID {applicationId} not found");

            return await MapToDtoAsync(application);
        }

        public async Task<FarmerApplicationDto?> GetUserApplicationAsync(int userId)
        {
            var application = await _context.FarmerApplications
                .Include(a => a.User)
                    .ThenInclude(u => u.Profile)
                .Include(a => a.Reviewer)
                    .ThenInclude(r => r.Profile)
                .OrderByDescending(a => a.CreatedAt)
                .FirstOrDefaultAsync(a => a.UserId == userId);

            if (application == null)
                return null;

            return await MapToDtoAsync(application);
        }

        public async Task<List<FarmerApplicationDto>> GetAllApplicationsAsync()
        {
            var applications = await _context.FarmerApplications
                .Include(a => a.User)
                    .ThenInclude(u => u.Profile)
                .Include(a => a.Reviewer)
                    .ThenInclude(r => r.Profile)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            var result = new List<FarmerApplicationDto>();
            foreach (var application in applications)
            {
                result.Add(await MapToDtoAsync(application));
            }

            return result;
        }

        public async Task<List<FarmerApplicationDto>> GetPendingApplicationsAsync()
        {
            var applications = await _context.FarmerApplications
                .Include(a => a.User)
                    .ThenInclude(u => u.Profile)
                .Include(a => a.Reviewer)
                    .ThenInclude(r => r.Profile)
                .Where(a => a.Status == "Pending")
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            var result = new List<FarmerApplicationDto>();
            foreach (var application in applications)
            {
                result.Add(await MapToDtoAsync(application));
            }

            return result;
        }

        public async Task<FarmerApplicationDto> ReviewApplicationAsync(int applicationId, ReviewFarmerApplicationDto reviewDto, int adminId)
        {
            var application = await _context.FarmerApplications
                .Include(a => a.User)
                .FirstOrDefaultAsync(a => a.ApplicationId == applicationId);

            if (application == null)
                throw new NotFoundException($"Application with ID {applicationId} not found");

            if (application.Status != "Pending")
                throw new BusinessException($"Application is already {application.Status}");

            // Проверяем, что админ существует
            var admin = await _context.Users.FirstOrDefaultAsync(u => u.UserId == adminId && u.Role == "Admin");
            if (admin == null)
                throw new UnauthorizedAccessException("Only admins can review applications");

            // Обновляем статус заявки
            application.Status = reviewDto.Status;
            application.AdminNotes = string.IsNullOrWhiteSpace(reviewDto.AdminNotes) ? null : reviewDto.AdminNotes.Trim();
            application.ReviewedBy = adminId;
            application.ReviewedAt = DateTime.UtcNow;

            // Если заявка одобрена, меняем роль пользователя на Farmer
            if (reviewDto.Status == "Approved")
            {
                var user = application.User;
                if (user.Role == "Customer")
                {
                    user.Role = "Farmer";
                    user.UpdatedAt = DateTime.UtcNow;
                    _logger.LogInformation("User {UserId} role changed from Customer to Farmer", user.UserId);
                }
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Farmer application reviewed: ApplicationId={ApplicationId}, Status={Status}, AdminId={AdminId}",
                applicationId, reviewDto.Status, adminId);

            return await GetApplicationByIdAsync(applicationId);
        }

        public async Task<bool> HasPendingApplicationAsync(int userId)
        {
            return await _context.FarmerApplications
                .AnyAsync(a => a.UserId == userId && a.Status == "Pending");
        }

        private async Task<FarmerApplicationDto> MapToDtoAsync(FarmerApplication application)
        {
            return new FarmerApplicationDto
            {
                ApplicationId = application.ApplicationId,
                UserId = application.UserId,
                UserEmail = application.User?.Email ?? string.Empty,
                UserName = $"{application.User?.Profile?.FirstName ?? ""} {application.User?.Profile?.LastName ?? ""}".Trim(),
                Message = application.Message,
                Status = application.Status,
                AdminNotes = application.AdminNotes,
                ReviewedBy = application.ReviewedBy,
                ReviewerName = application.Reviewer != null 
                    ? $"{application.Reviewer.Profile?.FirstName ?? ""} {application.Reviewer.Profile?.LastName ?? ""}".Trim()
                    : null,
                CreatedAt = application.CreatedAt,
                ReviewedAt = application.ReviewedAt
            };
        }
    }
}










