namespace HarvestHub.DTOs
{
    public class FarmerAnalyticsDto
    {
        public int PeriodDays { get; set; }
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public decimal RevenueTotal { get; set; }
        public int OrdersCount { get; set; }
        public decimal AverageOrderValue { get; set; }
        public decimal ItemsSoldTotal { get; set; }
        public decimal AverageItemsPerOrder { get; set; }
        public int UniqueCustomers { get; set; }
        public int NewCustomers { get; set; }
        public int RepeatCustomers { get; set; }
        public int CompletedOrders { get; set; }
        public int CancelledOrders { get; set; }
        public List<DailyRevenuePointDto> RevenueByDay { get; set; } = new();
        public List<StatusCountDto> StatusBreakdown { get; set; } = new();
        public List<TopProductDto> TopProducts { get; set; } = new();
        public List<CategorySalesDto> CategoryBreakdown { get; set; } = new();
    }

    public class DailyRevenuePointDto
    {
        public DateTime Date { get; set; }
        public decimal Revenue { get; set; }
        public int Orders { get; set; }
    }

    public class StatusCountDto
    {
        public string Status { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class TopProductDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public decimal Quantity { get; set; }
    }

    public class CategorySalesDto
    {
        public string CategoryName { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public decimal Quantity { get; set; }
    }
}
