using EmptyLegs.Core.DTOs;
using EmptyLegs.Core.Entities;
using EmptyLegs.Core.Enums;
using EmptyLegs.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EmptyLegs.Application.Services;

public class OperatorService
{
    private readonly AppDbContext _db;
    private readonly EmailService _emailService;

    public OperatorService(AppDbContext db, EmailService emailService)
    {
        _db = db;
        _emailService = emailService;
    }

    public async Task<OperatorDashboardDto> GetDashboardAsync(int operatorId)
    {
        var totalJets = await _db.Jets.CountAsync(j => j.OperatorId == operatorId);
        var activeEmptyLegs = await _db.EmptyLegs.CountAsync(el => el.OperatorId == operatorId && el.Status == EmptyLegStatus.Available);
        var totalBookings = await _db.Bookings.CountAsync(b => b.OperatorId == operatorId);
        var pendingConfirmations = await _db.Bookings.CountAsync(b => b.OperatorId == operatorId && b.Status == BookingStatus.PendingConfirmation);

        var totalRevenue = await _db.Bookings
            .Where(b => b.OperatorId == operatorId && (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed))
            .SumAsync(b => (decimal?)b.TotalAmount) ?? 0;

        var recentBookings = await _db.Bookings
            .Include(b => b.EmptyLeg)
                .ThenInclude(el => el.Jet)
            .Include(b => b.EmptyLeg)
                .ThenInclude(el => el.Operator)
            .Include(b => b.Passengers)
            .Where(b => b.OperatorId == operatorId)
            .OrderByDescending(b => b.CreatedAt)
            .Take(5)
            .ToListAsync();

        return new OperatorDashboardDto
        {
            TotalJets = totalJets,
            ActiveEmptyLegs = activeEmptyLegs,
            TotalBookings = totalBookings,
            PendingConfirmations = pendingConfirmations,
            TotalRevenue = totalRevenue,
            RecentBookings = recentBookings.Select(MapBookingToDto).ToList()
        };
    }

    public async Task<List<JetDto>> GetJetsAsync(int operatorId)
    {
        var jets = await _db.Jets
            .Include(j => j.Images)
            .Include(j => j.Operator)
            .Where(j => j.OperatorId == operatorId)
            .OrderByDescending(j => j.CreatedAt)
            .ToListAsync();

        return jets.Select(MapJetToDto).ToList();
    }

    public async Task<JetDto> CreateJetAsync(int operatorId, CreateJetRequest req)
    {
        var jet = new Jet
        {
            OperatorId = operatorId,
            Manufacturer = req.Manufacturer,
            ModelName = req.ModelName,
            Category = req.Category,
            TailNumber = req.TailNumber,
            YearOfManufacture = req.YearOfManufacture,
            SeatingCapacity = req.SeatingCapacity,
            RangeKm = req.RangeKm,
            SpeedKmh = req.SpeedKmh,
            Description = req.Description ?? string.Empty,
            BasePrice = req.BasePrice,
            ConfirmationMode = req.ConfirmationMode,
            HasWifi = req.HasWifi,
            HasCatering = req.HasCatering,
            HasBedroom = req.HasBedroom,
            Status = JetStatus.Active,
            MainImageUrl = string.Empty,
            InteriorImageUrl = string.Empty,
            CreatedAt = DateTime.UtcNow
        };

        _db.Jets.Add(jet);
        await _db.SaveChangesAsync();

        // Reload with operator
        await _db.Entry(jet).Reference(j => j.Operator).LoadAsync();

        return MapJetToDto(jet);
    }

