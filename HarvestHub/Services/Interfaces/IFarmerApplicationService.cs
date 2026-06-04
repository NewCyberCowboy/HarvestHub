using HarvestHub.DTOs;

namespace HarvestHub.Services.Interfaces
{
    public interface IFarmerApplicationService
    {
        Task<FarmerApplicationDto> CreateApplicationAsync(CreateFarmerApplicationDto createDto, int userId);
        Task<FarmerApplicationDto> GetApplicationByIdAsync(int applicationId);
        Task<FarmerApplicationDto?> GetUserApplicationAsync(int userId);
        Task<List<FarmerApplicationDto>> GetAllApplicationsAsync();
        Task<List<FarmerApplicationDto>> GetPendingApplicationsAsync();
        Task<FarmerApplicationDto> ReviewApplicationAsync(int applicationId, ReviewFarmerApplicationDto reviewDto, int adminId);
        Task<bool> HasPendingApplicationAsync(int userId);
    }
}










