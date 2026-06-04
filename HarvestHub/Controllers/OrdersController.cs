using HarvestHub.Common;
using HarvestHub.DTOs;
using HarvestHub.Services.Interfaces;
using HarvestHub.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;

namespace HarvestHub.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;
        private readonly ILogger<OrdersController> _logger;
        private readonly INotificationsService _notificationsService;

        public OrdersController(IOrderService orderService, ILogger<OrdersController> logger, INotificationsService notificationsService)
        {
            _orderService = orderService;
            _logger = logger;
            _notificationsService = notificationsService;
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<OrderDto>>> CreateOrder(CreateOrderDto orderDto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var order = await _orderService.CreateOrderAsync(orderDto, userId);
            
            // Send notification to farmer about new order
            await _notificationsService.SendNewOrderNotificationAsync(order.OrderId);
            
            return Ok(ApiResponse<OrderDto>.SuccessResult(order, "Order created successfully"));
        }

        // Специфичные маршруты должны быть ПЕРЕД параметризованными маршрутами
        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<List<OrderDto>>>> GetAllOrders()
        {
            try
            {
                var orders = await _orderService.GetAllOrdersAsync();
                return Ok(ApiResponse<List<OrderDto>>.SuccessResult(orders));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all orders");
                return StatusCode(500, ApiResponse<string>.ErrorResult($"Error: {ex.Message}"));
            }
        }

        [HttpGet("my-orders")]
        public async Task<ActionResult<ApiResponse<List<OrderDto>>>> GetMyOrders()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var orders = await _orderService.GetUserOrdersAsync(userId);
            return Ok(ApiResponse<List<OrderDto>>.SuccessResult(orders));
        }

        [HttpGet("farmer/orders")]
        [Authorize(Roles = "Farmer,Admin")]
        public async Task<ActionResult<ApiResponse<List<OrderDto>>>> GetFarmerOrders()
        {
            var farmerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var orders = await _orderService.GetFarmerOrdersAsync(farmerId);
            return Ok(ApiResponse<List<OrderDto>>.SuccessResult(orders));
        }

        [HttpGet("farmer/analytics")]
        [Authorize(Roles = "Farmer,Admin")]
        public async Task<ActionResult<ApiResponse<FarmerAnalyticsDto>>> GetFarmerAnalytics([FromQuery] int days = 30)
        {
            var farmerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var analytics = await _orderService.GetFarmerAnalyticsAsync(farmerId, days);
            return Ok(ApiResponse<FarmerAnalyticsDto>.SuccessResult(analytics));
        }

        // Параметризованный маршрут должен быть ПОСЛЕ всех специфичных маршрутов
        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<OrderDto>>> GetOrder(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var order = await _orderService.GetOrderByIdAsync(id, userId);
            return Ok(ApiResponse<OrderDto>.SuccessResult(order));
        }

        [HttpPut("{id}/status")]
        public async Task<ActionResult<ApiResponse<OrderDto>>> UpdateOrderStatus(
            int id, UpdateOrderStatusDto statusDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(x => x.Value?.Errors.Count > 0)
                        .SelectMany(x => x.Value.Errors.Select(e => $"{x.Key}: {e.ErrorMessage}"))
                        .ToList();
                    var errorMessage = errors.Any()
                        ? string.Join("; ", errors)
                        : "Invalid model state";
                    return BadRequest(ApiResponse<string>.ErrorResult(errorMessage));
                }

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var order = await _orderService.UpdateOrderStatusAsync(id, statusDto, userId);
                
                // Send notification to user about status change
                await _notificationsService.SendOrderStatusChangedNotificationAsync(id, statusDto.Status);
                
                return Ok(ApiResponse<OrderDto>.SuccessResult(order, "Order status updated"));
            }
            catch (ArgumentException ex)
            {
                return NotFound(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (Exception ex)
            {
                // Логируем полную ошибку для отладки
                _logger.LogError(ex, "Error updating order status for order {OrderId}: {ErrorMessage}", id, ex.Message);
                return StatusCode(500, ApiResponse<string>.ErrorResult($"Internal server error: {ex.Message}"));
            }
        }

        [HttpPut("{id}/weights")]
        [Authorize(Roles = "Farmer,Admin")]
        public async Task<ActionResult<ApiResponse<OrderDto>>> UpdateOrderWeights(int id, UpdateOrderWeightsDto weightsDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(x => x.Value?.Errors.Count > 0)
                        .SelectMany(x => x.Value.Errors.Select(e => $"{x.Key}: {e.ErrorMessage}"))
                        .ToList();
                    var errorMessage = errors.Any()
                        ? string.Join("; ", errors)
                        : "Invalid model state";
                    return BadRequest(ApiResponse<string>.ErrorResult(errorMessage));
                }

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var order = await _orderService.UpdateOrderWeightsAsync(id, weightsDto, userId);
                
                // Send notifications to user about weight updates
                foreach (var item in weightsDto.Items)
                {
                    // Match by index since OrderItemDto doesn't have OrderItemId
                    var index = weightsDto.Items.IndexOf(item);
                    if (index < order.Items.Count)
                    {
                        var orderItem = order.Items[index];
                        // Use a generic product name since OrderItemDto doesn't have Product details
                        await _notificationsService.SendOrderWeightUpdatedNotificationAsync(
                            id,
                            $"Товар #{orderItem.ProductId}",
                            (double)item.ActualWeight
                        );
                    }
                }
                
                return Ok(ApiResponse<OrderDto>.SuccessResult(order, "Order weights updated. Customer will be notified."));
            }
            catch (ArgumentException ex)
            {
                return NotFound(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ApiResponse<string>.ErrorResult(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating order weights for order {OrderId}", id);
                return StatusCode(500, ApiResponse<string>.ErrorResult($"Error: {ex.Message}"));
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> CancelOrder(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _orderService.CancelOrderAsync(id, userId);
            
            // Send notification about order cancellation
            await _notificationsService.SendOrderCancelledNotificationAsync(id, null);
            
            return Ok(ApiResponse<bool>.SuccessResult(result, "Order cancelled successfully"));
        }
    }
}
