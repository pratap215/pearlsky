using EmptyLegs.Core.Enums;

namespace EmptyLegs.Core.Entities;

public class Booking
{
    public int Id { get; set; }
    public int EmptyLegId { get; set; }
    public int UserId { get; set; }
    public int OperatorId { get; set; }
    public string BookingRef { get; set; } = string.Empty;
    public BookingStatus Status { get; set; } = BookingStatus.PendingConfirmation;
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    public decimal BaseAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal CreditsUsed { get; set; }
    public decimal TotalAmount { get; set; }
    public string? CouponCode { get; set; }
    public string? ReferralCodeUsed { get; set; }
    public int PassengerCount { get; set; }
    public string? Notes { get; set; }
    public bool PolicyAcknowledged { get; set; }
    public bool RequiresOperatorConfirmation { get; set; }
    public string? PaymentTransactionId { get; set; }
    public string? CancellationReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? CancelledAt { get; set; }

    public EmptyLeg EmptyLeg { get; set; } = null!;
    public User User { get; set; } = null!;
    public ICollection<Passenger> Passengers { get; set; } = new List<Passenger>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
