using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EmptyLegs.Core.DTOs;
using EmptyLegs.Core.Entities;
using EmptyLegs.Core.Enums;
using EmptyLegs.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace EmptyLegs.Application.Services;

public class AuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _db.Users
            .Include(u => u.Operator)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (user == null || !user.IsActive)
            return null;

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;

        var credits = await GetUserCreditsAsync(user.Id);
        var token = GenerateToken(user);

        return new AuthResponse(
            Token: token,
            Email: user.Email,
            FullName: user.FullName,
            Role: user.Role.ToString(),
            UserId: user.Id,
            OperatorId: user.OperatorId,
            Credits: credits
        );
    }

    public async Task<AuthResponse?> RegisterAsync(RegisterRequest request)
    {
        var existingUser = await _db.Users
            .AnyAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (existingUser)
            return null;

        var referralCode = await GenerateUniqueReferralCodeAsync();

        var user = new User
        {
            Email = request.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            Phone = request.Phone,
            Role = UserRole.User,
            ReferralCode = referralCode,
            ReferredByCode = request.ReferralCode,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        // Handle referral if provided
        if (!string.IsNullOrWhiteSpace(request.ReferralCode))
        {
            var referrer = await _db.Users
                .FirstOrDefaultAsync(u => u.ReferralCode == request.ReferralCode);

            if (referrer != null)
            {
                var referral = new Referral
                {
                    ReferrerId = referrer.Id,
                    ReferredUserId = user.Id,
                    ReferralCode = request.ReferralCode,
                    IsConverted = false,
                    CreditsAwarded = 0,
                    CreatedAt = DateTime.UtcNow
                };
                _db.Referrals.Add(referral);
                await _db.SaveChangesAsync();
            }
        }

        var credits = await GetUserCreditsAsync(user.Id);
        var token = GenerateToken(user);

        return new AuthResponse(
            Token: token,
            Email: user.Email,
            FullName: user.FullName,
            Role: user.Role.ToString(),
            UserId: user.Id,
            OperatorId: user.OperatorId,
            Credits: credits
        );
    }

    public string GenerateToken(User user)
    {
        var secret = _config["Jwt:Secret"] ?? "EmptyLegsS3cur3K3y!2024SuperSecretKeyForJWTTokenGeneration";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("userId", user.Id.ToString()),
            new Claim("email", user.Email),
            new Claim("role", user.Role.ToString())
        };

        if (user.OperatorId.HasValue)
        {
            claims.Add(new Claim("operatorId", user.OperatorId.Value.ToString()));
        }

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "EmptyLegs",
            audience: _config["Jwt:Audience"] ?? "EmptyLegsApp",
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public async Task<decimal> GetUserCreditsAsync(int userId)
    {
        var credits = await _db.CreditTransactions
            .Where(ct => ct.UserId == userId)
            .SumAsync(ct =>
                ct.TransactionType == CreditTransactionType.Earned || ct.TransactionType == CreditTransactionType.Refunded
                    ? ct.Amount
                    : -ct.Amount);

        return Math.Max(0, credits);
    }

    private async Task<string> GenerateUniqueReferralCodeAsync()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        string code;

        do
        {
            code = new string(Enumerable.Repeat(chars, 8)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }
        while (await _db.Users.AnyAsync(u => u.ReferralCode == code));

        return code;
    }
}
