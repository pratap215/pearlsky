using EmptyLegs.Core.Enums;

namespace EmptyLegs.Core.Entities;

public class CreditTransaction
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public decimal Amount { get; set; }
    public CreditTransactionType TransactionType { get; set; }
    public string Description { get; set; } = string.Empty;
    public int? BookingId { get; set; }
    public decimal BalanceAfter { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
