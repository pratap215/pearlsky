using EmptyLegs.Core.Enums;

namespace EmptyLegs.Core.Entities;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.User;
    public int? OperatorId { get; set; }
    public string ReferralCode { get; set; } = string.Empty;
    public string? ReferredByCode { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Operator? Operator { get; set; }
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<SavedSearch> SavedSearches { get; set; } = new List<SavedSearch>();
    public ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();
    public ICollection<CreditTransaction> CreditTransactions { get; set; } = new List<CreditTransaction>();
    public ICollection<Referral> ReferralsMade { get; set; } = new List<Referral>();

    public string FullName => $"{FirstName} {LastName}";
}
