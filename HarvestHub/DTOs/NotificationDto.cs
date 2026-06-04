namespace HarvestHub.DTOs
{
    public class NotificationDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? Data { get; set; }
    }

    public class CreateNotificationDto
    {
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string? Data { get; set; }
        public int? OrderId { get; set; }
        public int? ProductId { get; set; }
    }

    public class RegisterDeviceTokenDto
    {
        public string PushToken { get; set; } = string.Empty;
        public string Platform { get; set; } = string.Empty;
    }
}
