// ── Auth ──────────────────────────────────────────────────────────────────────
export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { firstName: string; lastName: string; email: string; password: string; phone: string; referralCode?: string; }
export interface AuthResponse { token: string; email: string; fullName: string; role: string; userId: number; operatorId?: number; credits: number; }

// ── Empty Legs ────────────────────────────────────────────────────────────────
export interface EmptyLegDto {
  id: number; operatorId: number; operatorName: string; operatorLogo: string;
  jetId: number; jetModel: string; manufacturer: string; jetCategory: string;
  mainImageUrl: string; tailNumber: string; seatingCapacity: number;
  origin: string; originCode: string; destination: string; destinationCode: string;
  departureUtc: string; arrivalUtc: string; durationMinutes: number;
  availableSeats: number; price: number; taxAmount: number; totalPrice: number;
  status: string; secondsUntilUnlock?: number; isFavorite: boolean;
  hasWifi: boolean; hasCatering: boolean; hasBedroom: boolean; confirmationMode: string;
}
export interface EmptyLegDetailDto extends EmptyLegDto {
  description: string; rangeKm: number; speedKmh: number;
  yearOfManufacture: number; imageUrls: string[]; policies: PolicyDto[];
}
export interface EmptyLegSearchRequest {
  origin?: string; destination?: string; dateFrom?: string; dateTo?: string;
  minSeats?: number; minPrice?: number; maxPrice?: number; category?: string;
  page?: number; pageSize?: number;
}
export interface PagedResult<T> { items: T[]; totalCount: number; page: number; pageSize: number; totalPages: number; }
export interface PolicyDto { title: string; content: string; policyType: string; }

// ── Booking ───────────────────────────────────────────────────────────────────
export interface CreateBookingRequest {
  emptyLegId: number; passengerCount: number; passengers: PassengerDto[];
  couponCode?: string; referralCodeUsed?: string; creditsToUse: number;
  notes?: string; policyAcknowledged: boolean;
}
export interface PassengerDto { firstName: string; lastName: string; passportNumber: string; nationality: string; dateOfBirth: string; }
export interface BookingDto {
  id: number; bookingRef: string; emptyLegId: number;
  origin: string; destination: string; departureUtc: string;
  jetModel: string; mainImageUrl: string; operatorName: string;
  status: string; paymentStatus: string;
  baseAmount: number; taxAmount: number; discountAmount: number; creditsUsed: number; totalAmount: number;
  passengerCount: number; passengers: PassengerDto[]; createdAt: string;
  requiresOperatorConfirmation: boolean;
}
export interface BookingLockResponse {
  bookingId: number; bookingRef: string; lockDurationSeconds: number; lockedUntil: string;
  baseAmount: number; taxAmount: number; discountAmount: number; creditsUsed: number; totalAmount: number;
  requiresConfirmation: boolean;
}
export interface CouponValidationResponse { isValid: boolean; message: string; discountAmount: number; }

// ── Jets ──────────────────────────────────────────────────────────────────────
export interface JetDto {
  id: number; operatorId: number; operatorName: string; manufacturer: string; modelName: string;
  category: string; tailNumber: string; yearOfManufacture: number; seatingCapacity: number;
  rangeKm: number; speedKmh: number; description: string; mainImageUrl: string;
  interiorImageUrl: string; imageUrls: string[]; basePrice: number;
  status: string; confirmationMode: string; hasWifi: boolean; hasCatering: boolean; hasBedroom: boolean;
  totalEmptyLegs: number;
}
export interface CreateJetRequest {
  manufacturer: string; modelName: string; category: string; tailNumber: string;
  yearOfManufacture: number; seatingCapacity: number; rangeKm: number; speedKmh: number;
  description: string; basePrice: number; confirmationMode: string;
  hasWifi: boolean; hasCatering: boolean; hasBedroom: boolean;
}
export interface CreateEmptyLegRequest {
  jetId: number; origin: string; originCode: string; destination: string; destinationCode: string;
  departureUtc: string; arrivalUtc: string; availableSeats: number; price: number;
  lockDurationMinutes: number; notes?: string;
}

// ── User ──────────────────────────────────────────────────────────────────────
export interface UserProfileDto { id: number; email: string; firstName: string; lastName: string; phone: string; referralCode: string; credits: number; totalBookings: number; totalReferrals: number; }
export interface CreditSummaryDto { totalCredits: number; creditsEarned: number; creditsRedeemed: number; transactions: CreditTransactionDto[]; }
export interface CreditTransactionDto { id: number; amount: number; transactionType: string; description: string; balanceAfter: number; createdAt: string; }
export interface ReferralSummaryDto { myReferralCode: string; totalReferrals: number; convertedReferrals: number; creditsEarned: number; referrals: ReferralDto[]; }
export interface ReferralDto { id: number; referralCode: string; isConverted: boolean; creditsAwarded: number; createdAt: string; }
export interface SavedSearchDto { id: number; origin: string; destination: string; alertType: string; createdAt: string; }
export interface NotificationDto { id: number; title: string; message: string; type: string; isRead: boolean; bookingId?: number; createdAt: string; }

// ── Operator ──────────────────────────────────────────────────────────────────
export interface OperatorDashboardDto { totalJets: number; activeEmptyLegs: number; totalBookings: number; pendingConfirmations: number; totalRevenue: number; recentBookings: BookingDto[]; }

// ── Jet Subscriptions ─────────────────────────────────────────────────────────
export interface JetSubscriptionDto { id: number; jetId: number; jetModel: string; manufacturer: string; tailNumber: string; mainImageUrl: string; createdAt: string; }

// ── Config ────────────────────────────────────────────────────────────────────
export interface AppConfigDto { paymentMode: string; appName: string; appVersion: string; }

// ── Admin ─────────────────────────────────────────────────────────────────────
export interface AdminDashboardDto { totalOperators: number; totalJets: number; totalUsers: number; totalBookings: number; activeEmptyLegs: number; blockedEmptyLegs: number; totalRevenue: number; monthlyRevenue: number; recentBookings: BookingDto[]; }
export interface OperatorListDto { id: number; name: string; country: string; city: string; isActive: boolean; totalJets: number; totalBookings: number; revenue: number; }
export interface CouponDto { id: number; code: string; discountType: string; discountValue: number; expiryDate: string; maxUses: number; currentUses: number; isActive: boolean; }
export interface CreateCouponRequest { code: string; description: string; discountType: string; discountValue: number; minBookingAmount?: number; maxDiscountAmount?: number; expiryDate: string; maxUses: number; }