    public async Task<JetDto?> UpdateJetAsync(int operatorId, int jetId, CreateJetRequest req)
    {
        var jet = await _db.Jets
            .Include(j => j.Images)
            .Include(j => j.Operator)
            .FirstOrDefaultAsync(j => j.Id == jetId && j.OperatorId == operatorId);

        if (jet == null)
            return null;

        jet.Manufacturer = req.Manufacturer;
        jet.ModelName = req.ModelName;
        jet.Category = req.Category;
        jet.TailNumber = req.TailNumber;
        jet.YearOfManufacture = req.YearOfManufacture;
        jet.SeatingCapacity = req.SeatingCapacity;
        jet.RangeKm = req.RangeKm;
        jet.SpeedKmh = req.SpeedKmh;
        jet.Description = req.Description ?? string.Empty;
        jet.BasePrice = req.BasePrice;
        jet.ConfirmationMode = req.ConfirmationMode;
        jet.HasWifi = req.HasWifi;
        jet.HasCatering = req.HasCatering;
        jet.HasBedroom = req.HasBedroom;

        await _db.SaveChangesAsync();

        return MapJetToDto(jet);
    }

    public async Task<bool> DeleteJetAsync(int operatorId, int jetId)
    {
        var jet = await _db.Jets
            .FirstOrDefaultAsync(j => j.Id == jetId && j.OperatorId == operatorId);

        if (jet == null)
            return false;

        jet.Status = JetStatus.Inactive;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<EmptyLegDto>> GetEmptyLegsAsync(int operatorId)
    {
        var emptyLegs = await _db.EmptyLegs
            .Include(el => el.Jet)
                .ThenInclude(j => j.Images)
            .Include(el => el.Operator)
            .Where(el => el.OperatorId == operatorId)
            .OrderByDescending(el => el.CreatedAt)
            .ToListAsync();

        return emptyLegs.Select(el => MapEmptyLegToDto(el)).ToList();
    }

    public async Task<EmptyLegDto> CreateEmptyLegAsync(int operatorId, CreateEmptyLegRequest req)
    {
        var jet = await _db.Jets
            .FirstOrDefaultAsync(j => j.Id == req.JetId && j.OperatorId == operatorId)
            ?? throw new InvalidOperationException("Jet not found or does not belong to operator.");

        var emptyLeg = new EmptyLeg
        {
            OperatorId = operatorId,
            JetId = req.JetId,
            Origin = req.Origin,
            OriginCode = req.OriginCode,
            Destination = req.Destination,
            DestinationCode = req.DestinationCode,
            DepartureUtc = req.DepartureUtc,
            ArrivalUtc = req.ArrivalUtc,
            AvailableSeats = req.AvailableSeats,
            Price = req.Price,
            LockDurationMinutes = req.LockDurationMinutes,
            Notes = req.Notes,
            Status = EmptyLegStatus.Available,
            CreatedAt = DateTime.UtcNow
        };

        _db.EmptyLegs.Add(emptyLeg);
        await _db.SaveChangesAsync();

        // Notify jet subscribers via email (fire-and-forget)
        var subscribers = await _db.JetSubscriptions
            .Include(js => js.User)
            .Where(js => js.JetId == req.JetId)
            .ToListAsync();

        foreach (var sub in subscribers)
        {
            if (sub.User != null)
            {
                _ = _emailService.SendNewEmptyLegNotificationAsync(
                    sub.User.Email,
                    sub.User.FullName,
                    jet.ModelName,
                    req.Origin,
                    req.Destination,
                    req.Price,
                    jet.TailNumber);
            }
        }

        await _db.Entry(emptyLeg).Reference(el => el.Jet).LoadAsync();
        await _db.Entry(emptyLeg.Jet).Collection(j => j.Images).LoadAsync();
        await _db.Entry(emptyLeg).Reference(el => el.Operator).LoadAsync();

        return MapEmptyLegToDto(emptyLeg);
    }

    public async Task<bool> DeleteEmptyLegAsync(int operatorId, int emptyLegId)
    {
        var emptyLeg = await _db.EmptyLegs
            .FirstOrDefaultAsync(el => el.Id == emptyLegId && el.OperatorId == operatorId);

        if (emptyLeg == null)
            return false;

        if (emptyLeg.Status == EmptyLegStatus.Booked)
            return false;

        emptyLeg.Status = EmptyLegStatus.Cancelled;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<BookingDto>> GetBookingsAsync(int operatorId)
    {
        var bookings = await _db.Bookings
            .Include(b => b.EmptyLeg)
                .ThenInclude(el => el.Jet)
            .Include(b => b.EmptyLeg)
                .ThenInclude(el => el.Operator)
            .Include(b => b.Passengers)
            .Where(b => b.OperatorId == operatorId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        return bookings.Select(MapBookingToDto).ToList();
    }

    public async Task<BookingDto?> ConfirmBookingAsync(int operatorId, int bookingId)
    {
        var booking = await _db.Bookings
            .Include(b => b.EmptyLeg)
                .ThenInclude(el => el.Jet)
            .Include(b => b.EmptyLeg)
                .ThenInclude(el => el.Operator)
            .Include(b => b.Passengers)
            .FirstOrDefaultAsync(b => b.Id == bookingId && b.OperatorId == operatorId);

        if (booking == null || booking.Status != BookingStatus.PendingConfirmation)
            return null;

        booking.Status = BookingStatus.Confirmed;
        booking.ConfirmedAt = DateTime.UtcNow;

        var notification = new Notification
        {
            UserId = booking.UserId,
            Title = "Booking Confirmed by Operator",
            Message = $"Your booking {booking.BookingRef} has been confirmed by the operator.",
            Type = NotificationType.BookingConfirmed,
            BookingId = booking.Id,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
        _db.Notifications.Add(notification);

        await _db.SaveChangesAsync();

        return MapBookingToDto(booking);
    }

    public async Task<BookingDto?> RejectBookingAsync(int operatorId, int bookingId, string reason)
    {
        var booking = await _db.Bookings
            .Include(b => b.EmptyLeg)
                .ThenInclude(el => el.Jet)
            .Include(b => b.EmptyLeg)
                .ThenInclude(el => el.Operator)
            .Include(b => b.Passengers)
            .FirstOrDefaultAsync(b => b.Id == bookingId && b.OperatorId == operatorId);

        if (booking == null)
            return null;

        booking.Status = BookingStatus.Rejected;
        booking.CancellationReason = reason;
        booking.CancelledAt = DateTime.UtcNow;

        // Release the empty leg back to available
        booking.EmptyLeg.Status = EmptyLegStatus.Available;

        var notification = new Notification
        {
            UserId = booking.UserId,
            Title = "Booking Rejected",
            Message = $"Your booking {booking.BookingRef} has been rejected. Reason: {reason}",
            Type = NotificationType.BookingRejected,
            BookingId = booking.Id,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
        _db.Notifications.Add(notification);

        await _db.SaveChangesAsync();

        return MapBookingToDto(booking);
    }

    public JetDto MapJetToDto(Jet jet)
    {
        return new JetDto
        {
            Id = jet.Id,
            OperatorId = jet.OperatorId,
            OperatorName = jet.Operator?.Name ?? string.Empty,
            Manufacturer = jet.Manufacturer,
            ModelName = jet.ModelName,
            Category = jet.Category.ToString(),
            TailNumber = jet.TailNumber,
            YearOfManufacture = jet.YearOfManufacture,
            SeatingCapacity = jet.SeatingCapacity,
            RangeKm = jet.RangeKm,
            SpeedKmh = jet.SpeedKmh,
            Description = jet.Description,
            MainImageUrl = jet.MainImageUrl,
            InteriorImageUrl = jet.InteriorImageUrl,
            ImageUrls = jet.Images?.Select(i => i.ImageUrl).ToList() ?? new List<string>(),
            BasePrice = jet.BasePrice,
            Status = jet.Status.ToString(),
            ConfirmationMode = jet.ConfirmationMode.ToString(),
            HasWifi = jet.HasWifi,
            HasCatering = jet.HasCatering,
            HasBedroom = jet.HasBedroom,
            TotalEmptyLegs = jet.EmptyLegs?.Count ?? 0
        };
    }

    public BookingDto MapBookingToDto(Booking b)
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

    private EmptyLegDto MapEmptyLegToDto(EmptyLeg el)
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
            IsFavorite = false,
            HasWifi = el.Jet?.HasWifi ?? false,
            HasCatering = el.Jet?.HasCatering ?? false,
            HasBedroom = el.Jet?.HasBedroom ?? false,
            ConfirmationMode = el.Jet?.ConfirmationMode.ToString() ?? string.Empty
        };
    }
}
