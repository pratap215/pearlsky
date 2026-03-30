using EmptyLegs.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace EmptyLegs.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Operator> Operators => Set<Operator>();
    public DbSet<Jet> Jets => Set<Jet>();
    public DbSet<JetImage> JetImages => Set<JetImage>();
    public DbSet<EmptyLeg> EmptyLegs => Set<EmptyLeg>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Passenger> Passengers => Set<Passenger>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<Referral> Referrals => Set<Referral>();
    public DbSet<CreditTransaction> CreditTransactions => Set<CreditTransaction>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<SavedSearch> SavedSearches => Set<SavedSearch>();
    public DbSet<Favorite> Favorites => Set<Favorite>();
    public DbSet<Policy> Policies => Set<Policy>();
    public DbSet<JetSubscription> JetSubscriptions => Set<JetSubscription>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(e => {
            e.HasIndex(u => u.Email).IsUnique();
            e.HasIndex(u => u.ReferralCode).IsUnique();
            e.Property(u => u.Role).HasConversion<string>();
        });

        modelBuilder.Entity<Jet>(e => {
            e.Property(j => j.Category).HasConversion<string>();
            e.Property(j => j.Status).HasConversion<string>();
            e.Property(j => j.ConfirmationMode).HasConversion<string>();
            e.Property(j => j.BasePrice).HasColumnType("decimal(18,2)");
        });

        modelBuilder.Entity<EmptyLeg>(e => {
            e.Property(el => el.Status).HasConversion<string>();
            e.Property(el => el.Price).HasColumnType("decimal(18,2)");
            e.Property(el => el.TaxPercent).HasColumnType("decimal(5,2)");
        });

        modelBuilder.Entity<Booking>(e => {
            e.HasIndex(b => b.BookingRef).IsUnique();
            e.Property(b => b.Status).HasConversion<string>();
            e.Property(b => b.PaymentStatus).HasConversion<string>();
            e.Property(b => b.BaseAmount).HasColumnType("decimal(18,2)");
            e.Property(b => b.TaxAmount).HasColumnType("decimal(18,2)");
            e.Property(b => b.DiscountAmount).HasColumnType("decimal(18,2)");
            e.Property(b => b.CreditsUsed).HasColumnType("decimal(18,2)");
            e.Property(b => b.TotalAmount).HasColumnType("decimal(18,2)");
        });

        modelBuilder.Entity<Coupon>(e => {
            e.HasIndex(c => c.Code).IsUnique();
            e.Property(c => c.DiscountType).HasConversion<string>();
            e.Property(c => c.DiscountValue).HasColumnType("decimal(18,2)");
        });

        modelBuilder.Entity<CreditTransaction>(e => {
            e.Property(ct => ct.TransactionType).HasConversion<string>();
            e.Property(ct => ct.Amount).HasColumnType("decimal(18,2)");
            e.Property(ct => ct.BalanceAfter).HasColumnType("decimal(18,2)");
        });

        modelBuilder.Entity<Notification>(e => {
            e.Property(n => n.Type).HasConversion<string>();
        });

        modelBuilder.Entity<SavedSearch>(e => {
            e.Property(s => s.AlertType).HasConversion<string>();
        });

        modelBuilder.Entity<Payment>(e => {
            e.Property(p => p.Status).HasConversion<string>();
            e.Property(p => p.Amount).HasColumnType("decimal(18,2)");
        });

        // Prevent cascade delete cycles
        modelBuilder.Entity<Booking>()
            .HasOne(b => b.EmptyLeg)
            .WithMany(el => el.Bookings)
            .HasForeignKey(b => b.EmptyLegId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.User)
            .WithMany(u => u.Bookings)
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<EmptyLeg>()
            .HasOne(el => el.Operator)
            .WithMany(o => o.EmptyLegs)
            .HasForeignKey(el => el.OperatorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<User>()
            .HasOne(u => u.Operator)
            .WithMany(o => o.Users)
            .HasForeignKey(u => u.OperatorId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Favorite>()
            .HasOne(f => f.EmptyLeg)
            .WithMany()
            .HasForeignKey(f => f.EmptyLegId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<JetSubscription>()
            .HasIndex(js => new { js.UserId, js.JetId })
            .IsUnique();

        modelBuilder.Entity<JetSubscription>()
            .HasOne(js => js.User)
            .WithMany()
            .HasForeignKey(js => js.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<JetSubscription>()
            .HasOne(js => js.Jet)
            .WithMany()
            .HasForeignKey(js => js.JetId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
