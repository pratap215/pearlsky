namespace EmptyLegs.Core.Entities;

public class Passenger
{
    public int Id { get; set; }
    public int BookingId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PassportNumber { get; set; } = string.Empty;
    public string Nationality { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }

    public Booking Booking { get; set; } = null!;
}
