using HarvestHub.Models;
using HarvestHub.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HarvestHub.Repositories.Implementations
{
    public class UserRepository : IUserRepository
    {
        private readonly ApplicationDbContext _context;

        public UserRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<User> GetByIdAsync(int id)
        {
            return await _context.Users
                .Include(u => u.Profile)
                .FirstOrDefaultAsync(u => u.UserId == id);
        }

        public async Task<IEnumerable<User>> GetAllAsync()
        {
            return await _context.Users
                .Include(u => u.Profile)
                .ToListAsync();
        }

        public async Task<IEnumerable<User>> FindAsync(System.Linq.Expressions.Expression<Func<User, bool>> predicate)
        {
            return await _context.Users
                .Include(u => u.Profile)
                .Where(predicate)
                .ToListAsync();
        }

        public async Task<User> AddAsync(User entity)
        {
            _context.Users.Add(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<User> UpdateAsync(User entity)
        {
            _context.Users.Update(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var user = await GetByIdAsync(id);
            if (user == null) return false;

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _context.Users.AnyAsync(u => u.UserId == id);
        }

        public async Task<User> GetByEmailAsync(string email)
        {
            return await _context.Users
                .Include(u => u.Profile)
                .FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<Profile> GetProfileAsync(int userId)
        {
            return await _context.Profiles
                .FirstOrDefaultAsync(p => p.UserId == userId);
        }

        public async Task<Profile> AddProfileAsync(Profile profile)
        {
            _context.Profiles.Add(profile);
            await _context.SaveChangesAsync();
            return profile;
        }

        public async Task<bool> EmailExistsAsync(string email)
        {
            return await _context.Users.AnyAsync(u => u.Email == email);
        }

        public async Task<IEnumerable<User>> GetByRoleAsync(string role)
        {
            return await _context.Users
                .Include(u => u.Profile)
                .Where(u => u.Role == role)
                .ToListAsync();
        }

        public async Task<int> GetCountByRoleAsync(string role)
        {
            return await _context.Users
                .CountAsync(u => u.Role == role);
        }

        public async Task<int> GetCountAsync()
        {
            return await _context.Users.CountAsync();
        }

        public async Task<bool> HasActiveOrdersAsync(int userId)
        {
            return await _context.Orders.AnyAsync(o =>
                o.CustomerId == userId &&
                o.Status != "Delivered" &&
                o.Status != "Cancelled");
        }

        public async Task<IEnumerable<User>> SearchAsync(string searchTerm)
        {
            var query = _context.Users
                .Include(u => u.Profile)
                .AsQueryable();

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(u =>
                    u.Email.Contains(searchTerm) ||
                    (u.Profile != null && (
                        (u.Profile.FirstName != null && u.Profile.FirstName.Contains(searchTerm)) ||
                        (u.Profile.LastName != null && u.Profile.LastName.Contains(searchTerm)) ||
                        (u.Profile.Phone != null && u.Profile.Phone.Contains(searchTerm))
                    )));
            }

            return await query.ToListAsync();
        }

        public async Task<int> GetCountSinceAsync(DateTime since)
        {
            return await _context.Users
                .CountAsync(u => u.CreatedAt >= since);
        }
    }
}