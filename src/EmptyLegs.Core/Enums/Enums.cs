namespace EmptyLegs.Core.Enums;

public enum UserRole { User, OperatorAdmin, SuperAdmin }
public enum JetStatus { Active, Inactive, UnderMaintenance }
public enum EmptyLegStatus { Available, Blocked, Booked, Cancelled, Expired }
public enum BookingStatus { PendingConfirmation, Confirmed, PaymentPending, PaymentFailed, Cancelled, Completed, Rejected }
public enum PaymentStatus { Pending, Success, Failed, Refunded }
public enum NotificationType { BookingUpdate, PaymentUpdate, SystemAlert, NewEmptyLeg, BookingConfirmed, BookingRejected }
public enum AlertType { Weekly, Instant }
public enum DiscountType { Percentage, Fixed }
public enum CreditTransactionType { Earned, Redeemed, Refunded, Expired }
public enum JetCategory { VeryLight, Light, Midsize, SuperMidsize, Heavy, UltraLong }
public enum TripType { OneWay, RoundTrip }
public enum ConfirmationMode { Instant, ManualApproval }
