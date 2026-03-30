using EmptyLegs.Core.Enums;

namespace EmptyLegs.Core.Entities;

public class SavedSearch
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public AlertType AlertType { get; set; } = AlertType.Weekly;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
