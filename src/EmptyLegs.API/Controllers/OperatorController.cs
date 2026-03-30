using System.Security.Claims;
using EmptyLegs.Application.Services;
using EmptyLegs.Core.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmptyLegs.API.Controllers;

[ApiController]
[Route("api/operator")]
[Authorize(Roles = "OperatorAdmin")]
public class OperatorController : ControllerBase
{
    private readonly OperatorService _operatorService;

    public OperatorController(OperatorService operatorService)
    {
        _operatorService = operatorService;
    }

    private int? GetOperatorId()
    {
        var value = User.FindFirst("operatorId")?.Value;
        return int.TryParse(value, out var id) ? id : null;
    }

    // ─── Dashboard ──────────────────────────────────────────────────────────────

    /// <summary>GET api/operator/dashboard</summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var operatorId = GetOperatorId();
        if (operatorId == null)
            return Forbid();

        var result = await _operatorService.GetDashboardAsync(operatorId.Value);
        return Ok(result);
    }

    // ─── Jets ────────────────────────────────────────────────────────────────────

    /// <summary>GET api/operator/jets</summary>
    [HttpGet("jets")]
    public async Task<IActionResult> GetJets()
    {
        var operatorId = GetOperatorId();
        if (operatorId == null)
            return Forbid();

        var result = await _operatorService.GetJetsAsync(operatorId.Value);
        return Ok(result);
    }

    /// <summary>GET api/operator/jets/{id}</summary>
    [HttpGet("jets/{id:int}")]
    public async Task<IActionResult> GetJet(int id)
    {
        var operatorId = GetOperatorId();
        if (operatorId == null)
            return Forbid();

        var jets = await _operatorService.GetJetsAsync(operatorId.Value);
        var jet = jets.FirstOrDefault(j => j.Id == id);
        if (jet == null)
            return NotFound(new { message = "Jet not found." });

        return Ok(jet);
    }

    /// <summary>POST api/operator/jets</summary>
    [HttpPost("jets")]
    public async Task<IActionResult> CreateJet([FromBody] CreateJetRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var operatorId = GetOperatorId();
        if (operatorId == null)
            return Forbid();

        var result = await _operatorService.CreateJetAsync(operatorId.Value, request);
        return StatusCode(201, result);
    }

    /// <summary>PUT api/operator/jets/{id}</summary>
    [HttpPut("jets/{id:int}")]
    public async Task<IActionResult> UpdateJet(int id, [FromBody] CreateJetRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var operatorId = GetOperatorId();
        if (operatorId == null)
            return Forbid();

        var result = await _operatorService.UpdateJetAsync(operatorId.Value, id, request);
        if (result == null)
            return NotFound(new { message = "Jet not found." });

        return Ok(result);
    }

    /// <summary>DELETE api/operator/jets/{id}</summary>
    [HttpDelete("jets/{id:int}")]
    public async Task<IActionResult> DeleteJet(int id)
    {
        var operatorId = GetOperatorId();
        if (operatorId == null)
            return Forbid();

        var success = await _operatorService.DeleteJetAsync(operatorId.Value, id);
        if (!success)
            return NotFound(new { message = "Jet not found." });

        return NoContent();
    }

    // ─── Empty Legs ──────────────────────────────────────────────────────────────

    /// <summary>GET api/operator/emptylegs (also accessible as api/operator/empty-legs)</summary>
    [HttpGet("emptylegs")]
    [HttpGet("empty-legs")]
    public async Task<IActionResult> GetEmptyLegs()
    {
        var operatorId = GetOperatorId();
        if (operatorId == null)
            return Forbid();

        var result = await _operatorService.GetEmptyLegsAsync(operatorId.Value);
        return Ok(result);
    }

    /// <summary>POST api/operator/emptylegs (also accessible as api/operator/empty-legs)</summary>
    [HttpPost("emptylegs")]
    [HttpPost("empty-legs")]
    public async Task<IActionResult> CreateEmptyLeg([FromBody] CreateEmptyLegRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var operatorId = GetOperatorId();
        if (operatorId == null)
            return Forbid();

        try
        {
            var result = await _operatorService.CreateEmptyLegAsync(operatorId.Value, request);
            return StatusCode(201, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>DELETE api/operator/emptylegs/{id} (also accessible as api/operator/empty-legs/{id})</summary>
    [HttpDelete("emptylegs/{id:int}")]
    [HttpDelete("empty-legs/{id:int}")]
    public async Task<IActionResult> DeleteEmptyLeg(int id)
    {
        var operatorId = GetOperatorId();
        if (operatorId == null)
            return Forbid();

        var success = await _operatorService.DeleteEmptyLegAsync(operatorId.Value, id);
        if (!success)
            return NotFound(new { message = "Empty leg not found or cannot be deleted." });

        return NoContent();
    }

    // ─── Bookings ────────────────────────────────────────────────────────────────

    /// <summary>GET api/operator/bookings</summary>
    [HttpGet("bookings")]
    public async Task<IActionResult> GetBookings()
    {
        var operatorId = GetOperatorId();
        if (operatorId == null)
            return Forbid();

        var result = await _operatorService.GetBookingsAsync(operatorId.Value);
        return Ok(result);
    }

    /// <summary>POST api/operator/bookings/{id}/confirm</summary>
    [HttpPost("bookings/{id:int}/confirm")]
    public async Task<IActionResult> ConfirmBooking(int id)
    {
        var operatorId = GetOperatorId();
        if (operatorId == null)
            return Forbid();

        var result = await _operatorService.ConfirmBookingAsync(operatorId.Value, id);
        if (result == null)
            return NotFound(new { message = "Booking not found or not pending confirmation." });

        return Ok(result);
    }

    /// <summary>POST api/operator/bookings/{id}/reject</summary>
    [HttpPost("bookings/{id:int}/reject")]
    public async Task<IActionResult> RejectBooking(int id, [FromBody] RejectBookingRequest request)
    {
        var operatorId = GetOperatorId();
        if (operatorId == null)
            return Forbid();

        var result = await _operatorService.RejectBookingAsync(operatorId.Value, id, request.Reason ?? "No reason provided.");
        if (result == null)
            return NotFound(new { message = "Booking not found." });

        return Ok(result);
    }
}

/// <summary>
/// Request body for rejecting a booking.
/// </summary>
public class RejectBookingRequest
{
    public string? Reason { get; set; }
}
