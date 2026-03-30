import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  EmptyLegDto, EmptyLegDetailDto, EmptyLegSearchRequest, PagedResult,
  BookingDto, CreateBookingRequest, BookingLockResponse, CouponValidationResponse
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class FlightService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/emptylegs`;

  search(params: EmptyLegSearchRequest): Observable<PagedResult<EmptyLegDto>> {
    let p = new HttpParams();
    if (params.origin) p = p.set('origin', params.origin);
    if (params.destination) p = p.set('destination', params.destination);
    if (params.dateFrom) p = p.set('dateFrom', params.dateFrom);
    if (params.dateTo) p = p.set('dateTo', params.dateTo);
    if (params.minSeats) p = p.set('minSeats', params.minSeats);
    if (params.minPrice) p = p.set('minPrice', params.minPrice);
    if (params.maxPrice) p = p.set('maxPrice', params.maxPrice);
    if (params.category) p = p.set('category', params.category);
    if (params.page) p = p.set('page', params.page);
    if (params.pageSize) p = p.set('pageSize', params.pageSize ?? 12);
    return this.http.get<PagedResult<EmptyLegDto>>(this.base, { params: p });
  }

  getDetail(id: number): Observable<EmptyLegDetailDto> {
    return this.http.get<EmptyLegDetailDto>(`${this.base}/${id}`);
  }

  initiateBooking(id: number, req: CreateBookingRequest): Observable<BookingLockResponse> {
    return this.http.post<BookingLockResponse>(`${this.base}/${id}/initiate`, req);
  }

  confirmPayment(bookingId: number, success: boolean, couponCode?: string, creditsToUse?: number): Observable<BookingDto> {
    return this.http.post<BookingDto>(`${this.base}/confirm-payment`, { bookingId, success, couponCode, creditsToUse: creditsToUse ?? 0 });
  }

  getUserBookings(): Observable<BookingDto[]> {
    return this.http.get<BookingDto[]>(`${environment.apiUrl}/emptylegs/bookings`);
  }

  toggleFavorite(id: number): Observable<any> {
    return this.http.post(`${this.base}/${id}/favorite`, {});
  }

  getFavorites(): Observable<EmptyLegDto[]> {
    return this.http.get<EmptyLegDto[]>(`${this.base}/favorites`);
  }

  getAirports(): Observable<{origins: any[], destinations: any[]}> {
    return this.http.get<{origins: any[], destinations: any[]}>(`${this.base}/airports`);
  }

  validateCoupon(code: string, amount: number): Observable<CouponValidationResponse> {
    return this.http.post<CouponValidationResponse>(`${this.base}/validate-coupon`, { code, amount });
  }
}
