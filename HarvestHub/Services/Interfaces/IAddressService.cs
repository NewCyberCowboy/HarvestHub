// Services/Interfaces/IAddressService.cs
using HarvestHub.DTOs;

namespace HarvestHub.Services.Interfaces
{
    public interface IAddressService
    {
        Task<IEnumerable<AddressDto>> GetUserAddressesAsync(int userId);
        Task<AddressDto> GetAddressByIdAsync(int addressId, int userId);
        Task<AddressDto> CreateAddressAsync(CreateAddressDto createDto, int userId);
        Task<AddressDto> UpdateAddressAsync(int addressId, UpdateAddressDto updateDto, int userId);
        Task<bool> DeleteAddressAsync(int addressId, int userId);
        Task<bool> SetDefaultAddressAsync(int addressId, int userId);
        Task<AddressDto?> GetDefaultAddressAsync(int userId);
        Task<bool> AddressBelongsToUserAsync(int addressId, int userId);
    }
}