using EmptyLegs.Core.Enums;

namespace EmptyLegs.Core.Entities;

public class Payment
{
    public int Id { get; set; }
    public int BookingId { get; set; }
    public string TransactionId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public string Gateway { get; set; } = "Mock";
    public string? GatewayResponse { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }

    public Booking Booking { get; set; } = null!;
}
