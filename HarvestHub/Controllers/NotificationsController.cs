using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HarvestHub.DTOs;
using HarvestHub.Models;
using System.Security.Claims;

namespace HarvestHub.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NotificationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Notifications
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<NotificationDto>>> GetNotifications()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(50)
                .Select(n => new NotificationDto
                {
                    Id = n.Id,
                    Title = n.Title,
                    Body = n.Body,
                    Type = n.Type,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt,
                    Data = n.Data
                })
                .ToListAsync();

            return Ok(notifications);
        }

        // GET: api/Notifications/5
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<NotificationDto>> GetNotification(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            if (notification == null)
            {
                return NotFound();
            }

            return Ok(new NotificationDto
            {
                Id = notification.Id,
                Title = notification.Title,
                Body = notification.Body,
                Type = notification.Type,
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt,
                Data = notification.Data
            });
        }

        // POST: api/Notifications/{id}/read
        [HttpPost("{id}/read")]
        [Authorize]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            if (notification == null)
            {
                return NotFound();
            }

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Notifications/read-all
        [HttpPost("read-all")]
        [Authorize]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Notifications/register
        [HttpPost("register")]
        [Authorize]
        public async Task<IActionResult> RegisterDeviceToken(RegisterDeviceTokenDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                return NotFound();
            }

            // Update or create device token
            var existingToken = await _context.Notifications
                .FirstOrDefaultAsync(n => n.UserId == userId && n.DeviceToken == dto.PushToken);

            if (existingToken != null)
            {
                existingToken.Platform = dto.Platform;
            }
            else
            {
                var notification = new Notification
                {
                    Title = "Device Registered",
                    Body = "Push notifications enabled",
                    Type = "device_registered",
                    UserId = userId,
                    DeviceToken = dto.PushToken,
                    Platform = dto.Platform,
                    IsRead = true
                };
                _context.Notifications.Add(notification);
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Notifications/unregister
        [HttpPost("unregister")]
        [Authorize]
        public async Task<IActionResult> UnregisterDeviceToken()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            var tokens = await _context.Notifications
                .Where(n => n.UserId == userId && n.DeviceToken != null)
                .ToListAsync();

            foreach (var token in tokens)
            {
                token.DeviceToken = null;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
