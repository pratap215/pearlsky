import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminDashboardDto, OperatorListDto, BookingDto, CouponDto, CreateCouponRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin`;

  getDashboard(): Observable<AdminDashboardDto> {
    return this.http.get<AdminDashboardDto>(`${this.base}/dashboard`);
  }

  getOperators(): Observable<OperatorListDto[]> {
    return this.http.get<OperatorListDto[]>(`${this.base}/operators`);
  }

  toggleOperator(id: number): Observable<any> {
    return this.http.post(`${this.base}/operators/${id}/toggle`, {});
  }

  getAllBookings(): Observable<BookingDto[]> {
    return this.http.get<BookingDto[]>(`${this.base}/bookings`);
  }

  getCoupons(): Observable<CouponDto[]> {
    return this.http.get<CouponDto[]>(`${this.base}/coupons`);
  }

  createCoupon(req: CreateCouponRequest): Observable<CouponDto> {
    return this.http.post<CouponDto>(`${this.base}/coupons`, req);
  }
}
