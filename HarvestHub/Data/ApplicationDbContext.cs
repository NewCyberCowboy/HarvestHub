using Microsoft.EntityFrameworkCore;
using HarvestHub.Models;
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Profile> Profiles { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<ProductBatch> ProductBatches { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }
    public DbSet<OrderStatusHistory> OrderStatusHistories { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<Address> Addresses { get; set; } = null!;
    public DbSet<Favorite> Favorites { get; set; } = null!;
    public DbSet<FarmerApplication> FarmerApplications { get; set; } = null!;
    public DbSet<ProductDraft> ProductDrafts { get; set; } = null!;
    public DbSet<Notification> Notifications { get; set; } = null!;
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<OrderStatusHistory>()
            .HasKey(osh => osh.OrderStatusHistoryId);

        modelBuilder.Entity<User>()
            .HasKey(u => u.UserId);

        modelBuilder.Entity<Profile>()
            .HasKey(p => p.ProfileId);

        modelBuilder.Entity<Category>()
            .HasKey(c => c.CategoryId);

        modelBuilder.Entity<Product>()
            .HasKey(p => p.ProductId);

        modelBuilder.Entity<ProductBatch>()
            .HasKey(pb => pb.BatchId);

        modelBuilder.Entity<Order>()
            .HasKey(o => o.OrderId);

        modelBuilder.Entity<OrderItem>()
            .HasKey(oi => oi.OrderItemId);

        modelBuilder.Entity<Review>()
            .HasKey(r => r.ReviewId);

        modelBuilder.Entity<Address>()
        .HasKey(a => a.AddressId);

        // User - Profile (один к одному)
        modelBuilder.Entity<User>()
            .HasOne(u => u.Profile)
            .WithOne(p => p.User)
            .HasForeignKey<Profile>(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // User - Orders (один ко многим)
        modelBuilder.Entity<User>()
            .HasMany(u => u.Orders)
            .WithOne(o => o.Customer)
            .HasForeignKey(o => o.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        // User - Addresses (один ко многим)
        modelBuilder.Entity<User>()
            .HasMany(u => u.Addresses)
            .WithOne(a => a.User)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);


        // User - Reviews (один ко многим)
        modelBuilder.Entity<User>()
            .HasMany(u => u.Reviews)
            .WithOne(r => r.Customer)
            .HasForeignKey(r => r.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        // User - Products (один ко многим) - для фермеров
        modelBuilder.Entity<User>()
            .HasMany(u => u.Products)
            .WithOne(p => p.Farmer)
            .HasForeignKey(p => p.FarmerId)
            .OnDelete(DeleteBehavior.Restrict);

        // Category - Products (один ко многим)
        modelBuilder.Entity<Category>()
            .HasMany(c => c.Products)
            .WithOne(p => p.Category)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        // Category self-reference (иерархия)
        modelBuilder.Entity<Category>()
            .HasMany(c => c.Children)
            .WithOne(c => c.Parent)
            .HasForeignKey(c => c.ParentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Product - ProductBatches (один ко многим)
        modelBuilder.Entity<Product>()
            .HasMany(p => p.ProductBatches)
            .WithOne(pb => pb.Product)
            .HasForeignKey(pb => pb.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        // Product - OrderItems (один ко многим)
        modelBuilder.Entity<Product>()
            .HasMany(p => p.OrderItems)
            .WithOne(oi => oi.Product)
            .HasForeignKey(oi => oi.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        // Product - Reviews (один ко многим)
        modelBuilder.Entity<Product>()
            .HasMany(p => p.Reviews)
            .WithOne(r => r.Product)
            .HasForeignKey(r => r.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        // Order - OrderItems (один ко многим)
        modelBuilder.Entity<Order>()
            .HasMany(o => o.OrderItems)
            .WithOne(oi => oi.Order)
            .HasForeignKey(oi => oi.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // Order - OrderStatusHistory (один ко многим)
        modelBuilder.Entity<Order>()
            .HasMany(o => o.StatusHistory)
            .WithOne(osh => osh.Order)
            .HasForeignKey(osh => osh.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        //// OrderStatusHistory - User (связь с пользователем, изменившим статус)
        modelBuilder.Entity<OrderStatusHistory>()
            .HasOne(osh => osh.User)
            .WithMany()
            .HasForeignKey(osh => osh.ChangedBy)
            .OnDelete(DeleteBehavior.Restrict);

        // OrderItem - ProductBatch (многие к одному)
        modelBuilder.Entity<OrderItem>()
            .HasOne(oi => oi.Batch)
            .WithMany(pb => pb.OrderItems)
            .HasForeignKey(oi => oi.BatchId)
            .OnDelete(DeleteBehavior.Restrict);

        // Review - Order (связь с заказом)
        modelBuilder.Entity<Review>()
            .HasOne(r => r.Order)
            .WithMany()
            .HasForeignKey(r => r.OrderId)
            .OnDelete(DeleteBehavior.Restrict);

        // User - Favorites (один ко многим)
        modelBuilder.Entity<User>()
            .HasMany(u => u.Favorites)
            .WithOne(f => f.User)
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Product - Favorites (один ко многим)
        modelBuilder.Entity<Product>()
            .HasMany(p => p.Favorites)
            .WithOne(f => f.Product)
            .HasForeignKey(f => f.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        // Уникальный индекс для избранного (пользователь не может добавить один продукт дважды)
        modelBuilder.Entity<Favorite>()
            .HasIndex(f => new { f.UserId, f.ProductId })
            .IsUnique();

        // Уникальные индексы
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Product>()
            .HasIndex(p => p.Name);

        modelBuilder.Entity<Category>()
            .HasIndex(c => c.Name);

        modelBuilder.Entity<ProductBatch>()
     .HasIndex(pb => pb.BatchNumber)
     .IsUnique();

        // ProductDraft configuration
        modelBuilder.Entity<ProductDraft>()
            .HasKey(pd => pd.DraftId);

        modelBuilder.Entity<ProductDraft>()
            .Property(pd => pd.BasePrice)
            .HasPrecision(18, 2);

        modelBuilder.Entity<ProductDraft>()
            .Property(pd => pd.DiscountPrice)
            .HasPrecision(18, 2);

        modelBuilder.Entity<ProductDraft>()
            .HasIndex(pd => new { pd.OwnerUserId, pd.LocalDraftId })
            .IsUnique();

        modelBuilder.Entity<ProductDraft>()
            .HasIndex(pd => pd.DeviceId);

        modelBuilder.Entity<ProductDraft>()
            .Property(pd => pd.CreatedAt)
            .HasDefaultValueSql("NOW()");

        modelBuilder.Entity<ProductDraft>()
            .Property(pd => pd.UpdatedAt)
            .HasDefaultValueSql("NOW()");

        // ProductDraft - Owner (User)
        modelBuilder.Entity<ProductDraft>()
            .HasOne(pd => pd.Owner)
            .WithMany()
            .HasForeignKey(pd => pd.OwnerUserId)
            .OnDelete(DeleteBehavior.Cascade);

        // ProductDraft - Category
        modelBuilder.Entity<ProductDraft>()
            .HasOne(pd => pd.Category)
            .WithMany()
            .HasForeignKey(pd => pd.CategoryId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Address>()
    .HasIndex(a => new { a.UserId, a.IsDefault })
    .HasFilter("\"IsDefault\" = true");

        // FarmerApplication
        modelBuilder.Entity<FarmerApplication>()
            .HasKey(fa => fa.ApplicationId);

        // User - FarmerApplications (один ко многим)
        modelBuilder.Entity<User>()
            .HasMany(u => u.FarmerApplications)
            .WithOne(fa => fa.User)
            .HasForeignKey(fa => fa.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // FarmerApplication - Reviewer (связь с админом, рассмотревшим заявку)
        modelBuilder.Entity<FarmerApplication>()
            .HasOne(fa => fa.Reviewer)
            .WithMany()
            .HasForeignKey(fa => fa.ReviewedBy)
            .OnDelete(DeleteBehavior.Restrict);

        // Notification configuration
        modelBuilder.Entity<Notification>()
            .HasKey(n => n.Id);

        // User - Notifications (один ко многим)
        modelBuilder.Entity<User>()
            .HasMany(u => u.Notifications)
            .WithOne(n => n.User)
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Notification - Order (многие к одному)
        modelBuilder.Entity<Notification>()
            .HasOne(n => n.Order)
            .WithMany()
            .HasForeignKey(n => n.OrderId)
            .OnDelete(DeleteBehavior.SetNull);

        // Notification - Product (многие к одному)
        modelBuilder.Entity<Notification>()
            .HasOne(n => n.Product)
            .WithMany()
            .HasForeignKey(n => n.ProductId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Notification>()
            .Property(n => n.CreatedAt)
            .HasDefaultValueSql("NOW()");

        // Настройка точности для decimal
        modelBuilder.Entity<Product>()
            .Property(p => p.BasePrice)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Order>()
            .Property(o => o.TotalAmount)
            .HasPrecision(18, 2);

        modelBuilder.Entity<OrderItem>()
            .Property(oi => oi.UnitPrice)
            .HasPrecision(18, 2);

        modelBuilder.Entity<OrderItem>()
            .Property(oi => oi.LineTotal)
            .HasPrecision(18, 2);

        // Значения по умолчанию
        modelBuilder.Entity<User>()
            .Property(u => u.CreatedAt)
            .HasDefaultValueSql("NOW()");

        modelBuilder.Entity<User>()
            .Property(u => u.UpdatedAt)
            .HasDefaultValueSql("NOW()");

        modelBuilder.Entity<Product>()
            .Property(p => p.CreatedAt)
            .HasDefaultValueSql("NOW()");

        modelBuilder.Entity<Order>()
            .Property(o => o.OrderDate)
            .HasDefaultValueSql("NOW()");

        modelBuilder.Entity<OrderStatusHistory>()
            .Property(osh => osh.ChangedAt)
            .HasDefaultValueSql("NOW()");

        modelBuilder.Entity<Review>()
            .Property(r => r.CreatedAt)
            .HasDefaultValueSql("NOW()");
        modelBuilder.Entity<Address>()
    .Property(a => a.CreatedAt)
    .HasDefaultValueSql("NOW()");

        modelBuilder.Entity<Address>()
            .Property(a => a.Country)
            .HasDefaultValue("Россия");

        // Ограничения для enum-like полей
        modelBuilder.Entity<User>()
            .Property(u => u.Role)
            .HasConversion<string>()
            .HasMaxLength(50);

        modelBuilder.Entity<Product>()
            .Property(p => p.Status)
            .HasConversion<string>()
            .HasMaxLength(50);

        modelBuilder.Entity<Order>()
            .Property(o => o.Status)
            .HasConversion<string>()
            .HasMaxLength(50);

        modelBuilder.Entity<Order>()
            .Property(o => o.PaymentStatus)
            .HasConversion<string>()
            .HasMaxLength(50);

        modelBuilder.Entity<ProductBatch>()
            .Property(pb => pb.QualityGrade)
            .HasConversion<string>()
            .HasMaxLength(20);

    }
}