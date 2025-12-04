using HarvestHub.Models;

namespace HarvestHub.Repositories.Interfaces
{
    public interface IAddressRepository : IRepository<Address>
    {
        Task<IEnumerable<Address>> GetUserAddressesAsync(int userId);
        Task<Address?> GetDefaultAddressAsync(int userId);
        Task<bool> SetDefaultAddressAsync(int addressId, int userId);
        Task<bool> UserHasAddressAsync(int userId, int addressId);
        Task<bool> UserHasAddressesAsync(int userId);
    }
}
