namespace EmptyLegs.Core.Entities;

public class Favorite
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int EmptyLegId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public EmptyLeg EmptyLeg { get; set; } = null!;
}
