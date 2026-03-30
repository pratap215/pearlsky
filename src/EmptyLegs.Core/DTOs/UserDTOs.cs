namespace EmptyLegs.Core.DTOs;

public class UserProfileDto
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string ReferralCode { get; set; } = string.Empty;
    public decimal Credits { get; set; }
    public int TotalBookings { get; set; }
    public int TotalReferrals { get; set; }
}

public class CreditSummaryDto
{
    public decimal TotalCredits { get; set; }
    public decimal CreditsEarned { get; set; }
    public decimal CreditsRedeemed { get; set; }
    public List<CreditTransactionDto> Transactions { get; set; } = new();
}

public class CreditTransactionDto
{
    public int Id { get; set; }
    public decimal Amount { get; set; }
    public string TransactionType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal BalanceAfter { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ReferralSummaryDto
{
    public string MyReferralCode { get; set; } = string.Empty;
    public int TotalReferrals { get; set; }
    public int ConvertedReferrals { get; set; }
    public decimal CreditsEarned { get; set; }
    public List<ReferralDto> Referrals { get; set; } = new();
}

public class ReferralDto
{
    public int Id { get; set; }
    public string ReferralCode { get; set; } = string.Empty;
    public bool IsConverted { get; set; }
    public decimal CreditsAwarded { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SavedSearchDto
{
    public int Id { get; set; }
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public string AlertType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class NotificationDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public int? BookingId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class JetSubscriptionDto
{
    public int Id { get; set; }
    public int JetId { get; set; }
    public string JetModel { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;
    public string TailNumber { get; set; } = string.Empty;
    public string MainImageUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class AdminDashboardDto
{
    public int TotalOperators { get; set; }
    public int TotalJets { get; set; }
    public int TotalUsers { get; set; }
    public int TotalBookings { get; set; }
    public int ActiveEmptyLegs { get; set; }
    public int BlockedEmptyLegs { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal MonthlyRevenue { get; set; }
    public List<BookingDto> RecentBookings { get; set; } = new();
}
