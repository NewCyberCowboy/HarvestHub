using HarvestHub.DTOs;
using HarvestHub.Models;
using HarvestHub.Repositories.Interfaces;
using HarvestHub.Services.Interfaces;

namespace HarvestHub.Services.Implementations
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IProductRepository _productRepository;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<OrderService> _logger;

        public OrderService(
            IOrderRepository orderRepository,
            IProductRepository productRepository,
            IUserRepository userRepository,
            ILogger<OrderService> logger)
        {
            _orderRepository = orderRepository;
            _productRepository = productRepository;
            _userRepository = userRepository;
            _logger = logger;
        }

        public async Task<OrderDto> CreateOrderAsync(CreateOrderDto orderDto, int customerId)
        {
            // 1. Валидация пользователя
            var customer = await _userRepository.GetByIdAsync(customerId);
            if (customer == null)

                throw new ArgumentException("User not found");

            var order = new Order
            {
                OrderNumber = GenerateOrderNumber(),
                CustomerId = customerId,
                DeliveryAddress = orderDto.DeliveryAddress,
                CustomerNotes = orderDto.CustomerNotes,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            decimal totalAmount = 0;
            var orderItems = new List<OrderItem>();

            // 2. Проверка наличия и расчет стоимости
            foreach (var itemDto in orderDto.Items)
            {
                var product = await _productRepository.GetByIdAsync(itemDto.ProductId);
                if (product == null)
                    throw new ArgumentException($"Product with ID {itemDto.ProductId} not found");

                if (product.CurrentStock < itemDto.Quantity)
                    throw new InvalidOperationException($"Insufficient stock for product: {product.Name}");

                if (product.Status != "Available")
                    throw new InvalidOperationException($"Product {product.Name} is not available");

                var itemTotal = product.BasePrice * itemDto.Quantity;
                totalAmount += itemTotal;

                orderItems.Add(new OrderItem
                {
                    ProductId = product.ProductId,
                    Quantity = itemDto.Quantity,
                    UnitPrice = product.BasePrice,
                    TotalPrice = itemTotal
                });

                // Резервирование товара
                product.CurrentStock -= itemDto.Quantity;
                await _productRepository.UpdateAsync(product);
            }

            order.OrderItems = orderItems;
            order.TotalAmount = totalAmount;

            // 3. Создание заказа
            var createdOrder = await _orderRepository.AddAsync(order);

            // 4. Добавление истории статуса
            await _orderRepository.AddOrderStatusHistoryAsync(new OrderStatusHistory
            {
                OrderId = createdOrder.OrderId,
                Status = "Pending",
                ChangedAt = DateTime.UtcNow,
                ChangedBy = customerId,
                Notes = "Order created"
            });

            _logger.LogInformation("Order created: {OrderId}, Total: {TotalAmount}", createdOrder.OrderId, totalAmount);

            return MapToOrderDto(createdOrder);
        }

        public async Task<OrderDto> UpdateOrderStatusAsync(int orderId, UpdateOrderStatusDto statusDto, int userId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
                throw new ArgumentException("Order not found");

            // Проверка прав доступа
            var user = await _userRepository.GetByIdAsync(userId);
            if (user!.Role != "Admin" && order.CustomerId != userId)
            {
                // Проверка, является ли пользователь фермером, которому принадлежат товары
                var isFarmerOrder = order.OrderItems.Any(i => i.Product.FarmerId == userId);
                if (!isFarmerOrder)
                    throw new UnauthorizedAccessException("Access denied");
            }

            // Валидация перехода статуса
            if (!IsValidStatusTransition(order.Status, statusDto.Status))
                throw new InvalidOperationException($"Invalid status transition from {order.Status} to {statusDto.Status}");

            order.Status = statusDto.Status;
            order.UpdatedAt = DateTime.UtcNow;

            await _orderRepository.UpdateAsync(order);
            await _orderRepository.AddOrderStatusHistoryAsync(new OrderStatusHistory
            {
                OrderId = orderId,
                Status = statusDto.Status,
                ChangedAt = DateTime.UtcNow,
                ChangedBy = userId,
                Notes = statusDto.Notes
            });

            _logger.LogInformation("Order status updated: {OrderId}, New Status: {Status}", orderId, statusDto.Status);

            return MapToOrderDto(order);
        }

        public async Task<OrderDto> GetOrderByIdAsync(int orderId, int userId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
                throw new ArgumentException("Order not found");

            // Проверка прав доступа
            var user = await _userRepository.GetByIdAsync(userId);
            if (user!.Role != "Admin" && order.CustomerId != userId)
            {
                var isFarmerOrder = order.OrderItems.Any(i => i.Product.FarmerId == userId);
                if (!isFarmerOrder)
                    throw new UnauthorizedAccessException("Access denied");
            }

            return MapToOrderDto(order);
        }

        public async Task<List<OrderDto>> GetUserOrdersAsync(int userId)
        {
            var orders = await _orderRepository.GetOrdersByCustomerIdAsync(userId);
            return orders.Select(MapToOrderDto).ToList();
        }

        public async Task<List<OrderDto>> GetFarmerOrdersAsync(int farmerId)
        {
            var orders = await _orderRepository.GetOrdersByFarmerIdAsync(farmerId);
            return orders.Select(MapToOrderDto).ToList();
        }

        public async Task<bool> CancelOrderAsync(int orderId, int userId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
                throw new ArgumentException("Order not found");

            var user = await _userRepository.GetByIdAsync(userId);
            bool isAdmin = user?.Role == "Admin";

            if (order.CustomerId != userId && !isAdmin)
                throw new UnauthorizedAccessException("Access denied");

            if (order.Status != "Pending" && order.Status != "Confirmed")
                throw new InvalidOperationException("Cannot cancel order in current status");

            // Возврат товара на склад
            foreach (var item in order.OrderItems)
            {
                var product = await _productRepository.GetByIdAsync(item.ProductId);
                if (product != null)
                {
                    product.CurrentStock += item.Quantity;
                    await _productRepository.UpdateAsync(product);
                }
            }

            order.Status = "Cancelled";
            order.UpdatedAt = DateTime.UtcNow;

            await _orderRepository.UpdateAsync(order);
            await _orderRepository.AddOrderStatusHistoryAsync(new OrderStatusHistory
            {
                OrderId = orderId,
                Status = "Cancelled",
                ChangedAt = DateTime.UtcNow,
                ChangedBy = userId,
                Notes = "Order cancelled by user"
            });

            _logger.LogInformation("Order cancelled: {OrderId}", orderId);
            return true;
        }

        private static string GenerateOrderNumber()
        {
            return $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..8].ToUpper()}";
        }

        private static bool IsValidStatusTransition(string fromStatus, string toStatus)
        {
            var validTransitions = new Dictionary<string, List<string>>
            {
                ["Pending"] = new() { "Confirmed", "Cancelled" },
                ["Confirmed"] = new() { "Shipped", "Cancelled" },
                ["Shipped"] = new() { "Delivered" },
                ["Delivered"] = new() { },
                ["Cancelled"] = new() { }
            };

            return validTransitions.ContainsKey(fromStatus) &&
                   validTransitions[fromStatus].Contains(toStatus);
        }

        private static OrderDto MapToOrderDto(Order order)
        {
            return new OrderDto
            {
                OrderId = order.OrderId,
                OrderNumber = order.OrderNumber,
                TotalAmount = order.TotalAmount,
                Status = order.Status,
                DeliveryAddress = order.DeliveryAddress,
                CustomerNotes = order.CustomerNotes,
                CreatedAt = order.CreatedAt,
                UpdatedAt = order.UpdatedAt,
                Items = order.OrderItems.Select(i => new OrderItemDto
                {
                    ProductId = i.ProductId,
                    Quantity = i.Quantity
                }).ToList(),
                StatusHistory = order.StatusHistory.Select(sh => new OrderStatusHistoryDto
                {
                    Status = sh.Status,
                    ChangedAt = sh.ChangedAt,
                    Notes = sh.Notes
                }).OrderBy(sh => sh.ChangedAt).ToList()
            };
        }
    }
}