namespace EmptyLegs.Core.Entities;

public class JetSubscription
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int JetId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public Jet Jet { get; set; } = null!;
}
