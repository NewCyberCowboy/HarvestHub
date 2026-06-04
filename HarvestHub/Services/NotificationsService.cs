using HarvestHub.DTOs;
using HarvestHub.Models;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace HarvestHub.Services
{
    public interface INotificationsService
    {
        Task SendOrderStatusChangedNotificationAsync(int orderId, string status);
        Task SendOrderWeightUpdatedNotificationAsync(int orderId, string productName, double weight);
        Task SendNewOrderNotificationAsync(int orderId);
        Task SendOrderDeliveredNotificationAsync(int orderId);
        Task SendOrderCancelledNotificationAsync(int orderId, string? reason);
    }

    public class NotificationsService : INotificationsService
    {
        private readonly ApplicationDbContext _context;

        public NotificationsService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task SendOrderStatusChangedNotificationAsync(int orderId, string status)
        {
            var order = await _context.Orders
                .Include(o => o.Customer)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null) return;

            var statusText = GetStatusText(status);

            var notification = new Notification
            {
                Title = "📦 Статус заказа обновлен",
                Body = $"Заказ #{order.OrderNumber}: {statusText}",
                Type = "order_status_changed",
                UserId = order.CustomerId,
                OrderId = orderId,
                Data = JsonSerializer.Serialize(new { status, orderNumber = order.OrderNumber })
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
        }

        public async Task SendOrderWeightUpdatedNotificationAsync(int orderId, string productName, double weight)
        {
            var order = await _context.Orders
                .Include(o => o.Customer)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null) return;

            var notification = new Notification
            {
                Title = "⚖️ Вес обновлен",
                Body = $"Заказ #{order.OrderNumber}: {productName} - {weight} кг",
                Type = "weight_updated",
                UserId = order.CustomerId,
                OrderId = orderId,
                Data = JsonSerializer.Serialize(new { productName, weight, orderNumber = order.OrderNumber })
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
        }

        public async Task SendNewOrderNotificationAsync(int orderId)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null) return;

            // Get the farmer ID from the first product in the order
            var farmerId = order.OrderItems.FirstOrDefault()?.Product?.FarmerId;
            if (farmerId == null) return;

            var notification = new Notification
            {
                Title = "🛒 Новый заказ!",
                Body = $"Заказ #{order.OrderNumber} на {order.TotalAmount:F2} ₽ ({order.OrderItems.Count} товаров)",
                Type = "new_order",
                UserId = farmerId.Value,
                OrderId = orderId,
                Data = JsonSerializer.Serialize(new { orderNumber = order.OrderNumber, totalAmount = order.TotalAmount })
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
        }

        public async Task SendOrderDeliveredNotificationAsync(int orderId)
        {
            var order = await _context.Orders
                .Include(o => o.Customer)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null) return;

            var notification = new Notification
            {
                Title = "✅ Заказ доставлен!",
                Body = $"Ваш заказ #{order.OrderNumber} успешно доставлен",
                Type = "order_delivered",
                UserId = order.CustomerId,
                OrderId = orderId,
                Data = JsonSerializer.Serialize(new { orderNumber = order.OrderNumber })
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
        }

        public async Task SendOrderCancelledNotificationAsync(int orderId, string? reason)
        {
            var order = await _context.Orders
                .Include(o => o.Customer)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null) return;

            var body = $"Заказ #{order.OrderNumber} отменен";
            if (!string.IsNullOrEmpty(reason))
            {
                body += $": {reason}";
            }

            var notification = new Notification
            {
                Title = "❌ Заказ отменен",
                Body = body,
                Type = "order_cancelled",
                UserId = order.CustomerId,
                OrderId = orderId,
                Data = JsonSerializer.Serialize(new { orderNumber = order.OrderNumber, reason })
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
        }

        private string GetStatusText(string status)
        {
            return status switch
            {
                "Confirmed" => "Подтвержден",
                "Processing" => "В обработке",
                "AwaitingWeight" => "Ожидает взвешивания",
                "ReadyToShip" => "Готов к отправке",
                "Shipped" => "Отправлен",
                "Delivered" => "Доставлен",
                "Cancelled" => "Отменен",
                _ => status
            };
        }
    }
}
