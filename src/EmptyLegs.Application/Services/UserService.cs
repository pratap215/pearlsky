using EmptyLegs.Core.DTOs;
using EmptyLegs.Core.Entities;
using EmptyLegs.Core.Enums;
using EmptyLegs.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EmptyLegs.Application.Services;

public class UserService
{
    private readonly AppDbContext _db;

    public UserService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<UserProfileDto?> GetProfileAsync(int userId)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return null;

        var credits = await GetCurrentCreditsAsync(userId);
        var totalBookings = await _db.Bookings.CountAsync(b => b.UserId == userId);
        var totalReferrals = await _db.Referrals.CountAsync(r => r.ReferrerId == userId);

        return new UserProfileDto
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Phone = user.Phone,
            ReferralCode = user.ReferralCode,
            Credits = credits,
            TotalBookings = totalBookings,
            TotalReferrals = totalReferrals
        };
    }

    public async Task<CreditSummaryDto> GetCreditsAsync(int userId)
    {
        var transactions = await _db.CreditTransactions
            .Where(ct => ct.UserId == userId)
            .OrderByDescending(ct => ct.CreatedAt)
            .ToListAsync();

        var totalEarned = transactions
            .Where(ct => ct.TransactionType == CreditTransactionType.Earned || ct.TransactionType == CreditTransactionType.Refunded)
            .Sum(ct => ct.Amount);

        var totalRedeemed = transactions
            .Where(ct => ct.TransactionType == CreditTransactionType.Redeemed)
            .Sum(ct => ct.Amount);

        var totalCredits = totalEarned - totalRedeemed;

        return new CreditSummaryDto
        {
            TotalCredits = Math.Max(0, totalCredits),
            CreditsEarned = totalEarned,
            CreditsRedeemed = totalRedeemed,
            Transactions = transactions.Select(ct => new CreditTransactionDto
            {
                Id = ct.Id,
                Amount = ct.Amount,
                TransactionType = ct.TransactionType.ToString(),
                Description = ct.Description,
                BalanceAfter = ct.BalanceAfter,
                CreatedAt = ct.CreatedAt
            }).ToList()
        };
    }

    public async Task<ReferralSummaryDto> GetReferralSummaryAsync(int userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
            return new ReferralSummaryDto();

        var referrals = await _db.Referrals
            .Where(r => r.ReferrerId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        var creditsEarned = await _db.CreditTransactions
            .Where(ct => ct.UserId == userId && ct.TransactionType == CreditTransactionType.Earned)
            .SumAsync(ct => (decimal?)ct.Amount) ?? 0;

        return new ReferralSummaryDto
        {
            MyReferralCode = user.ReferralCode,
            TotalReferrals = referrals.Count,
            ConvertedReferrals = referrals.Count(r => r.IsConverted),
            CreditsEarned = creditsEarned,
            Referrals = referrals.Select(r => new ReferralDto
            {
                Id = r.Id,
                ReferralCode = r.ReferralCode,
                IsConverted = r.IsConverted,
                CreditsAwarded = r.CreditsAwarded,
                CreatedAt = r.CreatedAt
            }).ToList()
        };
    }

    public async Task<List<SavedSearchDto>> GetSavedSearchesAsync(int userId)
    {
        var searches = await _db.SavedSearches
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        return searches.Select(s => new SavedSearchDto
        {
            Id = s.Id,
            Origin = s.Origin,
            Destination = s.Destination,
            AlertType = s.AlertType.ToString(),
            CreatedAt = s.CreatedAt
        }).ToList();
    }

    public async Task<SavedSearchDto> AddSavedSearchAsync(int userId, string origin, string destination, string alertType)
    {
        if (!Enum.TryParse<AlertType>(alertType, true, out var parsedAlertType))
            parsedAlertType = AlertType.Weekly;

        var savedSearch = new SavedSearch
        {
            UserId = userId,
            Origin = origin,
            Destination = destination,
            AlertType = parsedAlertType,
            CreatedAt = DateTime.UtcNow
        };

        _db.SavedSearches.Add(savedSearch);
        await _db.SaveChangesAsync();

        return new SavedSearchDto
        {
            Id = savedSearch.Id,
            Origin = savedSearch.Origin,
            Destination = savedSearch.Destination,
            AlertType = savedSearch.AlertType.ToString(),
            CreatedAt = savedSearch.CreatedAt
        };
    }

    public async Task<bool> DeleteSavedSearchAsync(int userId, int searchId)
    {
        var search = await _db.SavedSearches
            .FirstOrDefaultAsync(s => s.Id == searchId && s.UserId == userId);

        if (search == null)
            return false;

        _db.SavedSearches.Remove(search);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<NotificationDto>> GetNotificationsAsync(int userId)
    {
        var notifications = await _db.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        return notifications.Select(n => new NotificationDto
        {
            Id = n.Id,
            Title = n.Title,
            Message = n.Message,
            Type = n.Type.ToString(),
            IsRead = n.IsRead,
            BookingId = n.BookingId,
            CreatedAt = n.CreatedAt
        }).ToList();
    }

    public async Task MarkAllReadAsync(int userId)
    {
        var unread = await _db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var n in unread)
            n.IsRead = true;

        if (unread.Any())
            await _db.SaveChangesAsync();
    }

    public async Task ClearAllNotificationsAsync(int userId)
    {
        var notifs = await _db.Notifications
            .Where(n => n.UserId == userId)
            .ToListAsync();
        _db.Notifications.RemoveRange(notifs);
        await _db.SaveChangesAsync();
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        return await _db.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    // ─── Jet Subscriptions ────────────────────────────────────────────────────────

    public async Task<JetSubscriptionDto> SubscribeToJetAsync(int userId, int jetId)
    {
        var existing = await _db.JetSubscriptions
            .Include(js => js.Jet)
            .FirstOrDefaultAsync(js => js.UserId == userId && js.JetId == jetId);
        if (existing != null)
            return MapSubscriptionToDto(existing);

        var sub = new JetSubscription { UserId = userId, JetId = jetId, CreatedAt = DateTime.UtcNow };
        _db.JetSubscriptions.Add(sub);
        await _db.SaveChangesAsync();
        await _db.Entry(sub).Reference(s => s.Jet).LoadAsync();
        return MapSubscriptionToDto(sub);
    }

    public async Task<bool> UnsubscribeFromJetAsync(int userId, int jetId)
    {
        var sub = await _db.JetSubscriptions
            .FirstOrDefaultAsync(js => js.UserId == userId && js.JetId == jetId);
        if (sub == null) return false;
        _db.JetSubscriptions.Remove(sub);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<JetSubscriptionDto>> GetJetSubscriptionsAsync(int userId)
    {
        var subs = await _db.JetSubscriptions
            .Include(js => js.Jet)
            .Where(js => js.UserId == userId)
            .OrderByDescending(js => js.CreatedAt)
            .ToListAsync();
        return subs.Select(MapSubscriptionToDto).ToList();
    }

    public async Task<bool> IsSubscribedToJetAsync(int userId, int jetId)
    {
        return await _db.JetSubscriptions
            .AnyAsync(js => js.UserId == userId && js.JetId == jetId);
    }

    private static JetSubscriptionDto MapSubscriptionToDto(JetSubscription s) => new()
    {
        Id = s.Id,
        JetId = s.JetId,
        JetModel = s.Jet?.ModelName ?? "",
        Manufacturer = s.Jet?.Manufacturer ?? "",
        TailNumber = s.Jet?.TailNumber ?? "",
        MainImageUrl = s.Jet?.MainImageUrl ?? "",
        CreatedAt = s.CreatedAt
    };

    private async Task<decimal> GetCurrentCreditsAsync(int userId)
    {
        var credits = await _db.CreditTransactions
            .Where(ct => ct.UserId == userId)
            .SumAsync(ct =>
                ct.TransactionType == CreditTransactionType.Earned || ct.TransactionType == CreditTransactionType.Refunded
                    ? ct.Amount
                    : -ct.Amount);
        return Math.Max(0, credits);
    }
}
