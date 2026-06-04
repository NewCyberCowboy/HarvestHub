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

            decimal productsAmount = 0;
            var orderItems = new List<OrderItem>();

            // 2. Проверка наличия и расчет стоимости (по ожидаемому весу)
            foreach (var itemDto in orderDto.Items)
            {
                var product = await _productRepository.GetByIdAsync(itemDto.ProductId);
                if (product == null)
                    throw new ArgumentException($"Product with ID {itemDto.ProductId} not found");

                // Используем ожидаемый вес, если указан, иначе quantity
                decimal expectedWeight = itemDto.ExpectedWeight ?? itemDto.Quantity;
                
                if (product.CurrentStock < expectedWeight)
                    throw new InvalidOperationException($"Insufficient stock for product: {product.Name}");

                if (product.Status != "Available")
                    throw new InvalidOperationException($"Product {product.Name} is not available");

                // Расчет по весу: цена за кг * ожидаемый вес
                var itemTotal = product.BasePrice * expectedWeight;
                productsAmount += itemTotal;

                orderItems.Add(new OrderItem
                {
                    ProductId = product.ProductId,
                    Quantity = itemDto.Quantity, // Для обратной совместимости
                    ExpectedWeight = expectedWeight,
                    ActualWeight = null, // Будет указан фермером позже
                    UnitPrice = product.BasePrice, // Цена за кг
                    TotalPrice = itemTotal
                });

                // Резервирование товара (по ожидаемому весу)
                product.CurrentStock -= (int)Math.Ceiling(expectedWeight);
                await _productRepository.UpdateAsync(product);
            }

            // 3. Извлечение города из адреса доставки
            string? customerCity = ExtractCityFromAddress(orderDto.DeliveryAddress);
            
            // 4. Получение города фермера (из первого продукта)
            string? farmerCity = null;
            if (orderItems.Any())
            {
                var firstProduct = await _productRepository.GetByIdAsync(orderItems.First().ProductId);
                if (firstProduct?.Farmer != null)
                {
                    // Пробуем получить город из адресов фермера
                    if (firstProduct.Farmer.Addresses != null && firstProduct.Farmer.Addresses.Any())
                    {
                        var farmerAddress = firstProduct.Farmer.Addresses.FirstOrDefault(a => a.IsDefault) 
                            ?? firstProduct.Farmer.Addresses.First();
                        farmerCity = farmerAddress.City;
                    }
                }
            }

            // 5. Расчет доставки
            decimal deliveryAmount = CalculateDeliveryPrice(productsAmount, customerCity, farmerCity);

            order.OrderItems = orderItems;
            order.ProductsAmount = productsAmount;
            order.DeliveryAmount = deliveryAmount;
            order.TotalAmount = productsAmount + deliveryAmount;
            order.CustomerCity = customerCity;
            order.FarmerCity = farmerCity;
            order.Status = "AwaitingWeight"; // Новый статус - ожидает указания реального веса

            // 3. Создание заказа
            var createdOrder = await _orderRepository.AddAsync(order);

            // 6. Добавление истории статуса
            await _orderRepository.AddOrderStatusHistoryAsync(new OrderStatusHistory
            {
                OrderId = createdOrder.OrderId,
                Status = "AwaitingWeight",
                ChangedAt = DateTime.UtcNow,
                ChangedBy = customerId,
                Notes = "Order created, awaiting farmer weight confirmation"
            });

            _logger.LogInformation("Order created: {OrderId}, Total: {TotalAmount}", createdOrder.OrderId, order.TotalAmount);

            return MapToOrderDto(createdOrder);
        }

        public async Task<OrderDto> UpdateOrderStatusAsync(int orderId, UpdateOrderStatusDto statusDto, int userId)
        {
            try
            {
                _logger.LogInformation("Updating order status: OrderId={OrderId}, NewStatus={Status}, UserId={UserId}", 
                    orderId, statusDto.Status, userId);

                var order = await _orderRepository.GetByIdAsync(orderId);
                if (order == null)
                {
                    _logger.LogWarning("Order not found: {OrderId}", orderId);
                    throw new ArgumentException("Order not found");
                }

                // Проверка прав доступа
                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("User not found: {UserId}", userId);
                    throw new ArgumentException("User not found");
                }

                if (user.Role != "Admin" && order.CustomerId != userId)
                {
                    // Проверка, является ли пользователь фермером, которому принадлежат товары
                    var isFarmerOrder = order.OrderItems?.Any(i => i.Product != null && i.Product.FarmerId == userId) ?? false;
                    if (!isFarmerOrder)
                    {
                        _logger.LogWarning("Access denied for user {UserId} to order {OrderId}", userId, orderId);
                        throw new UnauthorizedAccessException("Access denied");
                    }
                }

                // Валидация перехода статуса
                var normalizedFromStatus = NormalizeStatus(order.Status);
                var normalizedToStatus = NormalizeStatus(statusDto.Status);
                
                if (!IsValidStatusTransition(normalizedFromStatus, normalizedToStatus))
                {
                    _logger.LogWarning("Invalid status transition: From={FromStatus} (normalized: {NormalizedFrom}), To={ToStatus} (normalized: {NormalizedTo})", 
                        order.Status, normalizedFromStatus, statusDto.Status, normalizedToStatus);
                    throw new InvalidOperationException($"Недопустимый переход статуса: из '{order.Status}' в '{statusDto.Status}'. Разрешенные переходы из '{order.Status}': {GetAllowedTransitions(normalizedFromStatus)}");
                }

                order.Status = statusDto.Status;
                order.UpdatedAt = DateTime.UtcNow;

                await _orderRepository.UpdateAsync(order);
                _logger.LogInformation("Order updated in database: {OrderId}", orderId);

                // Добавляем историю статуса
                await _orderRepository.AddOrderStatusHistoryAsync(new OrderStatusHistory
                {
                    OrderId = orderId,
                    Status = statusDto.Status,
                    ChangedAt = DateTime.UtcNow,
                    ChangedBy = userId,
                    Notes = statusDto.Notes
                });
                _logger.LogInformation("Status history added: {OrderId}", orderId);

                // Загружаем обновленную StatusHistory из БД
                var updatedHistory = await _orderRepository.GetOrderStatusHistoryAsync(orderId);
                order.StatusHistory = updatedHistory;

                _logger.LogInformation("Mapping order to DTO: {OrderId}, StatusHistory count: {Count}", 
                    orderId, order.StatusHistory?.Count ?? 0);
                
                var result = MapToOrderDto(order);
                _logger.LogInformation("Order status updated successfully: {OrderId}, New Status: {Status}", 
                    orderId, statusDto.Status);

                return result;
            }
            catch (ArgumentException ex)
            {
                _logger.LogError(ex, "ArgumentException in UpdateOrderStatusAsync: {Message}", ex.Message);
                throw;
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError(ex, "UnauthorizedAccessException in UpdateOrderStatusAsync: {Message}", ex.Message);
                throw;
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "InvalidOperationException in UpdateOrderStatusAsync: {Message}", ex.Message);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in UpdateOrderStatusAsync for order {OrderId}: {Message}", 
                    orderId, ex.Message);
                throw;
            }
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

        public async Task<FarmerAnalyticsDto> GetFarmerAnalyticsAsync(int farmerId, int periodDays)
        {
            if (periodDays <= 0)
            {
                periodDays = 30;
            }

            var orders = await _orderRepository.GetOrdersByFarmerIdAsync(farmerId);
            var now = DateTime.UtcNow;
            var fromDate = now.Date.AddDays(-periodDays + 1);

            var nonCancelledOrders = orders
                .Where(o => !string.Equals(o.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
                .ToList();

            var periodOrders = nonCancelledOrders
                .Where(o => o.CreatedAt.Date >= fromDate && o.CreatedAt.Date <= now.Date)
                .ToList();

            var revenueTotal = periodOrders.Sum(o => o.TotalAmount);
            var ordersCount = periodOrders.Count;
            var averageOrderValue = ordersCount > 0 ? revenueTotal / ordersCount : 0m;

            var itemsSoldTotal = periodOrders
                .SelectMany(o => o.OrderItems)
                .Sum(i => i.ActualWeight ?? i.ExpectedWeight ?? i.Quantity);
            var averageItemsPerOrder = ordersCount > 0 ? itemsSoldTotal / ordersCount : 0m;

            var uniqueCustomers = periodOrders.Select(o => o.CustomerId).Distinct().Count();
            var newCustomers = nonCancelledOrders
                .GroupBy(o => o.CustomerId)
                .Count(g => g.Min(x => x.CreatedAt.Date) >= fromDate);
            var repeatCustomers = periodOrders
                .GroupBy(o => o.CustomerId)
                .Count(g => g.Count() >= 2);

            var completedOrders = periodOrders.Count(o =>
                string.Equals(o.Status, "Completed", StringComparison.OrdinalIgnoreCase));
            var cancelledOrders = periodOrders.Count(o =>
                string.Equals(o.Status, "Cancelled", StringComparison.OrdinalIgnoreCase));

            var revenueByDay = periodOrders
                .GroupBy(o => o.CreatedAt.Date)
                .ToDictionary(
                    g => g.Key,
                    g => new DailyRevenuePointDto
                    {
                        Date = g.Key,
                        Revenue = g.Sum(x => x.TotalAmount),
                        Orders = g.Count()
                    });

            var dailySeries = new List<DailyRevenuePointDto>();
            for (var i = 0; i < periodDays; i++)
            {
                var day = fromDate.AddDays(i);
                if (revenueByDay.TryGetValue(day, out var point))
                {
                    dailySeries.Add(point);
                }
                else
                {
                    dailySeries.Add(new DailyRevenuePointDto
                    {
                        Date = day,
                        Revenue = 0,
                        Orders = 0
                    });
                }
            }

            var statusBreakdown = periodOrders
                .GroupBy(o => o.Status)
                .Select(g => new StatusCountDto
                {
                    Status = g.Key,
                    Count = g.Count()
                })
                .OrderByDescending(s => s.Count)
                .ToList();

            var orderItems = periodOrders
                .SelectMany(o => o.OrderItems.Select(i => new
                {
                    Item = i,
                    ProductName = i.Product?.Name ?? $"Товар #{i.ProductId}",
                    CategoryName = i.Product?.Category?.Name ?? "Без категории"
                }))
                .ToList();

            var topProducts = orderItems
                .GroupBy(i => new { i.Item.ProductId, i.ProductName })
                .Select(g => new TopProductDto
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.ProductName,
                    Revenue = g.Sum(x => x.Item.TotalPrice),
                    Quantity = g.Sum(x => x.Item.ActualWeight ?? x.Item.ExpectedWeight ?? x.Item.Quantity)
                })
                .OrderByDescending(p => p.Revenue)
                .Take(5)
                .ToList();

            var categoryBreakdown = orderItems
                .GroupBy(i => i.CategoryName)
                .Select(g => new CategorySalesDto
                {
                    CategoryName = g.Key,
                    Revenue = g.Sum(x => x.Item.TotalPrice),
                    Quantity = g.Sum(x => x.Item.ActualWeight ?? x.Item.ExpectedWeight ?? x.Item.Quantity)
                })
                .OrderByDescending(c => c.Revenue)
                .ToList();

            return new FarmerAnalyticsDto
            {
                PeriodDays = periodDays,
                FromDate = fromDate,
                ToDate = now.Date,
                RevenueTotal = revenueTotal,
                OrdersCount = ordersCount,
                AverageOrderValue = averageOrderValue,
                ItemsSoldTotal = itemsSoldTotal,
                AverageItemsPerOrder = averageItemsPerOrder,
                UniqueCustomers = uniqueCustomers,
                NewCustomers = newCustomers,
                RepeatCustomers = repeatCustomers,
                CompletedOrders = completedOrders,
                CancelledOrders = cancelledOrders,
                RevenueByDay = dailySeries,
                StatusBreakdown = statusBreakdown,
                TopProducts = topProducts,
                CategoryBreakdown = categoryBreakdown
            };
        }

        public async Task<List<OrderDto>> GetAllOrdersAsync()
        {
            var orders = await _orderRepository.GetAllAsync();
            return orders.Select(MapToOrderDto).ToList();
        }

        public async Task<OrderDto> UpdateOrderWeightsAsync(int orderId, UpdateOrderWeightsDto weightsDto, int userId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
                throw new ArgumentException("Order not found");

            // Проверка прав: только фермер, которому принадлежат товары
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null || user.Role != "Farmer")
                throw new UnauthorizedAccessException("Only farmers can update order weights");

            var isFarmerOrder = order.OrderItems?.Any(i => i.Product != null && i.Product.FarmerId == userId) ?? false;
            if (!isFarmerOrder)
                throw new UnauthorizedAccessException("You can only update weights for your own orders");

            // Обновляем реальный вес для каждого товара
            decimal newProductsAmount = 0;
            foreach (var weightItem in weightsDto.Items)
            {
                var orderItem = order.OrderItems?.FirstOrDefault(i => i.OrderItemId == weightItem.OrderItemId);
                if (orderItem == null)
                    throw new ArgumentException($"Order item with ID {weightItem.OrderItemId} not found");

                orderItem.ActualWeight = weightItem.ActualWeight;
                // Пересчитываем цену на основе реального веса
                orderItem.TotalPrice = orderItem.UnitPrice * weightItem.ActualWeight;
                newProductsAmount += orderItem.TotalPrice;
            }

            // Пересчитываем доставку на основе новой суммы товаров
            decimal newDeliveryAmount = CalculateDeliveryPrice(newProductsAmount, order.CustomerCity, order.FarmerCity);
            
            order.ProductsAmount = newProductsAmount;
            order.DeliveryAmount = newDeliveryAmount;
            order.TotalAmount = newProductsAmount + newDeliveryAmount;
            order.Status = "ReadyToShip"; // Меняем статус на "Готов к отправке"
            order.UpdatedAt = DateTime.UtcNow;

            // Добавляем в историю
            await _orderRepository.AddOrderStatusHistoryAsync(new OrderStatusHistory
            {
                OrderId = order.OrderId,
                Status = "ReadyToShip",
                ChangedAt = DateTime.UtcNow,
                ChangedBy = userId,
                Notes = "Farmer confirmed actual weights, order ready to ship"
            });

            var updated = await _orderRepository.UpdateAsync(order);
            _logger.LogInformation("Order weights updated: {OrderId}, New Total: {TotalAmount}", orderId, order.TotalAmount);

            return MapToOrderDto(updated);
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
            // Нормализуем статусы (первая буква заглавная, остальные строчные)
            fromStatus = NormalizeStatus(fromStatus);
            toStatus = NormalizeStatus(toStatus);

            var validTransitions = new Dictionary<string, List<string>>
            {
                ["Pending"] = new() { "Confirmed", "Processing", "Cancelled" },
                ["Confirmed"] = new() { "Processing", "Shipped", "Cancelled" },
                ["Processing"] = new() { "Shipped", "Delivered", "Cancelled" },
                ["Shipped"] = new() { "Delivered" },
                ["Delivered"] = new() { },
                ["Cancelled"] = new() { },
                ["Completed"] = new() { } // Добавляем Completed как финальный статус
            };

            // Если статусы одинаковые, это валидный переход (не меняем статус)
            if (fromStatus == toStatus)
                return true;

            // Если исходный статус не найден в словаре, разрешаем переход (для обратной совместимости)
            if (!validTransitions.ContainsKey(fromStatus))
                return true;

            return validTransitions[fromStatus].Contains(toStatus);
        }

        private static string NormalizeStatus(string status)
        {
            if (string.IsNullOrWhiteSpace(status))
                return status;

            // Нормализуем: первая буква заглавная, остальные строчные
            return char.ToUpperInvariant(status[0]) + status.Substring(1).ToLowerInvariant();
        }

        private static string GetAllowedTransitions(string fromStatus)
        {
            var validTransitions = new Dictionary<string, List<string>>
            {
                ["Pending"] = new() { "AwaitingWeight", "Confirmed", "Processing", "Cancelled" },
                ["AwaitingWeight"] = new() { "ReadyToShip", "Cancelled" }, // Ожидает указания реального веса
                ["ReadyToShip"] = new() { "Shipped", "Cancelled" }, // Готов к отправке (вес указан)
                ["Confirmed"] = new() { "Processing", "Shipped", "Cancelled" },
                ["Processing"] = new() { "Shipped", "Delivered", "Cancelled" },
                ["Shipped"] = new() { "Delivered" },
                ["Delivered"] = new() { "Нет разрешенных переходов (финальный статус)" },
                ["Cancelled"] = new() { "Нет разрешенных переходов (финальный статус)" },
                ["Completed"] = new() { "Нет разрешенных переходов (финальный статус)" }
            };

            if (validTransitions.ContainsKey(fromStatus) && validTransitions[fromStatus].Any())
                return string.Join(", ", validTransitions[fromStatus]);
            
            return "Нет разрешенных переходов";
        }

        // Метод для извлечения города из адреса
        private string? ExtractCityFromAddress(string address)
        {
            if (string.IsNullOrWhiteSpace(address))
                return null;

            // Простой парсинг: ищем город после запятой или в конце
            // Формат: "улица, город, индекс" или "город, улица"
            var parts = address.Split(',');
            if (parts.Length >= 2)
            {
                // Обычно город во второй части
                return parts[1].Trim();
            }
            
            // Если формат другой, пробуем найти известные города
            var cities = new[] { "Москва", "Санкт-Петербург", "Екатеринбург", "Новосибирск", "Казань" };
            foreach (var city in cities)
            {
                if (address.Contains(city, StringComparison.OrdinalIgnoreCase))
                    return city;
            }

            return null;
        }

        // Метод для расчета стоимости доставки
        private decimal CalculateDeliveryPrice(decimal productsAmount, string? customerCity, string? farmerCity)
        {
            const decimal baseDeliveryPrice = 200m; // Базовая цена доставки
            const decimal freeDeliveryThreshold = 2000m; // Порог для бесплатной доставки

            // Если фермер и клиент в одном городе и сумма >= порога - бесплатно
            if (!string.IsNullOrEmpty(customerCity) && 
                !string.IsNullOrEmpty(farmerCity) &&
                customerCity.Equals(farmerCity, StringComparison.OrdinalIgnoreCase) &&
                productsAmount >= freeDeliveryThreshold)
            {
                return 0;
            }

            // Расчет процента доставки в зависимости от суммы заказа
            decimal deliveryPercent;
            if (productsAmount >= 5000)
                deliveryPercent = 0.05m; // 5% для заказов от 5000
            else if (productsAmount >= 3000)
                deliveryPercent = 0.08m; // 8% для заказов от 3000
            else if (productsAmount >= 1500)
                deliveryPercent = 0.10m; // 10% для заказов от 1500
            else
                deliveryPercent = 0.15m; // 15% для заказов до 1500

            decimal calculatedDelivery = productsAmount * deliveryPercent;

            // Минимальная цена доставки
            return Math.Max(calculatedDelivery, baseDeliveryPrice);
        }

        private static OrderDto MapToOrderDto(Order order)
        {
            return new OrderDto
            {
                OrderId = order.OrderId,
                OrderNumber = order.OrderNumber,
                TotalAmount = order.TotalAmount,
                ProductsAmount = order.ProductsAmount,
                DeliveryAmount = order.DeliveryAmount,
                Status = order.Status,
                DeliveryAddress = order.DeliveryAddress,
                CustomerCity = order.CustomerCity,
                FarmerCity = order.FarmerCity,
                CustomerNotes = order.CustomerNotes,
                CreatedAt = order.CreatedAt,
                UpdatedAt = order.UpdatedAt,
                Items = order.OrderItems?.Select(i => new OrderItemDto
                {
                    ProductId = i.ProductId,
                    Quantity = i.Quantity,
                    ExpectedWeight = i.ExpectedWeight,
                    ActualWeight = i.ActualWeight,
                    Price = i.UnitPrice
                }).ToList() ?? new List<OrderItemDto>(),
                StatusHistory = order.StatusHistory?.Select(sh => new OrderStatusHistoryDto
                {
                    Status = sh.Status,
                    ChangedAt = sh.ChangedAt,
                    Notes = sh.Notes
                }).OrderBy(sh => sh.ChangedAt).ToList() ?? new List<OrderStatusHistoryDto>()
            };
        }
    }
}