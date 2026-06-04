using HarvestHub.Models;
using HarvestHub.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HarvestHub.Repositories.Implementations
{
    public class ProductRepository : IProductRepository
    {
        private readonly ApplicationDbContext _context;

        public ProductRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Product?> GetByIdAsync(int id)
        {
            return await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Farmer)
                    .ThenInclude(f => f.Profile)
                .Include(p => p.Farmer)
                    .ThenInclude(f => f.Addresses)
                .FirstOrDefaultAsync(p => p.ProductId == id);
        }

        public async Task<IEnumerable<Product>> GetAllAsync()
        {
            return await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Farmer)
                    .ThenInclude(f => f.Profile)
                .Include(p => p.Farmer)
                    .ThenInclude(f => f.Addresses)
                .ToListAsync();
        }

        public async Task<IEnumerable<Product>> FindAsync(System.Linq.Expressions.Expression<Func<Product, bool>> predicate)
        {
            return await _context.Products
                .Include(p => p.Category)
                .Where(predicate)
                .ToListAsync();
        }

        public async Task<Product> AddAsync(Product entity)
        {
            _context.Products.Add(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<Product> UpdateAsync(Product entity)
        {
            _context.Products.Update(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var product = await GetByIdAsync(id);
            if (product == null) return false;

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _context.Products.AnyAsync(p => p.ProductId == id);
        }

        public async Task<IEnumerable<Product>> GetProductsByCategoryAsync(int categoryId)
        {
            return await _context.Products
                .Include(p => p.Category)
                .Where(p => p.CategoryId == categoryId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Product>> GetLowStockProductsAsync()
        {
            // Используем фиксированное значение вместо MinStock
            return await _context.Products
                .Include(p => p.Category)
                .Where(p => p.CurrentStock <= 10) // Фиксированный порог
                .ToListAsync();
        }

        public async Task<IEnumerable<Product>> GetExpiringProductsAsync(int daysThreshold)
        {
            var thresholdDate = DateTime.UtcNow.AddDays(daysThreshold);
            return await _context.Products
                .Include(p => p.Category)
                .Where(p => p.ExpiryDate.HasValue && p.ExpiryDate.Value <= thresholdDate)
                .ToListAsync();
        }

        public async Task UpdateStockAsync(int productId, int quantity)
        {
            var product = await GetByIdAsync(productId);
            if (product != null)
            {
                product.CurrentStock = quantity;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> ExistsByNameAsync(string name, int? excludeProductId = null)
        {
            var query = _context.Products.Where(p => p.Name == name);

            if (excludeProductId.HasValue)
                query = query.Where(p => p.ProductId != excludeProductId.Value);

            return await query.AnyAsync();
        }

        public async Task<bool> HasOrdersAsync(int productId)
        {
            return await _context.OrderItems.AnyAsync(oi => oi.ProductId == productId);
        }

        public async Task<IEnumerable<Product>> SearchAsync(string searchTerm)
        {
            return await _context.Products
                .Include(p => p.Category)
                .Where(p => p.Name.Contains(searchTerm) ||
                           (p.Description != null && p.Description.Contains(searchTerm)))
                .ToListAsync();
        }

        public async Task<IEnumerable<Product>> GetByCategoriesAsync(IEnumerable<int> categoryIds)
        {
            var idsList = categoryIds.ToList();
            return await _context.Products
                .Where(p => p.CategoryId.HasValue && idsList.Contains(p.CategoryId.Value))
                .Include(p => p.Category)
                .Include(p => p.Farmer)
                    .ThenInclude(f => f.Profile)
                .Include(p => p.Farmer)
                    .ThenInclude(f => f.Addresses)
                .ToListAsync();
        }

        public async Task<int> GetCountByCategoriesAsync(IEnumerable<int> categoryIds)
        {
            var idsList = categoryIds.ToList();
            return await _context.Products
                .CountAsync(p => p.CategoryId.HasValue && idsList.Contains(p.CategoryId.Value));
        }

        public async Task<ProductSalesData> GetSalesDataByCategoriesAsync(IEnumerable<int> categoryIds)
        {
            var idsList = categoryIds.ToList();

            var products = await _context.Products
                .Where(p => p.CategoryId.HasValue && idsList.Contains(p.CategoryId.Value))
                .Include(p => p.OrderItems)
                .ToListAsync();

            var totalSales = products.Sum(p => p.OrderItems?.Sum(oi => oi.Quantity) ?? 0);
            var totalRevenue = products.Sum(p => p.OrderItems?.Sum(oi => oi.TotalPrice) ?? 0);

            return new ProductSalesData
            {
                TotalSales = totalSales,
                TotalRevenue = totalRevenue
            };
        }

        public async Task<IEnumerable<Product>> GetProductsByFarmerIdAsync(int farmerId)
        {
            return await _context.Products
                .Where(p => p.FarmerId == farmerId)
                .Include(p => p.Category)
                .Include(p => p.Farmer)
                    .ThenInclude(f => f.Profile)
                .Include(p => p.Farmer)
                    .ThenInclude(f => f.Addresses)
                .ToListAsync();
        }
        public async Task<int> GetCountByFarmerIdAsync(int farmerId)
        {
            return await _context.Products
                .CountAsync(p => p.FarmerId == farmerId);
        }
    }
}