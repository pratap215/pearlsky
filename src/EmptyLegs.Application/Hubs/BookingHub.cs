using Microsoft.AspNetCore.SignalR;

namespace EmptyLegs.Application.Hubs;

/// <summary>
/// SignalR hub for real-time booking and empty leg updates.
/// Clients subscribe to events:
///   - "EmptyLegStatusChanged"  payload: { emptyLegId, status, seatsAvailable }
///   - "BookingStatusUpdated"   payload: { bookingId, bookingRef, status }
///   - "NewNotification"        payload: NotificationDto
///   - "LockExpired"            payload: { emptyLegId }
///   - "CountdownUpdate"        payload: { emptyLegId, secondsRemaining }
/// </summary>
public class BookingHub : Hub
{
    /// <summary>
    /// Called by a regular user to join their personal notification group.
    /// </summary>
    public async Task JoinUserGroup(string userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
    }

    /// <summary>
    /// Called by an operator admin to join their operator notification group.
    /// </summary>
    public async Task JoinOperatorGroup(string operatorId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"operator_{operatorId}");
    }

    /// <summary>
    /// Leave user group on disconnect (optional cleanup helper).
    /// </summary>
    public async Task LeaveUserGroup(string userId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
    }

    /// <summary>
    /// Leave operator group on disconnect (optional cleanup helper).
    /// </summary>
    public async Task LeaveOperatorGroup(string operatorId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"operator_{operatorId}");
    }
}
