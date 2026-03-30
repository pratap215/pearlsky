using EmptyLegs.Core.DTOs;
using EmptyLegs.Core.Entities;
using EmptyLegs.Core.Enums;
using EmptyLegs.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EmptyLegs.Application.Services;

// Additional DTOs defined here for Admin operations
public class OperatorDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int TotalJets { get; set; }
    public int TotalBookings { get; set; }
    public decimal Revenue { get; set; }
}

public class CouponDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string DiscountType { get; set; } = string.Empty;
    public decimal DiscountValue { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int MaxUses { get; set; }
    public int CurrentUses { get; set; }
    public bool IsActive { get; set; }
}

public class CreateCouponRequest
{
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DiscountType DiscountType { get; set; }
    public decimal DiscountValue { get; set; }
    public decimal? MinBookingAmount { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int MaxUses { get; set; }
}

public class AdminService
{
    private readonly AppDbContext _db;

    public AdminService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<AdminDashboardDto> GetDashboardAsync()
    {
        var totalOperators = await _db.Operators.CountAsync();
        var totalJets = await _db.Jets.CountAsync();
        var totalUsers = await _db.Users.CountAsync(u => u.Role == UserRole.User);
        var totalBookings = await _db.Bookings.CountAsync();
        var activeEmptyLegs = await _db.EmptyLegs.CountAsync(el => el.Status == EmptyLegStatus.Available);
        var blockedEmptyLegs = await _db.EmptyLegs.CountAsync(el => el.Status == EmptyLegStatus.Blocked);

        var now = DateTime.UtcNow;
        var firstOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var totalRevenue = await _db.Bookings
            .Where(b => b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed)
            .SumAsync(b => (decimal?)b.TotalAmount) ?? 0;

        var monthlyRevenue = await _db.Bookings
            .Where(b =>
                (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed) &&
                b.CreatedAt >= firstOfMonth)
            .SumAsync(b => (decimal?)b.TotalAmount) ?? 0;

        var recentBookings = await _db.Bookings
            .Include(b => b.EmptyLeg)
                .ThenInclude(el => el.Jet)
            .Include(b => b.EmptyLeg)
                .ThenInclude(el => el.Operator)
            .Include(b => b.Passengers)
            .OrderByDescending(b => b.CreatedAt)
            .Take(10)
            .ToListAsync();

        return new AdminDashboardDto
        {
            TotalOperators = totalOperators,
            TotalJets = totalJets,
            TotalUsers = totalUsers,
            TotalBookings = totalBookings,
            ActiveEmptyLegs = activeEmptyLegs,
            BlockedEmptyLegs = blockedEmptyLegs,
            TotalRevenue = totalRevenue,
            MonthlyRevenue = monthlyRevenue,
            RecentBookings = recentBookings.Select(MapBookingToDto).ToList()
        };
    }

    public async Task<List<OperatorDto>> GetAllOperatorsAsync()
    {
        var operators = await _db.Operators
            .Include(o => o.Jets)
            .OrderBy(o => o.Name)
            .ToListAsync();

        var result = new List<OperatorDto>();
        foreach (var op in operators)
        {
            var totalBookings = await _db.Bookings.CountAsync(b => b.OperatorId == op.Id);
            var revenue = await _db.Bookings
                .Where(b => b.OperatorId == op.Id && (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed))
                .SumAsync(b => (decimal?)b.TotalAmount) ?? 0;

            result.Add(new OperatorDto
            {
                Id = op.Id,
                Name = op.Name,
                Country = op.Country,
                City = op.City,
                IsActive = op.IsActive,
                TotalJets = op.Jets.Count,
                TotalBookings = totalBookings,
                Revenue = revenue
            });
        }

        return result;
    }

    public async Task<bool> ToggleOperatorAsync(int operatorId)
    {
        var op = await _db.Operators.FindAsync(operatorId);
        if (op == null)
            return false;

        op.IsActive = !op.IsActive;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<BookingDto>> GetAllBookingsAsync()
    {
        var bookings = await _db.Bookings
            .Include(b => b.EmptyLeg)
                .ThenInclude(el => el.Jet)
            .Include(b => b.EmptyLeg)
                .ThenInclude(el => el.Operator)
            .Include(b => b.Passengers)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        return bookings.Select(MapBookingToDto).ToList();
    }

    public async Task<List<CouponDto>> GetCouponsAsync()
    {
        var coupons = await _db.Coupons
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return coupons.Select(c => new CouponDto
        {
            Id = c.Id,
            Code = c.Code,
            Description = c.Description,
            DiscountType = c.DiscountType.ToString(),
            DiscountValue = c.DiscountValue,
            ExpiryDate = c.ExpiryDate,
            MaxUses = c.MaxUses,
            CurrentUses = c.CurrentUses,
            IsActive = c.IsActive
        }).ToList();
    }

    public async Task<CouponDto> CreateCouponAsync(CreateCouponRequest req)
    {
        var coupon = new Coupon
        {
            Code = req.Code.ToUpper(),
            Description = req.Description,
            DiscountType = req.DiscountType,
            DiscountValue = req.DiscountValue,
            MinBookingAmount = req.MinBookingAmount,
            MaxDiscountAmount = req.MaxDiscountAmount,
            ExpiryDate = req.ExpiryDate,
            MaxUses = req.MaxUses,
            CurrentUses = 0,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Coupons.Add(coupon);
        await _db.SaveChangesAsync();

        return new CouponDto
        {
            Id = coupon.Id,
            Code = coupon.Code,
            Description = coupon.Description,
            DiscountType = coupon.DiscountType.ToString(),
            DiscountValue = coupon.DiscountValue,
            ExpiryDate = coupon.ExpiryDate,
            MaxUses = coupon.MaxUses,
            CurrentUses = coupon.CurrentUses,
            IsActive = coupon.IsActive
        };
    }

    private BookingDto MapBookingToDto(Booking b)
    {
        return new BookingDto
        {
            Id = b.Id,
            BookingRef = b.BookingRef,
            EmptyLegId = b.EmptyLegId,
            Origin = b.EmptyLeg?.Origin ?? string.Empty,
            Destination = b.EmptyLeg?.Destination ?? string.Empty,
            DepartureUtc = b.EmptyLeg?.DepartureUtc ?? DateTime.MinValue,
            JetModel = b.EmptyLeg?.Jet?.ModelName ?? string.Empty,
            MainImageUrl = b.EmptyLeg?.Jet?.MainImageUrl ?? string.Empty,
            OperatorName = b.EmptyLeg?.Operator?.Name ?? string.Empty,
            Status = b.Status.ToString(),
            PaymentStatus = b.PaymentStatus.ToString(),
            BaseAmount = b.BaseAmount,
            TaxAmount = b.TaxAmount,
            DiscountAmount = b.DiscountAmount,
            CreditsUsed = b.CreditsUsed,
            TotalAmount = b.TotalAmount,
            PassengerCount = b.PassengerCount,
            Passengers = b.Passengers?.Select(p => new PassengerDto
            {
                FirstName = p.FirstName,
                LastName = p.LastName,
                PassportNumber = p.PassportNumber,
                Nationality = p.Nationality,
                DateOfBirth = p.DateOfBirth
            }).ToList() ?? new List<PassengerDto>(),
            CreatedAt = b.CreatedAt,
            RequiresOperatorConfirmation = b.RequiresOperatorConfirmation
        };
    }
}
