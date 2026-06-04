using HarvestHub.Models;
using HarvestHub.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HarvestHub.Repositories.Implementations
{
    public class OrderRepository : IOrderRepository
    {
        private readonly ApplicationDbContext _context;

        public OrderRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Order?> GetByIdAsync(int id)
        {
            return await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(i => i.Product)
                        .ThenInclude(p => p.Farmer)
                .Include(o => o.StatusHistory)
                .Include(o => o.Customer)
                    .ThenInclude(c => c.Profile)
                .FirstOrDefaultAsync(o => o.OrderId == id);
        }

        public async Task<IEnumerable<Order>> GetAllAsync()
        {
            return await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(i => i.Product)
                        .ThenInclude(p => p.Farmer)
                .Include(o => o.StatusHistory)
                .Include(o => o.Customer)
                    .ThenInclude(c => c.Profile)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Order>> FindAsync(System.Linq.Expressions.Expression<Func<Order, bool>> predicate)
        {
            return await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(i => i.Product)
                .Where(predicate)
                .ToListAsync();
        }

        public async Task<Order> AddAsync(Order entity)
        {
            _context.Orders.Add(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<Order> UpdateAsync(Order entity)
        {
            _context.Orders.Update(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var order = await GetByIdAsync(id);
            if (order == null) return false;

            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _context.Orders.AnyAsync(o => o.OrderId == id);
        }

        // Специфичные методы для Order
        public async Task<Order?> GetOrderByIdAsync(int orderId)
        {
            return await GetByIdAsync(orderId);
        }

        public async Task<List<Order>> GetOrdersByCustomerIdAsync(int customerId)
        {
            return await _context.Orders
                .Where(o => o.CustomerId == customerId)
                .Include(o => o.OrderItems)
                    .ThenInclude(i => i.Product)
                .Include(o => o.StatusHistory)
                .AsSplitQuery()
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Order>> GetOrdersByFarmerIdAsync(int farmerId)
        {
            return await _context.Orders
                .Where(o => o.OrderItems.Any(i => i.Product.FarmerId == farmerId))
                .Include(o => o.OrderItems)
                    .ThenInclude(i => i.Product)
                        .ThenInclude(p => p.Category)
                .Include(o => o.StatusHistory)
                .Include(o => o.Customer)
                    .ThenInclude(c => c.Profile)
                .AsSplitQuery()
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
        }

        public async Task AddOrderStatusHistoryAsync(OrderStatusHistory statusHistory)
        {
            _context.OrderStatusHistories.Add(statusHistory);
            await _context.SaveChangesAsync();
        }

        public async Task<List<OrderStatusHistory>> GetOrderStatusHistoryAsync(int orderId)
        {
            return await _context.OrderStatusHistories
                .Where(h => h.OrderId == orderId)
                .OrderBy(h => h.ChangedAt)
                .ToListAsync();
        }
        public async Task<int> GetCountByUserIdAsync(int userId)
        {
            return await _context.Orders
                .CountAsync(o => o.CustomerId == userId);
        }
    }
}