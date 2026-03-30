namespace EmptyLegs.Core.Entities;

public class Policy
{
    public int Id { get; set; }
    public int? OperatorId { get; set; }
    public int? JetId { get; set; }
    public string PolicyType { get; set; } = "Cancellation";
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime EffectiveDate { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    public Operator? Operator { get; set; }
}
