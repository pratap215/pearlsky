using System.Security.Claims;
using EmptyLegs.Application.Services;
using EmptyLegs.Core.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmptyLegs.API.Controllers;

[ApiController]
[Route("api/emptylegs")]
public class EmptyLegsController : ControllerBase
{
    private readonly EmptyLegService _emptyLegService;

    public EmptyLegsController(EmptyLegService emptyLegService)
    {
        _emptyLegService = emptyLegService;
    }

    private int? GetCurrentUserId()
    {
        var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(value, out var id) ? id : null;
    }

    /// <summary>
    /// GET api/emptylegs — search with optional auth for favorites
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] EmptyLegSearchRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _emptyLegService.SearchAsync(request, userId);
        return Ok(result);
    }

    /// <summary>
    /// GET api/emptylegs/{id} — detail view
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetDetail(int id)
    {
        var userId = GetCurrentUserId();
        var result = await _emptyLegService.GetDetailAsync(id, userId);
        if (result == null)
            return NotFound(new { message = "Empty leg not found." });
        return Ok(result);
    }

    /// <summary>
    /// POST api/emptylegs/{id}/initiate — initiate booking lock
    /// </summary>
    [HttpPost("{id:int}/initiate")]
    [Authorize]
    public async Task<IActionResult> InitiateBooking(int id, [FromBody] CreateBookingRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        try
        {
            var result = await _emptyLegService.InitiateBookingAsync(id, request, userId.Value);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// POST api/emptylegs/confirm-payment — confirm or fail payment
    /// </summary>
    [HttpPost("confirm-payment")]
    [Authorize]
    public async Task<IActionResult> ConfirmPayment([FromBody] ConfirmPaymentRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var result = await _emptyLegService.ConfirmPaymentAsync(request.BookingId, request.Success, userId.Value, request.CouponCode, request.CreditsToUse);
        if (result == null)
            return NotFound(new { message = "Booking not found." });

        return Ok(result);
    }

    /// <summary>
    /// GET api/emptylegs/bookings — get current user bookings
    /// </summary>
    [HttpGet("bookings")]
    [Authorize]
    public async Task<IActionResult> GetBookings()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var result = await _emptyLegService.GetUserBookingsAsync(userId.Value);
        return Ok(result);
    }

    /// <summary>
    /// POST api/emptylegs/{id}/favorite — toggle favorite
    /// </summary>
    [HttpPost("{id:int}/favorite")]
    [Authorize]
    public async Task<IActionResult> ToggleFavorite(int id)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var isFavorite = await _emptyLegService.ToggleFavoriteAsync(id, userId.Value);
        return Ok(new { isFavorite });
    }

    /// <summary>
    /// POST api/emptylegs/validate-coupon — validate a coupon code
    /// </summary>
    [HttpPost("validate-coupon")]
    [Authorize]
    public async Task<IActionResult> ValidateCoupon([FromBody] ValidateCouponRequest request)
    {
        var result = await _emptyLegService.ValidateCouponAsync(request.Code, request.Amount);
        return Ok(result);
    }

    /// <summary>
    /// GET api/emptylegs/favorites — get user favorites
    /// </summary>
    [HttpGet("favorites")]
    [Authorize]
    public async Task<IActionResult> GetFavorites()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var req = new EmptyLegSearchRequest(null, null, null, null, null, null, null, null);
        var allLegs = await _emptyLegService.SearchAsync(req, userId);

        // Return only the ones marked as favorites
        var favorites = allLegs.Items.Where(el => el.IsFavorite).ToList();
        return Ok(favorites);
    }

    /// <summary>
    /// GET api/emptylegs/airports — get unique origins and destinations
    /// </summary>
    [HttpGet("airports")]
    public async Task<IActionResult> GetAirports()
    {
        var result = await _emptyLegService.GetAirportsAsync();
        return Ok(result);
    }
}

/// <summary>
/// Request body for confirming/failing a payment.
/// </summary>
public class ConfirmPaymentRequest
{
    public int BookingId { get; set; }
    public bool Success { get; set; }
    public string? CouponCode { get; set; }
    public decimal CreditsToUse { get; set; }
}

/// <summary>
/// Request body for validating a coupon.
/// </summary>
public class ValidateCouponRequest
{
    public string Code { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}
