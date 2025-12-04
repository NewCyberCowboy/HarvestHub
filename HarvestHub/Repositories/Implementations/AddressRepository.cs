// Repositories/Implementations/AddressRepository.cs
using HarvestHub.Models;
using HarvestHub.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HarvestHub.Repositories.Implementations
{
    public class AddressRepository : IAddressRepository
    {
        private readonly ApplicationDbContext _context;

        public AddressRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Address> GetByIdAsync(int id)
        {
            return await _context.Addresses.FindAsync(id);
        }

        public async Task<IEnumerable<Address>> GetAllAsync()
        {
            return await _context.Addresses.ToListAsync();
        }

        public async Task<Address> AddAsync(Address entity)
        {
            _context.Addresses.Add(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<Address> UpdateAsync(Address entity)
        {
            _context.Addresses.Update(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var address = await GetByIdAsync(id);
            if (address == null) return false;

            _context.Addresses.Remove(address);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _context.Addresses.AnyAsync(a => a.AddressId == id);
        }

        public async Task<IEnumerable<Address>> FindAsync(System.Linq.Expressions.Expression<Func<Address, bool>> predicate)
        {
            return await _context.Addresses.Where(predicate).ToListAsync();
        }

        // Специфичные методы
        public async Task<IEnumerable<Address>> GetUserAddressesAsync(int userId)
        {
            return await _context.Addresses
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.IsDefault)
                .ThenByDescending(a => a.CreatedAt)
                .ToListAsync();
        }

        public async Task<Address?> GetDefaultAddressAsync(int userId)
        {
            return await _context.Addresses
                .FirstOrDefaultAsync(a => a.UserId == userId && a.IsDefault);
        }

        public async Task<bool> SetDefaultAddressAsync(int addressId, int userId)
        {
            // Получаем текущий основной адрес
            var currentDefault = await GetDefaultAddressAsync(userId);
            if (currentDefault != null)
            {
                currentDefault.IsDefault = false;
                currentDefault.UpdatedAt = DateTime.UtcNow;
            }

            // Устанавливаем новый основной адрес
            var newDefault = await GetByIdAsync(addressId);
            if (newDefault == null || newDefault.UserId != userId)
                return false;

            newDefault.IsDefault = true;
            newDefault.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UserHasAddressAsync(int userId, int addressId)
        {
            return await _context.Addresses
                .AnyAsync(a => a.UserId == userId && a.AddressId == addressId);
        }

        public async Task<bool> UserHasAddressesAsync(int userId)
        {
            return await _context.Addresses.AnyAsync(a => a.UserId == userId);
        }
    }
}