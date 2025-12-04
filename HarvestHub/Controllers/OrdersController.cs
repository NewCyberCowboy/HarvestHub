using HarvestHub.Common;
using HarvestHub.DTOs;
using HarvestHub.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HarvestHub.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;

        public OrdersController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<OrderDto>>> CreateOrder(CreateOrderDto orderDto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var order = await _orderService.CreateOrderAsync(orderDto, userId);
            return Ok(ApiResponse<OrderDto>.SuccessResult(order, "Order created successfully"));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<OrderDto>>> GetOrder(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var order = await _orderService.GetOrderByIdAsync(id, userId);
            return Ok(ApiResponse<OrderDto>.SuccessResult(order));
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

        [HttpPut("{id}/status")]
        public async Task<ActionResult<ApiResponse<OrderDto>>> UpdateOrderStatus(
            int id, UpdateOrderStatusDto statusDto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var order = await _orderService.UpdateOrderStatusAsync(id, statusDto, userId);
            return Ok(ApiResponse<OrderDto>.SuccessResult(order, "Order status updated"));
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> CancelOrder(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _orderService.CancelOrderAsync(id, userId);
            return Ok(ApiResponse<bool>.SuccessResult(result, "Order cancelled successfully"));
        }
    }
}
