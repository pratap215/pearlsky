namespace EmptyLegs.Core.Entities;

public class Referral
{
    public int Id { get; set; }
    public int ReferrerId { get; set; }
    public int? ReferredUserId { get; set; }
    public string ReferralCode { get; set; } = string.Empty;
    public bool IsConverted { get; set; }
    public decimal CreditsAwarded { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ConvertedAt { get; set; }

    public User Referrer { get; set; } = null!;
}
