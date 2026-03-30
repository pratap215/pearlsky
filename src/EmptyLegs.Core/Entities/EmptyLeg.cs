using EmptyLegs.Core.Enums;

namespace EmptyLegs.Core.Entities;

public class EmptyLeg
{
    public int Id { get; set; }
    public int OperatorId { get; set; }
    public int JetId { get; set; }
    public string Origin { get; set; } = string.Empty;
    public string OriginCode { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public string DestinationCode { get; set; } = string.Empty;
    public DateTime DepartureUtc { get; set; }
    public DateTime ArrivalUtc { get; set; }
    public int AvailableSeats { get; set; }
    public decimal Price { get; set; }
    public decimal TaxPercent { get; set; } = 18m;
    public EmptyLegStatus Status { get; set; } = EmptyLegStatus.Available;
    public DateTime? BlockedUntil { get; set; }
    public int? BlockedByUserId { get; set; }
    public int LockDurationMinutes { get; set; } = 10;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Operator Operator { get; set; } = null!;
    public Jet Jet { get; set; } = null!;
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();

    public int DurationMinutes => (int)(ArrivalUtc - DepartureUtc).TotalMinutes;
    public decimal TaxAmount => Price * TaxPercent / 100;
    public decimal TotalPrice => Price + TaxAmount;
}
