using EmptyLegs.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmptyLegs.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "SuperAdmin")]
public class AdminController : ControllerBase
{
    private readonly AdminService _adminService;

    public AdminController(AdminService adminService)
    {
        _adminService = adminService;
    }

    // ─── Dashboard ──────────────────────────────────────────────────────────────

    /// <summary>GET api/admin/dashboard</summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var result = await _adminService.GetDashboardAsync();
        return Ok(result);
    }

    // ─── Operators ───────────────────────────────────────────────────────────────

    /// <summary>GET api/admin/operators</summary>
    [HttpGet("operators")]
    public async Task<IActionResult> GetOperators()
    {
        var result = await _adminService.GetAllOperatorsAsync();
        return Ok(result);
    }

    /// <summary>POST api/admin/operators/{id}/toggle</summary>
    [HttpPost("operators/{id:int}/toggle")]
    public async Task<IActionResult> ToggleOperator(int id)
    {
        var success = await _adminService.ToggleOperatorAsync(id);
        if (!success)
            return NotFound(new { message = "Operator not found." });

        return Ok(new { message = "Operator status toggled successfully." });
    }

    // ─── Bookings ────────────────────────────────────────────────────────────────

    /// <summary>GET api/admin/bookings</summary>
    [HttpGet("bookings")]
    public async Task<IActionResult> GetBookings()
    {
        var result = await _adminService.GetAllBookingsAsync();
        return Ok(result);
    }

    // ─── Coupons ─────────────────────────────────────────────────────────────────

    /// <summary>GET api/admin/coupons</summary>
    [HttpGet("coupons")]
    public async Task<IActionResult> GetCoupons()
    {
        var result = await _adminService.GetCouponsAsync();
        return Ok(result);
    }

    /// <summary>POST api/admin/coupons</summary>
    [HttpPost("coupons")]
    public async Task<IActionResult> CreateCoupon([FromBody] CreateCouponRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _adminService.CreateCouponAsync(request);
        return StatusCode(201, result);
    }
}
