import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserProfileDto, CreditSummaryDto, ReferralSummaryDto, SavedSearchDto, NotificationDto, JetSubscriptionDto } from '../models/models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/user`;

  getProfile(): Observable<UserProfileDto> {
    return this.http.get<UserProfileDto>(`${this.base}/profile`);
  }

  getCredits(): Observable<CreditSummaryDto> {
    return this.http.get<CreditSummaryDto>(`${this.base}/credits`);
  }

  getReferrals(): Observable<ReferralSummaryDto> {
    return this.http.get<ReferralSummaryDto>(`${this.base}/referrals`);
  }

  getSavedSearches(): Observable<SavedSearchDto[]> {
    return this.http.get<SavedSearchDto[]>(`${this.base}/saved-searches`);
  }

  addSavedSearch(origin: string, destination: string, alertType: string): Observable<SavedSearchDto> {
    return this.http.post<SavedSearchDto>(`${this.base}/saved-searches`, { origin, destination, alertType });
  }

  deleteSavedSearch(id: number): Observable<any> {
    return this.http.delete(`${this.base}/saved-searches/${id}`);
  }

  getNotifications(): Observable<NotificationDto[]> {
    return this.http.get<NotificationDto[]>(`${this.base}/notifications`);
  }

  markAllRead(): Observable<any> {
    return this.http.post(`${this.base}/notifications/mark-all-read`, {});
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.base}/notifications/unread-count`);
  }

  clearAllNotifications(): Observable<any> {
    return this.http.delete(`${this.base}/notifications`);
  }

  getJetSubscriptions(): Observable<JetSubscriptionDto[]> {
    return this.http.get<JetSubscriptionDto[]>(`${this.base}/jet-subscriptions`);
  }

  subscribeToJet(jetId: number): Observable<JetSubscriptionDto> {
    return this.http.post<JetSubscriptionDto>(`${this.base}/jet-subscriptions/${jetId}`, {});
  }

  unsubscribeFromJet(jetId: number): Observable<any> {
    return this.http.delete(`${this.base}/jet-subscriptions/${jetId}`);
  }

  getJetSubscriptionStatus(jetId: number): Observable<{ isSubscribed: boolean }> {
    return this.http.get<{ isSubscribed: boolean }>(`${this.base}/jet-subscriptions/${jetId}/status`);
  }
}
