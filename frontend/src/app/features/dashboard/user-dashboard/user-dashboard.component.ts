import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FlightService } from '../../../core/services/flight.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  BookingDto, EmptyLegDto, UserProfileDto, CreditSummaryDto,
  ReferralSummaryDto, SavedSearchDto, NotificationDto, JetSubscriptionDto
} from '../../../core/models/models';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatSidenavModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatTabsModule, MatChipsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatBadgeModule, MatDividerModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="dashboard-layout">
      <!-- Sidebar -->
      <div class="sidebar">
        <div class="sidebar-header">
          <h3>{{profile?.firstName}} {{profile?.lastName}}</h3>
          <p>{{profile?.email}}</p>
        </div>
        <div class="sidebar-item" *ngFor="let item of navItems" (click)="activeSection = item.key" [class.active]="activeSection === item.key">
          <mat-icon [matBadge]="item.key === 'notifications' && unreadCount > 0 ? unreadCount : null" matBadgeColor="warn" matBadgeSize="small">{{item.icon}}</mat-icon>
          {{item.label}}
        </div>
      </div>

      <!-- Content -->
      <div class="sidebar-content">

        <!-- OVERVIEW -->
        <div *ngIf="activeSection === 'overview'">
          <h2 class="page-title">Dashboard Overview</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <mat-icon class="stat-icon">flight</mat-icon>
              <div class="stat-value">{{bookings.length}}</div>
              <div class="stat-label">Total Bookings</div>
            </div>
            <div class="stat-card">
              <mat-icon class="stat-icon">account_balance_wallet</mat-icon>
              <div class="stat-value">\${{profile?.credits | number:'1.0-0'}}</div>
              <div class="stat-label">Credits Balance</div>
            </div>
            <div class="stat-card">
              <mat-icon class="stat-icon">pending_actions</mat-icon>
              <div class="stat-value">{{activeBookings.length}}</div>
              <div class="stat-label">Active Bookings</div>
            </div>
            <div class="stat-card">
              <mat-icon class="stat-icon">notifications</mat-icon>
              <div class="stat-value">{{unreadCount}}</div>
              <div class="stat-label">Unread Notifications</div>
            </div>
          </div>
        </div>

        <!-- MY BOOKINGS -->
        <div *ngIf="activeSection === 'bookings'">
          <h2 class="page-title">My Bookings</h2>
          <div *ngIf="isLoadingBookings" class="loading-spinner"><mat-spinner diameter="40"></mat-spinner></div>
          <mat-tab-group *ngIf="!isLoadingBookings">
            <mat-tab label="Active">
              <div class="mat-table-container">
                <table mat-table [dataSource]="activeBookings">
                  <ng-container matColumnDef="ref"><th mat-header-cell *matHeaderCellDef>Ref</th><td mat-cell *matCellDef="let b"><strong>{{b.bookingRef}}</strong></td></ng-container>
                  <ng-container matColumnDef="route"><th mat-header-cell *matHeaderCellDef>Route</th><td mat-cell *matCellDef="let b">{{b.origin}} → {{b.destination}}</td></ng-container>
                  <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let b">{{b.departureUtc | date:'MMM d, y'}}</td></ng-container>
                  <ng-container matColumnDef="aircraft"><th mat-header-cell *matHeaderCellDef>Aircraft</th><td mat-cell *matCellDef="let b">{{b.jetModel}}</td></ng-container>
                  <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let b"><span class="status-badge" [ngClass]="'status-' + b.status.toLowerCase()">{{b.status}}</span></td></ng-container>
                  <ng-container matColumnDef="amount"><th mat-header-cell *matHeaderCellDef>Amount</th><td mat-cell *matCellDef="let b">\${{b.totalAmount | number:'1.0-0'}}</td></ng-container>
                  <ng-container matColumnDef="detail"><th mat-header-cell *matHeaderCellDef></th><td mat-cell *matCellDef="let b"><button mat-icon-button color="primary" (click)="viewBooking(b)" title="View Details"><mat-icon>visibility</mat-icon></button></td></ng-container>
                  <tr mat-header-row *matHeaderRowDef="bookingColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: bookingColumns;"></tr>
                </table>
              </div>
            </mat-tab>
            <mat-tab label="All Bookings">
              <div class="mat-table-container">
                <table mat-table [dataSource]="bookings">
                  <ng-container matColumnDef="ref"><th mat-header-cell *matHeaderCellDef>Ref</th><td mat-cell *matCellDef="let b"><strong>{{b.bookingRef}}</strong></td></ng-container>
                  <ng-container matColumnDef="route"><th mat-header-cell *matHeaderCellDef>Route</th><td mat-cell *matCellDef="let b">{{b.origin}} → {{b.destination}}</td></ng-container>
                  <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let b">{{b.departureUtc | date:'MMM d, y'}}</td></ng-container>
                  <ng-container matColumnDef="aircraft"><th mat-header-cell *matHeaderCellDef>Aircraft</th><td mat-cell *matCellDef="let b">{{b.jetModel}}</td></ng-container>
                  <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let b"><span class="status-badge" [ngClass]="'status-' + b.status.toLowerCase()">{{b.status}}</span></td></ng-container>
                  <ng-container matColumnDef="amount"><th mat-header-cell *matHeaderCellDef>Amount</th><td mat-cell *matCellDef="let b">\${{b.totalAmount | number:'1.0-0'}}</td></ng-container>
                  <ng-container matColumnDef="detail"><th mat-header-cell *matHeaderCellDef></th><td mat-cell *matCellDef="let b"><button mat-icon-button color="primary" (click)="viewBooking(b)" title="View Details"><mat-icon>visibility</mat-icon></button></td></ng-container>
                  <tr mat-header-row *matHeaderRowDef="bookingColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: bookingColumns;"></tr>
                </table>
              </div>
            </mat-tab>
          </mat-tab-group>

          <!-- Booking Detail Panel -->
          <div *ngIf="selectedBooking" class="booking-detail-panel" style="margin-top:16px;background:white;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.1);padding:24px;border-left:4px solid #1B2A5C">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
              <h3 style="font-size:16px;font-weight:700;color:#1B2A5C">Booking — {{selectedBooking.bookingRef}}</h3>
              <button mat-icon-button (click)="selectedBooking = null"><mat-icon>close</mat-icon></button>
            </div>
            <div style="display:grid;gap:8px">
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px"><span style="font-weight:600;color:#555">Route</span><span>{{selectedBooking.origin}} → {{selectedBooking.destination}}</span></div>
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px"><span style="font-weight:600;color:#555">Aircraft</span><span>{{selectedBooking.jetModel}}</span></div>
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px"><span style="font-weight:600;color:#555">Departure</span><span>{{selectedBooking.departureUtc | date:'MMM d, y, h:mm a'}}</span></div>
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px"><span style="font-weight:600;color:#555">Operator</span><span>{{selectedBooking.operatorName}}</span></div>
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px"><span style="font-weight:600;color:#555">Status</span><span class="status-badge" [ngClass]="'status-' + selectedBooking.status.toLowerCase()">{{selectedBooking.status}}</span></div>
              <div *ngIf="selectedBooking.discountAmount > 0" style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#2e7d32"><span style="font-weight:600">Discount</span><span>-\${{selectedBooking.discountAmount | number:'1.0-0'}}</span></div>
              <div style="display:flex;justify-content:space-between;padding:12px 0;font-size:16px;font-weight:700;color:#1B2A5C;border-top:2px solid #e0e0e0"><span>Total Paid</span><span>\${{selectedBooking.totalAmount | number:'1.0-0'}}</span></div>
            </div>
            <div *ngIf="selectedBooking.passengers?.length" style="margin-top:16px">
              <h4 style="color:#1B2A5C;margin-bottom:8px;font-size:14px;font-weight:600">Passengers ({{selectedBooking.passengerCount}})</h4>
              <div *ngFor="let p of selectedBooking.passengers; let i = index" style="padding:8px 12px;background:#f5f7fa;border-radius:8px;margin-bottom:6px;font-size:13px">
                <strong>{{i+1}}. {{p.firstName}} {{p.lastName}}</strong> &nbsp;|&nbsp; Passport: {{p.passportNumber}} &nbsp;|&nbsp; {{p.nationality}}
              </div>
            </div>
          </div>
        </div>

        <!-- FAVORITES -->
        <div *ngIf="activeSection === 'favorites'">
          <h2 class="page-title">Favorite Flights</h2>
          <div *ngIf="isLoadingFavs" class="loading-spinner"><mat-spinner diameter="40"></mat-spinner></div>
          <div *ngIf="!isLoadingFavs && favorites.length === 0" class="empty-state">
            <mat-icon>favorite_border</mat-icon>
            <p>No favorites yet. Browse flights and heart the ones you like!</p>
            <button mat-raised-button color="primary" routerLink="/flights">Browse Flights</button>
          </div>
          <div class="flight-grid" *ngIf="!isLoadingFavs && favorites.length > 0">
            <mat-card *ngFor="let f of favorites" class="fav-card">
              <mat-card-content>
                <div class="fav-route">{{f.originCode}} → {{f.destinationCode}}</div>
                <div class="fav-cities">{{f.origin}} → {{f.destination}}</div>
                <div class="fav-meta">{{f.departureUtc | date:'MMM d, y'}} • \${{f.price | number:'1.0-0'}}</div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-button color="warn" (click)="removeFav(f)"><mat-icon>favorite</mat-icon> Remove</button>
                <button mat-raised-button color="primary" [routerLink]="['/flights', f.id]">View</button>
              </mat-card-actions>
            </mat-card>
          </div>
        </div>

        <!-- SAVED SEARCHES -->
        <div *ngIf="activeSection === 'saved-searches'">
          <h2 class="page-title">Saved Searches & Alerts</h2>
          <div class="add-search-form">
            <mat-form-field appearance="outline"><mat-label>Origin</mat-label><input matInput [(ngModel)]="newSearch.origin"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Destination</mat-label><input matInput [(ngModel)]="newSearch.destination"></mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Alert Type</mat-label>
              <mat-select [(ngModel)]="newSearch.alertType">
                <mat-option value="Instant">Instant</mat-option>
                <mat-option value="Weekly">Weekly</mat-option>
              </mat-select>
            </mat-form-field>
            <button mat-raised-button color="primary" (click)="addSearch()"><mat-icon>add</mat-icon> Add Alert</button>
          </div>
          <div class="mat-table-container">
            <table mat-table [dataSource]="savedSearches">
              <ng-container matColumnDef="origin"><th mat-header-cell *matHeaderCellDef>Origin</th><td mat-cell *matCellDef="let s">{{s.origin}}</td></ng-container>
              <ng-container matColumnDef="destination"><th mat-header-cell *matHeaderCellDef>Destination</th><td mat-cell *matCellDef="let s">{{s.destination}}</td></ng-container>
              <ng-container matColumnDef="alert"><th mat-header-cell *matHeaderCellDef>Alert</th><td mat-cell *matCellDef="let s">{{s.alertType}}</td></ng-container>
              <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Created</th><td mat-cell *matCellDef="let s">{{s.createdAt | date:'MMM d'}}</td></ng-container>
              <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef></th><td mat-cell *matCellDef="let s"><button mat-icon-button color="warn" (click)="deleteSearch(s.id)"><mat-icon>delete</mat-icon></button></td></ng-container>
              <tr mat-header-row *matHeaderRowDef="searchColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: searchColumns;"></tr>
            </table>
          </div>
        </div>

        <!-- REFERRALS -->
        <div *ngIf="activeSection === 'referrals'">
          <h2 class="page-title">Referral Program</h2>
          <div *ngIf="referrals">
            <mat-card class="referral-code-card">
              <mat-card-content>
                <div class="ref-code-label">Your Referral Code</div>
                <div class="ref-code">{{referrals.myReferralCode}}</div>
                <button mat-raised-button color="accent" (click)="copyCode(referrals.myReferralCode)">
                  <mat-icon>content_copy</mat-icon> Copy Code
                </button>
              </mat-card-content>
            </mat-card>
            <div class="stats-grid" style="margin-top:20px">
              <div class="stat-card"><div class="stat-value">{{referrals.totalReferrals}}</div><div class="stat-label">Total Referrals</div></div>
              <div class="stat-card"><div class="stat-value">{{referrals.convertedReferrals}}</div><div class="stat-label">Converted</div></div>
              <div class="stat-card"><div class="stat-value">\${{referrals.creditsEarned | number:'1.0-0'}}</div><div class="stat-label">Credits Earned</div></div>
            </div>
            <div class="mat-table-container" style="margin-top:20px">
              <table mat-table [dataSource]="referrals.referrals">
                <ng-container matColumnDef="code"><th mat-header-cell *matHeaderCellDef>Code</th><td mat-cell *matCellDef="let r">{{r.referralCode}}</td></ng-container>
                <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let r"><span [class]="r.isConverted ? 'status-confirmed status-badge' : 'status-pending status-badge'">{{r.isConverted ? 'Converted' : 'Pending'}}</span></td></ng-container>
                <ng-container matColumnDef="credits"><th mat-header-cell *matHeaderCellDef>Credits</th><td mat-cell *matCellDef="let r">\${{r.creditsAwarded | number:'1.0-0'}}</td></ng-container>
                <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let r">{{r.createdAt | date:'MMM d, y'}}</td></ng-container>
                <tr mat-header-row *matHeaderRowDef="referralColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: referralColumns;"></tr>
              </table>
            </div>
          </div>
        </div>

        <!-- CREDITS -->
        <div *ngIf="activeSection === 'credits'">
          <h2 class="page-title">My Credits</h2>
          <div *ngIf="credits">
            <mat-card class="credit-balance-card">
              <mat-card-content>
                <div class="balance-label">Available Balance</div>
                <div class="balance-amount">\${{credits.totalCredits | number:'1.0-0'}}</div>
                <div class="balance-hint">Earn credits by referring friends or completing bookings</div>
              </mat-card-content>
            </mat-card>
            <h3 style="margin: 20px 0 12px; color: #1B2A5C">Transaction History</h3>
            <div class="mat-table-container">
              <table mat-table [dataSource]="credits.transactions">
                <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let t">{{t.createdAt | date:'MMM d, y'}}</td></ng-container>
                <ng-container matColumnDef="desc"><th mat-header-cell *matHeaderCellDef>Description</th><td mat-cell *matCellDef="let t">{{t.description}}</td></ng-container>
                <ng-container matColumnDef="type"><th mat-header-cell *matHeaderCellDef>Type</th><td mat-cell *matCellDef="let t"><span class="status-badge" [ngClass]="t.transactionType === 'Credit' ? 'status-confirmed' : 'status-blocked'">{{t.transactionType}}</span></td></ng-container>
                <ng-container matColumnDef="amount"><th mat-header-cell *matHeaderCellDef>Amount</th><td mat-cell *matCellDef="let t" [class.credit-pos]="t.amount > 0" [class.credit-neg]="t.amount < 0">{{t.amount > 0 ? '+' : ''}}\${{t.amount | number:'1.0-0'}}</td></ng-container>
                <ng-container matColumnDef="balance"><th mat-header-cell *matHeaderCellDef>Balance</th><td mat-cell *matCellDef="let t">\${{t.balanceAfter | number:'1.0-0'}}</td></ng-container>
                <tr mat-header-row *matHeaderRowDef="creditColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: creditColumns;"></tr>
              </table>
            </div>
          </div>
        </div>

        <!-- SUBSCRIPTIONS -->
        <div *ngIf="activeSection === 'subscriptions'">
          <h2 class="page-title">Jet Subscriptions</h2>
          <p style="color:#666;margin-bottom:20px;font-size:14px;">Get email alerts when new empty legs are posted for jets you subscribe to.</p>
          <div *ngIf="jetSubscriptions.length === 0" class="empty-state">
            <mat-icon>notifications_none</mat-icon>
            <p>No jet subscriptions yet. Browse flights and subscribe to jets you like.</p>
            <button mat-raised-button color="primary" routerLink="/flights">Browse Flights</button>
          </div>
          <div class="subs-grid">
            <mat-card *ngFor="let s of jetSubscriptions" class="sub-card">
              <div class="sub-img-wrap">
                <img *ngIf="s.mainImageUrl" [src]="s.mainImageUrl" [alt]="s.jetModel" class="sub-img" (error)="onImgError($event)">
                <div *ngIf="!s.mainImageUrl" class="sub-img-placeholder"><mat-icon>flight</mat-icon></div>
              </div>
              <mat-card-content style="padding:14px 16px 8px;">
                <div class="sub-model">{{s.manufacturer}} {{s.jetModel}}</div>
                <div class="sub-tail">{{s.tailNumber}}</div>
                <div class="sub-since">Subscribed {{s.createdAt | date:'MMM d, y'}}</div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-button color="warn" (click)="unsubscribeJet(s.jetId, s.id)">
                  <mat-icon>notifications_off</mat-icon> Unsubscribe
                </button>
                <button mat-button color="primary" [routerLink]="['/flights']">
                  <mat-icon>search</mat-icon> Find Flights
                </button>
              </mat-card-actions>
            </mat-card>
          </div>
        </div>

        <!-- NOTIFICATIONS -->
        <div *ngIf="activeSection === 'notifications'">
          <div class="section-header">
            <h2 class="page-title">Notifications</h2>
            <div style="display:flex;gap:8px;">
              <button mat-stroked-button (click)="markAllRead()"><mat-icon>done_all</mat-icon> Mark All Read</button>
              <button mat-stroked-button color="warn" (click)="clearAllNotifs()"><mat-icon>delete_sweep</mat-icon> Clear All</button>
            </div>
          </div>
          <div *ngIf="notifications.length === 0" class="empty-state">
            <mat-icon>notifications_none</mat-icon>
            <p>No notifications yet</p>
          </div>
          <div class="notif-list">
            <div *ngFor="let n of notifications" class="notif-row" [class.unread]="!n.isRead">
              <mat-icon [class.notif-booking]="n.type === 'BookingConfirmed' || n.type === 'BookingUpdate'"
                        [class.notif-payment]="n.type === 'PaymentUpdate'"
                        [class.notif-system]="n.type === 'SystemAlert'">
                {{n.type === 'BookingConfirmed' ? 'check_circle' : n.type === 'BookingRejected' ? 'cancel' : n.type === 'PaymentUpdate' ? 'payment' : n.type === 'NewEmptyLeg' ? 'flight_takeoff' : 'info'}}
              </mat-icon>
              <div class="notif-body">
                <div class="notif-title">{{n.title}}</div>
                <div class="notif-msg">{{n.message}}</div>
              </div>
              <div class="notif-time">{{getRelativeTime(n.createdAt)}}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); text-align: center; }
    .stat-value { font-size: 28px; font-weight: 700; color: #1B2A5C; }
    .stat-label { font-size: 13px; color: #666; margin-top: 4px; }
    .stat-icon { color: #1B2A5C; opacity: 0.2; font-size: 36px; width: 36px; height: 36px; display: block; margin: 0 auto 8px; }
    .mat-table-container { overflow-x: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-top: 16px; }
    table { width: 100%; }
    .fav-card { margin-bottom: 12px; border-radius: 8px !important; }
    .fav-route { font-size: 18px; font-weight: 700; color: #1B2A5C; }
    .fav-cities { font-size: 13px; color: #888; }
    .fav-meta { font-size: 13px; color: #444; margin-top: 4px; }
    .add-search-form { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 20px; background: white; padding: 16px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .referral-code-card { border-radius: 12px !important; background: linear-gradient(135deg, #1B2A5C, #2A3D75) !important; color: white !important; text-align: center; }
    .ref-code-label { font-size: 14px; opacity: 0.8; margin-bottom: 8px; }
    .ref-code { font-size: 32px; font-weight: 800; letter-spacing: 4px; margin-bottom: 16px; }
    .credit-balance-card { border-radius: 12px !important; background: linear-gradient(135deg, #1b5e20, #2e7d32) !important; color: white !important; text-align: center; padding: 8px; }
    .balance-label { font-size: 14px; opacity: 0.8; }
    .balance-amount { font-size: 48px; font-weight: 800; margin: 8px 0; }
    .balance-hint { font-size: 13px; opacity: 0.7; }
    .credit-pos { color: #2e7d32; font-weight: 600; }
    .credit-neg { color: #b71c1c; font-weight: 600; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .notif-list { display: flex; flex-direction: column; gap: 8px; }
    .notif-row { display: flex; align-items: flex-start; gap: 12px; background: white; border-radius: 8px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    .notif-row.unread { background: #e8eaf6; border-left: 3px solid #1B2A5C; }
    .notif-body { flex: 1; }
    .notif-title { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
    .notif-msg { font-size: 13px; color: #666; }
    .notif-time { font-size: 11px; color: #999; white-space: nowrap; }
    .notif-booking { color: #1B2A5C; }
    .notif-payment { color: #2e7d32; }
    .notif-system { color: #555; }
    .flight-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; }
    .page-title { font-size: 22px; font-weight: 700; color: #1B2A5C; margin-bottom: 20px; }
    .subs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
    .sub-card { border-radius: 12px !important; overflow: hidden; }
    .sub-img-wrap { height: 130px; overflow: hidden; background: linear-gradient(135deg, #1B2A5C, #1B2A5C); }
    .sub-img { width: 100%; height: 100%; object-fit: cover; }
    .sub-img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
    .sub-img-placeholder mat-icon { font-size: 48px; width: 48px; height: 48px; color: rgba(255,255,255,0.2); }
    .sub-model { font-size: 15px; font-weight: 700; color: #1B2A5C; }
    .sub-tail { font-size: 13px; color: #888; margin-top: 2px; }
    .sub-since { font-size: 12px; color: #aaa; margin-top: 6px; }
  `]
})
export class UserDashboardComponent implements OnInit {
  private flightService = inject(FlightService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  activeSection = 'overview';
  profile: UserProfileDto | null = null;
  bookings: BookingDto[] = [];
  favorites: EmptyLegDto[] = [];
  savedSearches: SavedSearchDto[] = [];
  referrals: ReferralSummaryDto | null = null;
  credits: CreditSummaryDto | null = null;
  notifications: NotificationDto[] = [];
  jetSubscriptions: JetSubscriptionDto[] = [];
  unreadCount = 0;
  isLoadingBookings = false;
  isLoadingFavs = false;

  newSearch = { origin: '', destination: '', alertType: 'Instant' };
  bookingColumns = ['ref', 'route', 'date', 'aircraft', 'status', 'amount', 'detail'];
  selectedBooking: BookingDto | null = null;
  searchColumns = ['origin', 'destination', 'alert', 'date', 'actions'];
  referralColumns = ['code', 'status', 'credits', 'date'];
  creditColumns = ['date', 'desc', 'type', 'amount', 'balance'];

  navItems = [
    { key: 'overview', icon: 'dashboard', label: 'Overview' },
    { key: 'bookings', icon: 'flight', label: 'My Bookings' },
    { key: 'favorites', icon: 'favorite', label: 'Favorites' },
    { key: 'subscriptions', icon: 'notifications_active', label: 'Subscriptions' },
    { key: 'saved-searches', icon: 'search', label: 'Saved Searches' },
    { key: 'referrals', icon: 'people', label: 'Referrals' },
    { key: 'credits', icon: 'account_balance_wallet', label: 'Credits' },
    { key: 'notifications', icon: 'notifications', label: 'Notifications' },
  ];

  get activeBookings(): BookingDto[] {
    return this.bookings.filter(b => b.status === 'Confirmed' || b.status === 'Pending');
  }

  ngOnInit(): void {
    this.loadProfile();
    this.loadBookings();
    this.loadNotifications();
    this.loadFavorites();
    this.loadReferrals();
    this.loadCredits();
    this.loadSavedSearches();
    this.loadJetSubscriptions();
  }

  viewBooking(b: BookingDto): void {
    this.selectedBooking = this.selectedBooking?.id === b.id ? null : b;
  }

  loadProfile(): void {
    this.userService.getProfile().subscribe({ next: p => this.profile = p, error: () => {} });
  }
  loadBookings(): void {
    this.isLoadingBookings = true;
    this.flightService.getUserBookings().subscribe({ next: b => { this.bookings = b; this.isLoadingBookings = false; }, error: () => { this.isLoadingBookings = false; } });
  }
  loadFavorites(): void {
    this.isLoadingFavs = true;
    this.flightService.getFavorites().subscribe({ next: f => { this.favorites = f; this.isLoadingFavs = false; }, error: () => { this.isLoadingFavs = false; } });
  }
  loadSavedSearches(): void {
    this.userService.getSavedSearches().subscribe({ next: s => this.savedSearches = s, error: () => {} });
  }
  loadReferrals(): void {
    this.userService.getReferrals().subscribe({ next: r => this.referrals = r, error: () => {} });
  }
  loadCredits(): void {
    this.userService.getCredits().subscribe({ next: c => this.credits = c, error: () => {} });
  }
  loadNotifications(): void {
    this.userService.getNotifications().subscribe({ next: n => { this.notifications = n; this.unreadCount = n.filter(x => !x.isRead).length; }, error: () => {} });
  }
  removeFav(f: EmptyLegDto): void {
    this.flightService.toggleFavorite(f.id).subscribe({ next: () => { this.favorites = this.favorites.filter(x => x.id !== f.id); } });
  }
  addSearch(): void {
    if (!this.newSearch.origin && !this.newSearch.destination) return;
    this.userService.addSavedSearch(this.newSearch.origin, this.newSearch.destination, this.newSearch.alertType).subscribe({ next: s => { this.savedSearches = [...this.savedSearches, s]; this.newSearch = { origin: '', destination: '', alertType: 'Instant' }; } });
  }
  deleteSearch(id: number): void {
    this.userService.deleteSavedSearch(id).subscribe({ next: () => { this.savedSearches = this.savedSearches.filter(s => s.id !== id); } });
  }
  copyCode(code: string): void {
    navigator.clipboard.writeText(code).then(() => { this.snackBar.open('Referral code copied!', 'Close', { duration: 3000 }); });
  }
  loadJetSubscriptions(): void {
    this.userService.getJetSubscriptions().subscribe({ next: s => this.jetSubscriptions = s, error: () => {} });
  }
  unsubscribeJet(jetId: number, subId: number): void {
    this.userService.unsubscribeFromJet(jetId).subscribe({
      next: () => {
        this.jetSubscriptions = this.jetSubscriptions.filter(s => s.id !== subId);
        this.snackBar.open('Unsubscribed from jet updates', 'Close', { duration: 3000 });
      }
    });
  }
  clearAllNotifs(): void {
    this.userService.clearAllNotifications().subscribe({
      next: () => {
        this.notifications = [];
        this.unreadCount = 0;
        this.snackBar.open('All notifications cleared', '', { duration: 2500 });
      }
    });
  }
  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
  markAllRead(): void {
    this.userService.markAllRead().subscribe({ next: () => { this.notifications.forEach(n => n.isRead = true); this.unreadCount = 0; } });
  }
  getRelativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `\${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `\${hrs}h ago`;
    return `\${Math.floor(hrs / 24)}d ago`;
  }
}
