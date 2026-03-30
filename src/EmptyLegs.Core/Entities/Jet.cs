using EmptyLegs.Core.Enums;

namespace EmptyLegs.Core.Entities;

public class Jet
{
    public int Id { get; set; }
    public int OperatorId { get; set; }
    public string Manufacturer { get; set; } = string.Empty;
    public string ModelName { get; set; } = string.Empty;
    public JetCategory Category { get; set; }
    public string TailNumber { get; set; } = string.Empty;
    public int YearOfManufacture { get; set; }
    public int SeatingCapacity { get; set; }
    public int RangeKm { get; set; }
    public int SpeedKmh { get; set; }
    public string Description { get; set; } = string.Empty;
    public string MainImageUrl { get; set; } = string.Empty;
    public string InteriorImageUrl { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public JetStatus Status { get; set; } = JetStatus.Active;
    public ConfirmationMode ConfirmationMode { get; set; } = ConfirmationMode.Instant;
    public bool HasWifi { get; set; }
    public bool HasCatering { get; set; }
    public bool HasBedroom { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Operator Operator { get; set; } = null!;
    public ICollection<JetImage> Images { get; set; } = new List<JetImage>();
    public ICollection<EmptyLeg> EmptyLegs { get; set; } = new List<EmptyLeg>();
}
