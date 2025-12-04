using HarvestHub.Models;

namespace HarvestHub.Repositories.Interfaces
{
    public interface IOrderRepository : IRepository<Order>
    {
        Task<Order?> GetOrderByIdAsync(int orderId);
        Task<List<Order>> GetOrdersByCustomerIdAsync(int customerId);
        Task<List<Order>> GetOrdersByFarmerIdAsync(int farmerId);
        Task AddOrderStatusHistoryAsync(OrderStatusHistory statusHistory);
        Task<List<OrderStatusHistory>> GetOrderStatusHistoryAsync(int orderId);

        Task<int> GetCountByUserIdAsync(int userId);
    }
}
