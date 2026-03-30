namespace EmptyLegs.Core.DTOs;

public record LoginRequest(string Email, string Password);
public record RegisterRequest(string FirstName, string LastName, string Email, string Password, string Phone, string? ReferralCode);
public record AuthResponse(string Token, string Email, string FullName, string Role, int UserId, int? OperatorId, decimal Credits);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
