import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OperatorDashboardDto, JetDto, CreateJetRequest, EmptyLegDto, CreateEmptyLegRequest, BookingDto } from '../models/models';

@Injectable({ providedIn: 'root' })
export class OperatorService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/operator`;

  getDashboard(): Observable<OperatorDashboardDto> {
    return this.http.get<OperatorDashboardDto>(`${this.base}/dashboard`);
  }

  getJets(): Observable<JetDto[]> {
    return this.http.get<JetDto[]>(`${this.base}/jets`);
  }

  createJet(req: CreateJetRequest): Observable<JetDto> {
    return this.http.post<JetDto>(`${this.base}/jets`, req);
  }

  updateJet(id: number, req: CreateJetRequest): Observable<JetDto> {
    return this.http.put<JetDto>(`${this.base}/jets/${id}`, req);
  }

  deleteJet(id: number): Observable<any> {
    return this.http.delete(`${this.base}/jets/${id}`);
  }

  getEmptyLegs(): Observable<EmptyLegDto[]> {
    return this.http.get<EmptyLegDto[]>(`${this.base}/emptylegs`);
  }

  createEmptyLeg(req: CreateEmptyLegRequest): Observable<EmptyLegDto> {
    return this.http.post<EmptyLegDto>(`${this.base}/emptylegs`, req);
  }

  deleteEmptyLeg(id: number): Observable<any> {
    return this.http.delete(`${this.base}/emptylegs/${id}`);
  }

  getBookings(): Observable<BookingDto[]> {
    return this.http.get<BookingDto[]>(`${this.base}/bookings`);
  }

  confirmBooking(id: number): Observable<BookingDto> {
    return this.http.post<BookingDto>(`${this.base}/bookings/${id}/confirm`, {});
  }

  rejectBooking(id: number, reason: string): Observable<BookingDto> {
    return this.http.post<BookingDto>(`${this.base}/bookings/${id}/reject`, { reason });
  }
}
