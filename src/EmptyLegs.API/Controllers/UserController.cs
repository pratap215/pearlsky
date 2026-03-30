using System.Security.Claims;
using EmptyLegs.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmptyLegs.API.Controllers;

[ApiController]
[Route("api/user")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly UserService _userService;

    public UserController(UserService userService)
    {
        _userService = userService;
    }

    private int? GetCurrentUserId()
    {
        var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(value, out var id) ? id : null;
    }

    // ─── Profile ─────────────────────────────────────────────────────────────────

    /// <summary>GET api/user/profile</summary>
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var result = await _userService.GetProfileAsync(userId.Value);
        if (result == null)
            return NotFound(new { message = "User not found." });

        return Ok(result);
    }

    // ─── Credits ─────────────────────────────────────────────────────────────────

    /// <summary>GET api/user/credits</summary>
    [HttpGet("credits")]
    public async Task<IActionResult> GetCredits()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var result = await _userService.GetCreditsAsync(userId.Value);
        return Ok(result);
    }

    // ─── Referrals ───────────────────────────────────────────────────────────────

    /// <summary>GET api/user/referrals</summary>
    [HttpGet("referrals")]
    public async Task<IActionResult> GetReferrals()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var result = await _userService.GetReferralSummaryAsync(userId.Value);
        return Ok(result);
    }

    // ─── Saved Searches ──────────────────────────────────────────────────────────

    /// <summary>GET api/user/saved-searches</summary>
    [HttpGet("saved-searches")]
    public async Task<IActionResult> GetSavedSearches()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var result = await _userService.GetSavedSearchesAsync(userId.Value);
        return Ok(result);
    }

    /// <summary>POST api/user/saved-searches</summary>
    [HttpPost("saved-searches")]
    public async Task<IActionResult> AddSavedSearch([FromBody] AddSavedSearchRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var result = await _userService.AddSavedSearchAsync(
            userId.Value,
            request.Origin,
            request.Destination,
            request.AlertType);

        return StatusCode(201, result);
    }

    /// <summary>DELETE api/user/saved-searches/{id}</summary>
    [HttpDelete("saved-searches/{id:int}")]
    public async Task<IActionResult> DeleteSavedSearch(int id)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var success = await _userService.DeleteSavedSearchAsync(userId.Value, id);
        if (!success)
            return NotFound(new { message = "Saved search not found." });

        return NoContent();
    }

    // ─── Notifications ───────────────────────────────────────────────────────────

    /// <summary>GET api/user/notifications</summary>
    [HttpGet("notifications")]
    public async Task<IActionResult> GetNotifications()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var result = await _userService.GetNotificationsAsync(userId.Value);
        return Ok(result);
    }

    /// <summary>POST api/user/notifications/mark-all-read</summary>
    [HttpPost("notifications/mark-all-read")]
    public async Task<IActionResult> MarkAllRead()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        await _userService.MarkAllReadAsync(userId.Value);
        return Ok(new { message = "All notifications marked as read." });
    }

    /// <summary>GET api/user/notifications/unread-count</summary>
    [HttpGet("notifications/unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var count = await _userService.GetUnreadCountAsync(userId.Value);
        return Ok(new { count });
    }

    /// <summary>DELETE api/user/notifications</summary>
    [HttpDelete("notifications")]
    public async Task<IActionResult> ClearAllNotifications()
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();
        await _userService.ClearAllNotificationsAsync(userId.Value);
        return NoContent();
    }

    // ─── Jet Subscriptions ───────────────────────────────────────────────────────

    /// <summary>GET api/user/jet-subscriptions</summary>
    [HttpGet("jet-subscriptions")]
    public async Task<IActionResult> GetJetSubscriptions()
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();
        var result = await _userService.GetJetSubscriptionsAsync(userId.Value);
        return Ok(result);
    }

    /// <summary>POST api/user/jet-subscriptions/{jetId}</summary>
    [HttpPost("jet-subscriptions/{jetId:int}")]
    public async Task<IActionResult> SubscribeToJet(int jetId)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();
        var result = await _userService.SubscribeToJetAsync(userId.Value, jetId);
        return StatusCode(201, result);
    }

    /// <summary>DELETE api/user/jet-subscriptions/{jetId}</summary>
    [HttpDelete("jet-subscriptions/{jetId:int}")]
    public async Task<IActionResult> UnsubscribeFromJet(int jetId)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();
        await _userService.UnsubscribeFromJetAsync(userId.Value, jetId);
        return NoContent();
    }

    /// <summary>GET api/user/jet-subscriptions/{jetId}/status</summary>
    [HttpGet("jet-subscriptions/{jetId:int}/status")]
    public async Task<IActionResult> GetSubscriptionStatus(int jetId)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();
        var isSubscribed = await _userService.IsSubscribedToJetAsync(userId.Value, jetId);
        return Ok(new { isSubscribed });
    }
}

/// <summary>
/// Request body for adding a saved search.
/// </summary>
public class AddSavedSearchRequest
{
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public string AlertType { get; set; } = "Weekly";
}
