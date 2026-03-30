using EmptyLegs.Core.Enums;

namespace EmptyLegs.Core.DTOs;

public class CreateJetRequest
{
    public string Manufacturer { get; set; } = string.Empty;
    public string ModelName { get; set; } = string.Empty;
    public JetCategory Category { get; set; }
    public string TailNumber { get; set; } = string.Empty;
    public int YearOfManufacture { get; set; }
    public int SeatingCapacity { get; set; }
    public int RangeKm { get; set; }
    public int SpeedKmh { get; set; }
    public string? Description { get; set; }
    public decimal BasePrice { get; set; }
    public ConfirmationMode ConfirmationMode { get; set; }
    public bool HasWifi { get; set; }
    public bool HasCatering { get; set; }
    public bool HasBedroom { get; set; }
}

public class JetDto
{
    public int Id { get; set; }
    public int OperatorId { get; set; }
    public string OperatorName { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;
    public string ModelName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string TailNumber { get; set; } = string.Empty;
    public int YearOfManufacture { get; set; }
    public int SeatingCapacity { get; set; }
    public int RangeKm { get; set; }
    public int SpeedKmh { get; set; }
    public string Description { get; set; } = string.Empty;
    public string MainImageUrl { get; set; } = string.Empty;
    public string InteriorImageUrl { get; set; } = string.Empty;
    public List<string> ImageUrls { get; set; } = new();
    public decimal BasePrice { get; set; }
    public string Status { get; set; } = string.Empty;
    public string ConfirmationMode { get; set; } = string.Empty;
    public bool HasWifi { get; set; }
    public bool HasCatering { get; set; }
    public bool HasBedroom { get; set; }
    public int TotalEmptyLegs { get; set; }
}

public class CreateEmptyLegRequest
{
    public int JetId { get; set; }
    public string Origin { get; set; } = string.Empty;
    public string OriginCode { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public string DestinationCode { get; set; } = string.Empty;
    public DateTime DepartureUtc { get; set; }
    public DateTime ArrivalUtc { get; set; }
    public int AvailableSeats { get; set; }
    public decimal Price { get; set; }
    public int LockDurationMinutes { get; set; } = 10;
    public string? Notes { get; set; }
}

public class OperatorDashboardDto
{
    public int TotalJets { get; set; }
    public int ActiveEmptyLegs { get; set; }
    public int TotalBookings { get; set; }
    public int PendingConfirmations { get; set; }
    public decimal TotalRevenue { get; set; }
    public List<BookingDto> RecentBookings { get; set; } = new();
}
