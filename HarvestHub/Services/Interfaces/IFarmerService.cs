using HarvestHub.DTOs;

namespace HarvestHub.Services.Interfaces
{
    public interface IFarmerService
    {
        Task<List<FarmerDto>> GetAllFarmersAsync();
        Task<FarmerDetailDto> GetFarmerDetailAsync(int farmerId);
        Task<FarmerDetailDto> UpdateFarmerInfoAsync(int farmerId, UpdateFarmerInfoDto updateDto);
    }
}










