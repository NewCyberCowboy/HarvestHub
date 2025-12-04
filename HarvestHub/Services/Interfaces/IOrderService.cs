using HarvestHub.DTOs;

namespace HarvestHub.Services.Interfaces
{
    public interface IOrderService
    {
        Task<OrderDto> CreateOrderAsync(CreateOrderDto orderDto, int customerId);
        Task<OrderDto> GetOrderByIdAsync(int orderId, int userId);
        Task<List<OrderDto>> GetUserOrdersAsync(int userId);
        Task<List<OrderDto>> GetFarmerOrdersAsync(int farmerId);
        Task<OrderDto> UpdateOrderStatusAsync(int orderId, UpdateOrderStatusDto statusDto, int userId);
        Task<bool> CancelOrderAsync(int orderId, int userId);
    }
}

