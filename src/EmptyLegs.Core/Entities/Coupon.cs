using EmptyLegs.Core.Enums;

namespace EmptyLegs.Core.Entities;

public class Coupon
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DiscountType DiscountType { get; set; }
    public decimal DiscountValue { get; set; }
    public decimal? MinBookingAmount { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int MaxUses { get; set; }
    public int CurrentUses { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsValid => IsActive && CurrentUses < MaxUses && ExpiryDate > DateTime.UtcNow;
}
