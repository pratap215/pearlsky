using EmptyLegs.Core.Enums;

namespace EmptyLegs.Core.DTOs;

public record EmptyLegSearchRequest(
    string? Origin,
    string? Destination,
    DateTime? DateFrom,
    DateTime? DateTo,
    int? MinSeats,
    decimal? MinPrice,
    decimal? MaxPrice,
    JetCategory? Category,
    int Page = 1,
    int PageSize = 20);

public class EmptyLegDto
{
    public int Id { get; set; }
    public int OperatorId { get; set; }
    public string OperatorName { get; set; } = string.Empty;
    public string OperatorLogo { get; set; } = string.Empty;
    public int JetId { get; set; }
    public string JetModel { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;
    public string JetCategory { get; set; } = string.Empty;
    public string MainImageUrl { get; set; } = string.Empty;
    public string TailNumber { get; set; } = string.Empty;
    public int SeatingCapacity { get; set; }
    public string Origin { get; set; } = string.Empty;
    public string OriginCode { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public string DestinationCode { get; set; } = string.Empty;
    public DateTime DepartureUtc { get; set; }
    public DateTime ArrivalUtc { get; set; }
    public int DurationMinutes { get; set; }
    public int AvailableSeats { get; set; }
    public decimal Price { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? SecondsUntilUnlock { get; set; }
    public bool IsFavorite { get; set; }
    public bool HasWifi { get; set; }
    public bool HasCatering { get; set; }
    public bool HasBedroom { get; set; }
    public string ConfirmationMode { get; set; } = string.Empty;
}

public class EmptyLegDetailDto : EmptyLegDto
{
    public string Description { get; set; } = string.Empty;
    public int RangeKm { get; set; }
    public int SpeedKmh { get; set; }
    public int YearOfManufacture { get; set; }
    public List<string> ImageUrls { get; set; } = new();
    public List<PolicyDto> Policies { get; set; } = new();
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}
