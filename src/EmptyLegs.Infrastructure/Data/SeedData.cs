using System.Text.Json;
using EmptyLegs.Core.Entities;
using EmptyLegs.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace EmptyLegs.Infrastructure.Data;

public static class SeedData
{
    private static readonly JsonSerializerOptions _jsonOpts = new() { PropertyNameCaseInsensitive = true };

    public static async Task InitializeAsync(AppDbContext db, string seedDataPath)
    {
        await db.Database.MigrateAsync();

        if (await db.Users.AnyAsync()) return;

        // ── Operators ──────────────────────────────────────────────────────────
        var opJson = await File.ReadAllTextAsync(Path.Combine(seedDataPath, "operators.json"));
        var opDtos = JsonSerializer.Deserialize<List<OperatorSeed>>(opJson, _jsonOpts)!;
        var operators = opDtos.Select(o => new Operator
        {
            Name = o.Name, Country = o.Country, City = o.City,
            LogoUrl = o.LogoUrl, ContactEmail = o.ContactEmail,
            Phone = o.Phone, Description = o.Description,
            Website = o.Website, IsActive = o.IsActive, CreatedAt = DateTime.UtcNow
        }).ToList();
        db.Operators.AddRange(operators);
        await db.SaveChangesAsync();

        // ── Jets ───────────────────────────────────────────────────────────────
        var jetJson = await File.ReadAllTextAsync(Path.Combine(seedDataPath, "jets.json"));
        var jetDtos = JsonSerializer.Deserialize<List<JetSeed>>(jetJson, _jsonOpts)!;
        var jets = jetDtos.Select(j => new Jet
        {
            OperatorId = operators[j.OperatorId - 1].Id,
            Manufacturer = j.Manufacturer, ModelName = j.ModelName,
            Category = Enum.Parse<JetCategory>(j.Category),
            TailNumber = j.TailNumber, YearOfManufacture = j.YearOfManufacture,
            SeatingCapacity = j.SeatingCapacity, RangeKm = j.RangeKm, SpeedKmh = j.SpeedKmh,
            Description = j.Description,
            MainImageUrl = j.MainImageUrl, InteriorImageUrl = j.InteriorImageUrl,
            BasePrice = j.BasePrice, Status = JetStatus.Active,
            ConfirmationMode = Enum.Parse<ConfirmationMode>(j.ConfirmationMode),
            HasWifi = j.HasWifi, HasCatering = j.HasCatering, HasBedroom = j.HasBedroom,
            CreatedAt = DateTime.UtcNow
        }).ToList();
        db.Jets.AddRange(jets);
        await db.SaveChangesAsync();

        // ── Policies ───────────────────────────────────────────────────────────
        var policies = operators.Select(o => new Policy
        {
            OperatorId = o.Id,
            PolicyType = "Cancellation",
            Title = "Cancellation & Refund Policy",
            Content = $"Empty leg bookings by {o.Name} are subject to the following terms: " +
                      "Cancellations made more than 48 hours before departure receive a 50% refund. " +
                      "Cancellations within 48 hours of departure are non-refundable. " +
                      "Flight changes are subject to availability and may incur additional charges. " +
                      "In case of operator-initiated cancellation, a full refund will be processed within 7 business days.",
            EffectiveDate = DateTime.UtcNow, IsActive = true
        }).ToList();
        db.Policies.AddRange(policies);
        await db.SaveChangesAsync();

        // ── Empty Legs ─────────────────────────────────────────────────────────
        var elJson = await File.ReadAllTextAsync(Path.Combine(seedDataPath, "empty-legs.json"));
        var elDtos = JsonSerializer.Deserialize<List<EmptyLegSeed>>(elJson, _jsonOpts)!;
        var emptyLegs = elDtos.Select(el => new EmptyLeg
        {
            OperatorId = operators[el.OperatorId - 1].Id,
            JetId = jets[el.JetId - 1].Id,
            Origin = el.Origin, OriginCode = el.OriginCode,
            Destination = el.Destination, DestinationCode = el.DestinationCode,
            DepartureUtc = DateTime.Parse(el.DepartureUtc).ToUniversalTime(),
            ArrivalUtc = DateTime.Parse(el.ArrivalUtc).ToUniversalTime(),
            AvailableSeats = el.AvailableSeats,
            Price = el.Price, TaxPercent = el.TaxPercent,
            Status = Enum.Parse<EmptyLegStatus>(el.Status),
            LockDurationMinutes = el.LockDurationMinutes,
            Notes = el.Notes, CreatedAt = DateTime.UtcNow
        }).ToList();
        db.EmptyLegs.AddRange(emptyLegs);
        await db.SaveChangesAsync();

        // ── Users ──────────────────────────────────────────────────────────────
        var userJson = await File.ReadAllTextAsync(Path.Combine(seedDataPath, "users.json"));
        var userDtos = JsonSerializer.Deserialize<List<UserSeed>>(userJson, _jsonOpts)!;
        var users = userDtos.Select(u => new User
        {
            Email = u.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(u.Password),
            FirstName = u.FirstName, LastName = u.LastName, Phone = u.Phone,
            Role = Enum.Parse<UserRole>(u.Role),
            OperatorId = u.OperatorId.HasValue ? operators[u.OperatorId.Value - 1].Id : null,
            ReferralCode = u.ReferralCode,
            IsActive = true, CreatedAt = DateTime.UtcNow
        }).ToList();
        db.Users.AddRange(users);
        await db.SaveChangesAsync();

        // ── Coupons ────────────────────────────────────────────────────────────
        var couponJson = await File.ReadAllTextAsync(Path.Combine(seedDataPath, "coupons.json"));
        var couponDtos = JsonSerializer.Deserialize<List<CouponSeed>>(couponJson, _jsonOpts)!;
        var coupons = couponDtos.Select(c => new Coupon
        {
            Code = c.Code, Description = c.Description,
            DiscountType = Enum.Parse<DiscountType>(c.DiscountType),
            DiscountValue = c.DiscountValue,
            MinBookingAmount = c.MinBookingAmount,
            MaxDiscountAmount = c.MaxDiscountAmount,
            ExpiryDate = DateTime.Parse(c.ExpiryDate).ToUniversalTime(),
            MaxUses = c.MaxUses, CurrentUses = c.CurrentUses,
            IsActive = c.IsActive, CreatedAt = DateTime.UtcNow
        }).ToList();
        db.Coupons.AddRange(coupons);
        await db.SaveChangesAsync();

        // ── Sample Notifications for demo users ────────────────────────────────
        var demoUser = users.FirstOrDefault(u => u.Role == UserRole.User);
        if (demoUser != null)
        {
            db.Notifications.AddRange(
                new Notification { UserId = demoUser.Id, Title = "Welcome to EmptyLegs!", Message = "Discover exclusive empty leg deals from 20 operators across India and Sri Lanka.", Type = NotificationType.SystemAlert, IsRead = false, CreatedAt = DateTime.UtcNow.AddMinutes(-30) },
                new Notification { UserId = demoUser.Id, Title = "New flights available", Message = "5 new empty legs from Mumbai to Delhi just listed.", Type = NotificationType.NewEmptyLeg, IsRead = false, CreatedAt = DateTime.UtcNow.AddMinutes(-10) }
            );
            await db.SaveChangesAsync();

            // Give demo user some credits
            db.CreditTransactions.Add(new CreditTransaction
            {
                UserId = demoUser.Id, Amount = 2000, TransactionType = CreditTransactionType.Earned,
                Description = "Welcome bonus credits", BalanceAfter = 2000, CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        }
    }

    // ── Seed DTOs ──────────────────────────────────────────────────────────────
    private record OperatorSeed(string Name, string Country, string City, string LogoUrl,
        string ContactEmail, string Phone, string Description, string Website, bool IsActive);
    private record JetSeed(int OperatorId, string Manufacturer, string ModelName, string Category,
        string TailNumber, int YearOfManufacture, int SeatingCapacity, int RangeKm, int SpeedKmh,
        string Description, string MainImageUrl, string InteriorImageUrl, decimal BasePrice,
        string ConfirmationMode, bool HasWifi, bool HasCatering, bool HasBedroom);
    private record EmptyLegSeed(int OperatorId, int JetId, string Origin, string OriginCode,
        string Destination, string DestinationCode, string DepartureUtc, string ArrivalUtc,
        int AvailableSeats, decimal Price, decimal TaxPercent, string Status,
        int LockDurationMinutes, string Notes);
    private record UserSeed(string Email, string Password, string FirstName, string LastName,
        string Phone, string Role, string ReferralCode, int? OperatorId);
    private record CouponSeed(string Code, string Description, string DiscountType,
        decimal DiscountValue, decimal? MinBookingAmount, decimal? MaxDiscountAmount,
        string ExpiryDate, int MaxUses, int CurrentUses, bool IsActive);
}
