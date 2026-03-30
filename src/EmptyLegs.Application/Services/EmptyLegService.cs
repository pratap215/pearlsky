using EmptyLegs.Core.DTOs;
using EmptyLegs.Core.Entities;
using EmptyLegs.Core.Enums;
using EmptyLegs.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace EmptyLegs.Application.Services;

public class EmptyLegService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public EmptyLegService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<PagedResult<EmptyLegDto>> SearchAsync(EmptyLegSearchRequest req, int? currentUserId)
    {
        await ReleaseExpiredLocksAsync();
        var query = _db.EmptyLegs
            .Include(el => el.Jet)
                .ThenInclude(j => j.Images)
            .Include(el => el.Operator)
            .AsSplitQuery()
            .Where(el => el.Status == EmptyLegStatus.Available)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(req.Origin))
            query = query.Where(el =>
                el.Origin.Contains(req.Origin) ||
                el.OriginCode.Contains(req.Origin));

        if (!string.IsNullOrWhiteSpace(req.Destination))
            query = query.Where(el =>
                el.Destination.Contains(req.Destination) ||
                el.DestinationCode.Contains(req.Destination));

        if (req.DateFrom.HasValue)
            query = query.Where(el => el.DepartureUtc >= req.DateFrom.Value);

        if (req.DateTo.HasValue)
            query = query.Where(el => el.DepartureUtc <= req.DateTo.Value);

        if (req.MinSeats.HasValue)
            query = query.Where(el => el.AvailableSeats >= req.MinSeats.Value);

        if (req.MinPrice.HasValue)
            query = query.Where(el => el.Price >= req.MinPrice.Value);

        if (req.MaxPrice.HasValue)
            query = query.Where(el => el.Price <= req.MaxPrice.Value);

        if (req.Category.HasValue)
            query = query.Where(el => el.Jet.Category == req.Category.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(el => el.DepartureUtc)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync();

        List<int> favoriteIds = new();
        if (currentUserId.HasValue)
        {
            favoriteIds = await _db.Favorites
                .Where(f => f.UserId == currentUserId.Value)
                .Select(f => f.EmptyLegId)
                .ToListAsync();
        }

        return new PagedResult<EmptyLegDto>
        {
            Items = items.Select(el => MapToDto(el, currentUserId, favoriteIds)).ToList(),
            TotalCount = totalCount,
            Page = req.Page,
            PageSize = req.PageSize
        };
    }

    public async Task<EmptyLegDetailDto?> GetDetailAsync(int id, int? currentUserId)
    {
        var el = await _db.EmptyLegs
            .Include(e => e.Jet)
                .ThenInclude(j => j.Images)
            .Include(e => e.Operator)
                .ThenInclude(o => o.Policies)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (el == null)
            return null;

        List<int> favoriteIds = new();
        if (currentUserId.HasValue)
        {
            favoriteIds = await _db.Favorites
                .Where(f => f.UserId == currentUserId.Value)
                .Select(f => f.EmptyLegId)
                .ToListAsync();
        }

        var base_ = MapToDto(el, currentUserId, favoriteIds);

        var policies = el.Operator.Policies
            .Where(p => p.IsActive)
            .Select(p => new PolicyDto
            {
                Title = p.Title,
                Content = p.Content,
                PolicyType = p.PolicyType
            })
            .ToList();

        return new EmptyLegDetailDto
        {
            Id = base_.Id,
            OperatorId = base_.OperatorId,
            OperatorName = base_.OperatorName,
            OperatorLogo = base_.OperatorLogo,
            JetId = base_.JetId,
            JetModel = base_.JetModel,
            Manufacturer = base_.Manufacturer,
            JetCategory = base_.JetCategory,
            MainImageUrl = base_.MainImageUrl,
            TailNumber = base_.TailNumber,
            SeatingCapacity = base_.SeatingCapacity,
            Origin = base_.Origin,
            OriginCode = base_.OriginCode,
            Destination = base_.Destination,
            DestinationCode = base_.DestinationCode,
            DepartureUtc = base_.DepartureUtc,
            ArrivalUtc = base_.ArrivalUtc,
            DurationMinutes = base_.DurationMinutes,
            AvailableSeats = base_.AvailableSeats,
            Price = base_.Price,
            TaxAmount = base_.TaxAmount,
            TotalPrice = base_.TotalPrice,
            Status = base_.Status,
            SecondsUntilUnlock = base_.SecondsUntilUnlock,
            IsFavorite = base_.IsFavorite,
            HasWifi = base_.HasWifi,
            HasCatering = base_.HasCatering,
            HasBedroom = base_.HasBedroom,
            ConfirmationMode = base_.ConfirmationMode,
            Description = el.Jet.Description,
            RangeKm = el.Jet.RangeKm,
            SpeedKmh = el.Jet.SpeedKmh,
            YearOfManufacture = el.Jet.YearOfManufacture,
            ImageUrls = el.Jet.Images.Select(i => i.ImageUrl).ToList(),
            Policies = policies
        };
    }

    public async Task<BookingLockResponse> InitiateBookingAsync(int emptyLegId, CreateBookingRequest req, int userId)
    {
        var emptyLeg = await _db.EmptyLegs
            .Include(el => el.Jet)
            .Include(el => el.Operator)
            .FirstOrDefaultAsync(el => el.Id == emptyLegId)
            ?? throw new InvalidOperationException("Empty leg not found.");

        // Auto-release expired locks
        if (emptyLeg.Status == EmptyLegStatus.Blocked &&
            emptyLeg.BlockedUntil.HasValue &&
            emptyLeg.BlockedUntil.Value < DateTime.UtcNow)
        {
            emptyLeg.Status = EmptyLegStatus.Available;
            emptyLeg.BlockedUntil = null;
            emptyLeg.BlockedByUserId = null;
        }

        if (emptyLeg.Status != EmptyLegStatus.Available)
            throw new InvalidOperationException("This flight is not available for booking at this time.");

        // Lock it
        emptyLeg.Status = EmptyLegStatus.Blocked;
        emptyLeg.BlockedUntil = DateTime.UtcNow.AddMinutes(emptyLeg.LockDurationMinutes);
        emptyLeg.BlockedByUserId = userId;

        var baseAmount = emptyLeg.Price;
        var taxAmount = emptyLeg.TaxAmount;
        decimal discountAmount = 0;
        decimal creditsUsed = 0;

        // Validate and apply coupon
        string? couponCode = null;
        if (!string.IsNullOrWhiteSpace(req.CouponCode))
        {
            var couponResult = await ValidateCouponAsync(req.CouponCode, baseAmount);
            if (couponResult.IsValid)
            {
                discountAmount = couponResult.DiscountAmount;
                couponCode = req.CouponCode;

                var coupon = await _db.Coupons.FirstOrDefaultAsync(c => c.Code == req.CouponCode);
                if (coupon != null)
                {
                    coupon.CurrentUses++;
                }
            }
        }

        // Apply credits
        if (req.CreditsToUse > 0)
        {
            var availableCredits = await GetUserCreditsAsync(userId);
            creditsUsed = Math.Min(req.CreditsToUse, availableCredits);
            creditsUsed = Math.Min(creditsUsed, baseAmount + taxAmount - discountAmount);
        }

        var totalAmount = baseAmount + taxAmount - discountAmount - creditsUsed;

        var bookingRef = $"EL{DateTime.UtcNow:yyyyMMddHHmmss}{GenerateRandom4()}";

        var requiresConfirmation = emptyLeg.Jet.ConfirmationMode == ConfirmationMode.ManualApproval;

        var booking = new Booking
        {
            EmptyLegId = emptyLegId,
            UserId = userId,
            OperatorId = emptyLeg.OperatorId,
            BookingRef = bookingRef,
            Status = BookingStatus.PaymentPending,
            PaymentStatus = PaymentStatus.Pending,
            BaseAmount = baseAmount,
            TaxAmount = taxAmount,
            DiscountAmount = discountAmount,
            CreditsUsed = creditsUsed,
            TotalAmount = Math.Max(0, totalAmount),
            CouponCode = couponCode,
            ReferralCodeUsed = req.ReferralCodeUsed,
            PassengerCount = req.PassengerCount,
            Notes = req.Notes,
            PolicyAcknowledged = req.PolicyAcknowledged,
            RequiresOperatorConfirmation = requiresConfirmation,
            CreatedAt = DateTime.UtcNow
        };

        _db.Bookings.Add(booking);

        foreach (var p in req.Passengers.Where(p => !string.IsNullOrWhiteSpace(p.FirstName)))
        {
            _db.Passengers.Add(new Passenger
            {
                Booking = booking,
                FirstName = p.FirstName ?? string.Empty,
                LastName = p.LastName ?? string.Empty,
                PassportNumber = p.PassportNumber ?? string.Empty,
                Nationality = p.Nationality ?? string.Empty,
                DateOfBirth = p.DateOfBirth ?? DateTime.MinValue
            });
        }

        await _db.SaveChangesAsync();

        return new BookingLockResponse
        {
            BookingId = booking.Id,
            BookingRef = booking.BookingRef,
            LockDurationSeconds = emptyLeg.LockDurationMinutes * 60,
            LockedUntil = emptyLeg.BlockedUntil!.Value,
            BaseAmount = baseAmount,
            TaxAmount = taxAmount,
            DiscountAmount = discountAmount,
            CreditsUsed = creditsUsed,
            TotalAmount = booking.TotalAmount,
            RequiresConfirmation = requiresConfirmation
        };
    }

    public async Task<BookingDto?> ConfirmPaymentAsync(int bookingId, bool success, int userId, string? couponCode = null, decimal creditsToUse = 0)
    {
        var booking = await _db.Bookings
            .Include(b => b.EmptyLeg)
                .ThenInclude(el => el.Jet)
            .Include(b => b.EmptyLeg)
                .ThenInclude(el => el.Operator)
            .Include(b => b.Passengers)
            .FirstOrDefaultAsync(b => b.Id == bookingId && b.UserId == userId);

        if (booking == null)
            return null;

        // Apply coupon if provided and not already applied
        if (!string.IsNullOrWhiteSpace(couponCode) && booking.DiscountAmount == 0)
        {
            var couponResult = await ValidateCouponAsync(couponCode, booking.BaseAmount);
            if (couponResult.IsValid)
            {
                booking.DiscountAmount = couponResult.DiscountAmount;
                booking.CouponCode = couponCode;
                var coupon = await _db.Coupons.FirstOrDefaultAsync(c => c.Code == couponCode);
                if (coupon != null) coupon.CurrentUses++;
            }
        }

        // Apply credits if provided
        if (creditsToUse > 0 && booking.CreditsUsed == 0)
        {
            var available = await GetUserCreditsAsync(userId);
            booking.CreditsUsed = Math.Min(creditsToUse, Math.Min(available, booking.BaseAmount + booking.TaxAmount - booking.DiscountAmount));
        }

        booking.TotalAmount = Math.Max(0, booking.BaseAmount + booking.TaxAmount - booking.DiscountAmount - booking.CreditsUsed);

        // Config-based payment mode: OperatorNotification skips gateway processing
        var paymentMode = _config["Payment:Mode"] ?? "Gateway";
        if (paymentMode == "OperatorNotification" && success)
        {
            booking.PaymentStatus = PaymentStatus.Pending;
            booking.Status = BookingStatus.PendingConfirmation;
            // Keep empty leg blocked until operator confirms/rejects
            booking.EmptyLeg.Status = EmptyLegStatus.Blocked;

            var notif = new Notification
            {
                UserId = userId,
                Title = "Booking Submitted",
                Message = $"Your booking {booking.BookingRef} has been submitted to the operator for approval. No payment charged yet.",
                Type = NotificationType.BookingUpdate,
                BookingId = booking.Id,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _db.Notifications.Add(notif);
            await _db.SaveChangesAsync();
            return MapBookingToDto(booking);
        }

        if (success)
        {
            booking.PaymentStatus = PaymentStatus.Success;
            booking.Status = booking.RequiresOperatorConfirmation
                ? BookingStatus.PendingConfirmation
                : BookingStatus.Confirmed;

            if (!booking.RequiresOperatorConfirmation)
                booking.ConfirmedAt = DateTime.UtcNow;

            booking.EmptyLeg.Status = EmptyLegStatus.Booked;
            booking.EmptyLeg.BlockedUntil = null;
            booking.EmptyLeg.BlockedByUserId = null;

            var payment = new Payment
            {
                BookingId = booking.Id,
                TransactionId = $"TXN{DateTime.UtcNow.Ticks}",
                Amount = booking.TotalAmount,
                Status = PaymentStatus.Success,
                Gateway = "Mock",
                GatewayResponse = "Payment processed successfully",
                CreatedAt = DateTime.UtcNow,
                ProcessedAt = DateTime.UtcNow
            };
            _db.Payments.Add(payment);

            // Deduct credits if used
            if (booking.CreditsUsed > 0)
            {
                var currentBalance = await GetUserCreditsAsync(userId);
                var creditTx = new CreditTransaction
                {
                    UserId = userId,
                    Amount = booking.CreditsUsed,
                    TransactionType = CreditTransactionType.Redeemed,
                    Description = $"Credits redeemed for booking {booking.BookingRef}",
                    BookingId = booking.Id,
                    BalanceAfter = currentBalance - booking.CreditsUsed,
                    CreatedAt = DateTime.UtcNow
                };
                _db.CreditTransactions.Add(creditTx);
            }

            var notification = new Notification
            {
                UserId = userId,
                Title = "Booking Confirmed",
                Message = $"Your booking {booking.BookingRef} has been {(booking.RequiresOperatorConfirmation ? "submitted and awaiting operator confirmation" : "confirmed")}.",
                Type = NotificationType.BookingConfirmed,
                BookingId = booking.Id,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _db.Notifications.Add(notification);
        }
        else
        {
            booking.PaymentStatus = PaymentStatus.Failed;
            booking.Status = BookingStatus.PaymentFailed;

            // Release the lock
            booking.EmptyLeg.Status = EmptyLegStatus.Available;
            booking.EmptyLeg.BlockedUntil = null;
            booking.EmptyLeg.BlockedByUserId = null;
        }

        await _db.SaveChangesAsync();

        return MapBookingToDto(booking);
    }

    public async Task ReleaseExpiredLocksAsync()
    {
        var now = DateTime.UtcNow;
        var expiredLegs = await _db.EmptyLegs
            .Where(el => el.Status == EmptyLegStatus.Blocked && el.BlockedUntil < now)
            .ToListAsync();

        foreach (var leg in expiredLegs)
        {
            leg.Status = EmptyLegStatus.Available;
            leg.BlockedUntil = null;
            leg.BlockedByUserId = null;

            // Mark any pending bookings as failed
            var pendingBookings = await _db.Bookings
                .Where(b => b.EmptyLegId == leg.Id && b.Status == BookingStatus.PaymentPending)
                .ToListAsync();

            foreach (var b in pendingBookings)
            {
                b.Status = BookingStatus.PaymentFailed;
                b.PaymentStatus = PaymentStatus.Failed;
            }
        }

        if (expiredLegs.Any())
            await _db.SaveChangesAsync();
    }

    public async Task<List<BookingDto>> GetUserBookingsAsync(int userId)
    {
        var bookings = await _db.Bookings
            .Include(b => b.EmptyLeg)
                .ThenInclude(el => el.Jet)
            .Include(b => b.EmptyLeg)
                .ThenInclude(el => el.Operator)
            .Include(b => b.Passengers)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        return bookings.Select(MapBookingToDto).ToList();
    }

    public async Task<object> GetAirportsAsync()
    {
        var origins = await _db.EmptyLegs
            .Where(el => el.Status == EmptyLegStatus.Available)
            .Select(el => new { el.Origin, el.OriginCode })
            .Distinct()
            .OrderBy(x => x.Origin)
            .ToListAsync();

        var destinations = await _db.EmptyLegs
            .Where(el => el.Status == EmptyLegStatus.Available)
            .Select(el => new { el.Destination, el.DestinationCode })
            .Distinct()
            .OrderBy(x => x.Destination)
            .ToListAsync();

        return new
        {
            origins = origins.Select(o => new { label = $"{o.Origin} ({o.OriginCode})", value = o.Origin, code = o.OriginCode }),
            destinations = destinations.Select(d => new { label = $"{d.Destination} ({d.DestinationCode})", value = d.Destination, code = d.DestinationCode })
        };
    }

    public async Task<bool> ToggleFavoriteAsync(int emptyLegId, int userId)
    {
        var existing = await _db.Favorites
            .FirstOrDefaultAsync(f => f.EmptyLegId == emptyLegId && f.UserId == userId);

        if (existing != null)
        {
            _db.Favorites.Remove(existing);
            await _db.SaveChangesAsync();
            return false;
        }

        _db.Favorites.Add(new Favorite
        {
            EmptyLegId = emptyLegId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<CouponValidationResponse> ValidateCouponAsync(string code, decimal amount)
    {
        var coupon = await _db.Coupons
            .FirstOrDefaultAsync(c => c.Code.ToLower() == code.ToLower());

        if (coupon == null)
            return new CouponValidationResponse { IsValid = false, Message = "Coupon not found.", DiscountAmount = 0 };

        if (!coupon.IsValid)
            return new CouponValidationResponse { IsValid = false, Message = "Coupon is expired or has reached its usage limit.", DiscountAmount = 0 };

        if (coupon.MinBookingAmount.HasValue && amount < coupon.MinBookingAmount.Value)
            return new CouponValidationResponse
            {
                IsValid = false,
                Message = $"Minimum booking amount of {coupon.MinBookingAmount:C} required.",
                DiscountAmount = 0
            };

        decimal discount;
        if (coupon.DiscountType == DiscountType.Percentage)
        {
            discount = amount * coupon.DiscountValue / 100;
            if (coupon.MaxDiscountAmount.HasValue)
                discount = Math.Min(discount, coupon.MaxDiscountAmount.Value);
        }
        else
        {
            discount = coupon.DiscountValue;
        }

        discount = Math.Min(discount, amount);

        return new CouponValidationResponse
        {
            IsValid = true,
            Message = $"Coupon applied. You save {discount:C}.",
            DiscountAmount = discount
        };
    }

    public EmptyLegDto MapToDto(EmptyLeg el, int? currentUserId, List<int> favoriteIds)
    {
        int? secondsUntilUnlock = null;
        if (el.Status == EmptyLegStatus.Blocked && el.BlockedUntil.HasValue)
        {
            var remaining = (int)(el.BlockedUntil.Value - DateTime.UtcNow).TotalSeconds;
            secondsUntilUnlock = remaining > 0 ? remaining : 0;
        }

        return new EmptyLegDto
        {
            Id = el.Id,
            OperatorId = el.OperatorId,
            OperatorName = el.Operator?.Name ?? string.Empty,
            OperatorLogo = el.Operator?.LogoUrl ?? string.Empty,
            JetId = el.JetId,
            JetModel = el.Jet?.ModelName ?? string.Empty,
            Manufacturer = el.Jet?.Manufacturer ?? string.Empty,
            JetCategory = el.Jet?.Category.ToString() ?? string.Empty,
            MainImageUrl = el.Jet?.MainImageUrl ?? string.Empty,
            TailNumber = el.Jet?.TailNumber ?? string.Empty,
            SeatingCapacity = el.Jet?.SeatingCapacity ?? 0,
            Origin = el.Origin,
            OriginCode = el.OriginCode,
            Destination = el.Destination,
            DestinationCode = el.DestinationCode,
            DepartureUtc = el.DepartureUtc,
            ArrivalUtc = el.ArrivalUtc,
            DurationMinutes = el.DurationMinutes,
            AvailableSeats = el.AvailableSeats,
            Price = el.Price,
            TaxAmount = el.TaxAmount,
            TotalPrice = el.TotalPrice,
            Status = el.Status.ToString(),
            SecondsUntilUnlock = secondsUntilUnlock,
            IsFavorite = favoriteIds.Contains(el.Id),
            HasWifi = el.Jet?.HasWifi ?? false,
            HasCatering = el.Jet?.HasCatering ?? false,
            HasBedroom = el.Jet?.HasBedroom ?? false,
            ConfirmationMode = el.Jet?.ConfirmationMode.ToString() ?? string.Empty
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

    private async Task<decimal> GetUserCreditsAsync(int userId)
    {
        var credits = await _db.CreditTransactions
            .Where(ct => ct.UserId == userId)
            .SumAsync(ct =>
                ct.TransactionType == CreditTransactionType.Earned || ct.TransactionType == CreditTransactionType.Refunded
                    ? ct.Amount
                    : -ct.Amount);
        return Math.Max(0, credits);
    }

    private static string GenerateRandom4()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, 4)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }
}
