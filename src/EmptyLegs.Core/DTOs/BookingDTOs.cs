using EmptyLegs.Core.Enums;

namespace EmptyLegs.Core.DTOs;

public class CreateBookingRequest
{
    public int EmptyLegId { get; set; }
    public int PassengerCount { get; set; }
    public List<PassengerDto> Passengers { get; set; } = new();
    public string? CouponCode { get; set; }
    public string? ReferralCodeUsed { get; set; }
    public decimal CreditsToUse { get; set; }
    public string? Notes { get; set; }
    public bool PolicyAcknowledged { get; set; }
}

public class PassengerDto
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? PassportNumber { get; set; }
    public string? Nationality { get; set; }
    public DateTime? DateOfBirth { get; set; }
}

public class BookingDto
{
    public int Id { get; set; }
    public string BookingRef { get; set; } = string.Empty;
    public int EmptyLegId { get; set; }
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public DateTime DepartureUtc { get; set; }
    public string JetModel { get; set; } = string.Empty;
    public string MainImageUrl { get; set; } = string.Empty;
    public string OperatorName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public decimal BaseAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal CreditsUsed { get; set; }
    public decimal TotalAmount { get; set; }
    public int PassengerCount { get; set; }
    public List<PassengerDto> Passengers { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public bool RequiresOperatorConfirmation { get; set; }
}

public class BookingLockResponse
{
    public int BookingId { get; set; }
    public string BookingRef { get; set; } = string.Empty;
    public int LockDurationSeconds { get; set; }
    public DateTime LockedUntil { get; set; }
    public decimal BaseAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal CreditsUsed { get; set; }
    public decimal TotalAmount { get; set; }
    public bool RequiresConfirmation { get; set; }
}

public class CouponValidationRequest(string Code, decimal BookingAmount);
public class CouponValidationResponse
{
    public bool IsValid { get; set; }
    public string Message { get; set; } = string.Empty;
    public decimal DiscountAmount { get; set; }
}

public class PolicyDto
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string PolicyType { get; set; } = string.Empty;
}
