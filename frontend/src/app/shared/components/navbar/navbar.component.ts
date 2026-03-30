import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { NotificationDto, AuthResponse } from '../../../core/models/models';
import { filter, Subscription } from 'rxjs';
import { NotificationDetailDialogComponent } from '../notification-detail-dialog/notification-detail-dialog.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatToolbarModule, MatButtonModule, MatIconModule,
    MatMenuModule, MatBadgeModule, MatDividerModule,
    MatDialogModule, MatSnackBarModule
  ],
  template: `
    <mat-toolbar class="navbar">
      <div class="page-container nav-inner">
        <!-- JetFlux Logo -->
        <a routerLink="/" class="logo">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="18" cy="18" r="18" fill="#FFB800"/>
            <path d="M9 23 L15 9 L20 16 L27 11 L23 27 L17 20 Z" fill="#0A0F2E"/>
          </svg>
          <span class="logo-text">Jet<span class="logo-accent">Flux</span></span>
        </a>

        <div class="nav-links">
          <a routerLink="/flights" mat-button class="nav-link">
            <mat-icon>flight</mat-icon> Flights
          </a>
        </div>

        <div class="nav-actions">
          <ng-container *ngIf="isLoggedIn; else guestMenu">
            <!-- Bell Notifications -->
            <button mat-icon-button [matMenuTriggerFor]="notifMenu" class="notif-btn" title="Notifications">
              <mat-icon
                [matBadge]="unreadCount > 0 ? unreadCount.toString() : null"
                matBadgeColor="warn"
                matBadgeSize="small">notifications</mat-icon>
            </button>

            <mat-menu #notifMenu="matMenu" class="notif-menu" xPosition="before">
              <div class="notif-header" (click)="$event.stopPropagation()">
                <span class="notif-header-title">Notifications</span>
                <div class="notif-header-actions">
                  <button mat-button color="primary" class="notif-action-btn"
                          (click)="markAllRead(); $event.stopPropagation()"
                          [disabled]="unreadCount === 0">
                    <mat-icon>done_all</mat-icon> Mark read
                  </button>
                  <button mat-button color="warn" class="notif-action-btn"
                          (click)="clearAll(); $event.stopPropagation()"
                          [disabled]="notifications.length === 0">
                    <mat-icon>delete_sweep</mat-icon> Clear
                  </button>
                </div>
              </div>
              <mat-divider></mat-divider>

              <div *ngIf="notifications.length === 0" class="notif-empty">
                <mat-icon>notifications_none</mat-icon>
                <p>No notifications</p>
              </div>

              <div *ngFor="let n of notifications.slice(0,5)"
                   class="notif-item"
                   [class.unread]="!n.isRead"
                   (click)="openNotifDetail(n); $event.stopPropagation()">
                <div class="notif-item-icon" [style.color]="getNotifColor(n.type)">
                  <mat-icon>{{getNotifIcon(n.type)}}</mat-icon>
                </div>
                <div class="notif-item-content">
                  <div class="notif-item-title">{{n.title}}</div>
                  <div class="notif-item-msg">{{n.message}}</div>
                  <div class="notif-item-time">{{n.createdAt | date:'MMM d · h:mm a'}}</div>
                </div>
                <mat-icon class="notif-item-arrow">chevron_right</mat-icon>
              </div>
            </mat-menu>

            <!-- User Menu -->
            <button mat-button [matMenuTriggerFor]="userMenu" class="user-btn">
              <mat-icon>account_circle</mat-icon>
              <span class="user-name">{{getDisplayName()}}</span>
            </button>
            <mat-menu #userMenu="matMenu">
              <a routerLink="/dashboard" mat-menu-item>
                <mat-icon>dashboard</mat-icon><span>Dashboard</span>
              </a>
              <a *ngIf="isOperator" routerLink="/operator" mat-menu-item>
                <mat-icon>business</mat-icon><span>Operator Panel</span>
              </a>
              <a *ngIf="isAdmin" routerLink="/admin" mat-menu-item>
                <mat-icon>admin_panel_settings</mat-icon><span>Admin Panel</span>
              </a>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="logout()">
                <mat-icon>logout</mat-icon><span>Logout</span>
              </button>
            </mat-menu>
          </ng-container>

          <ng-template #guestMenu>
            <a routerLink="/login" mat-button class="guest-link">Login</a>
            <a routerLink="/register" mat-raised-button color="accent" class="register-btn">
              Get Started
            </a>
          </ng-template>
        </div>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .navbar {
      background: #0A0F2E;
      color: white;
      position: sticky;
      top: 0;
      z-index: 1000;
      padding: 0;
      box-shadow: 0 2px 16px rgba(0,0,0,0.5);
      border-bottom: 1px solid rgba(255,184,0,0.15);
    }
    .nav-inner { display: flex; align-items: center; width: 100%; gap: 0; }

    /* Logo */
    .logo { display: flex; align-items: center; gap: 10px; text-decoration: none; color: white; flex-shrink: 0; }
    .logo-text {
      font-family: 'Montserrat', sans-serif;
      font-size: 22px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: white;
    }
    .logo-accent { color: #FFB800; }

    /* Nav Links */
    .nav-links { flex: 1; margin-left: 28px; }
    .nav-link { color: rgba(255,255,255,0.75) !important; font-weight: 500; letter-spacing: 0.3px; }
    .nav-link:hover { color: #FFB800 !important; }
    .nav-link mat-icon { font-size: 18px; width: 18px; height: 18px; margin-right: 4px; vertical-align: middle; }

    /* Actions */
    .nav-actions { display: flex; align-items: center; gap: 4px; }
    .nav-actions a, .nav-actions button { color: white; }
    .notif-btn mat-icon { color: rgba(255,255,255,0.85); }
    .user-btn { display: flex; align-items: center; gap: 6px; }
    .user-name { font-weight: 600; font-size: 14px; }
    .guest-link { color: rgba(255,255,255,0.8) !important; }
    .register-btn { background: #FFB800 !important; color: #0A0F2E !important; font-weight: 700 !important; border-radius: 6px !important; }

    /* Notification Dropdown */
    .notif-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 8px 10px 16px;
      min-width: 340px;
      border-bottom: none;
    }
    .notif-header-title { font-weight: 700; font-size: 14px; color: #111; }
    .notif-header-actions { display: flex; gap: 0; }
    .notif-action-btn { font-size: 12px !important; min-width: 0 !important; padding: 0 8px !important; }
    .notif-action-btn mat-icon { font-size: 14px; width: 14px; height: 14px; margin-right: 2px; }

    .notif-empty {
      padding: 28px 16px;
      text-align: center;
      color: #aaa;
    }
    .notif-empty mat-icon { font-size: 36px; width: 36px; height: 36px; display: block; margin: 0 auto 8px; }
    .notif-empty p { margin: 0; font-size: 13px; }

    .notif-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px 10px 16px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background .15s;
    }
    .notif-item:last-child { border-bottom: none; }
    .notif-item:hover { background: #f8f9ff; }
    .notif-item.unread { background: #eef2ff; border-left: 3px solid #3f51b5; padding-left: 13px; }
    .notif-item-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .notif-item-content { flex: 1; min-width: 0; }
    .notif-item-title { font-weight: 700; font-size: 13px; color: #111; }
    .notif-item-msg { font-size: 12px; color: #555; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 230px; }
    .notif-item-time { font-size: 11px; color: #aaa; margin-top: 3px; }
    .notif-item-arrow { font-size: 16px; width: 16px; height: 16px; color: #ccc; }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private userService = inject(UserService);
  private signalR = inject(SignalRService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  currentUser: AuthResponse | null = null;
  isLoggedIn = false;
  isOperator = false;
  isAdmin = false;
  notifications: NotificationDto[] = [];
  unreadCount = 0;

  private routerSub?: Subscription;
  private signalRConnected = false;

  ngOnInit(): void {
    this.refreshAuth();
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.refreshAuth());
  }

  refreshAuth(): void {
    this.isLoggedIn = this.auth.isLoggedIn();
    this.currentUser = this.auth.getCurrentUser();
    this.isOperator = this.auth.isOperator();
    this.isAdmin = this.auth.isAdmin();

    if (this.isLoggedIn) {
      this.loadNotifications();
      if (!this.signalRConnected && !this.signalR.isConnected) {
        const token = this.auth.getToken();
        if (token) {
          this.signalRConnected = true;
          this.signalR.connect(token)
            .then(() => {
              if (this.currentUser?.userId) {
                this.signalR.joinUserGroup(String(this.currentUser.userId));
              }
              this.signalR.onNewNotification((notif: NotificationDto) => {
                this.notifications = [notif, ...this.notifications].slice(0, 5);
                this.unreadCount++;
              });
            })
            .catch(() => { this.signalRConnected = false; });
        }
      }
    }
  }

  loadNotifications(): void {
    this.userService.getNotifications().subscribe({
      next: notifs => {
        this.notifications = notifs.slice(0, 5);
        this.unreadCount = notifs.filter(n => !n.isRead).length;
      },
      error: () => {}
    });
  }

  markAllRead(): void {
    this.userService.markAllRead().subscribe(() => {
      this.unreadCount = 0;
      this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
    });
  }

  clearAll(): void {
    this.userService.clearAllNotifications().subscribe(() => {
      this.notifications = [];
      this.unreadCount = 0;
      this.snackBar.open('All notifications cleared', '', { duration: 2500, panelClass: 'snack-dark' });
    });
  }

  openNotifDetail(n: NotificationDto): void {
    // Mark as read locally
    this.notifications = this.notifications.map(x => x.id === n.id ? { ...x, isRead: true } : x);
    this.unreadCount = this.notifications.filter(x => !x.isRead).length;
    this.dialog.open(NotificationDetailDialogComponent, {
      data: n,
      width: '480px',
      maxWidth: '95vw'
    });
  }

  getNotifIcon(type: string): string {
    switch (type) {
      case 'BookingConfirmed': return 'check_circle';
      case 'BookingRejected': return 'cancel';
      case 'PaymentUpdate': case 'BookingUpdate': return 'payment';
      case 'NewEmptyLeg': return 'flight_takeoff';
      case 'SystemAlert': return 'campaign';
      default: return 'circle_notifications';
    }
  }

  getNotifColor(type: string): string {
    switch (type) {
      case 'BookingConfirmed': return '#2e7d32';
      case 'BookingRejected': return '#c62828';
      case 'PaymentUpdate': case 'BookingUpdate': return '#1565c0';
      case 'NewEmptyLeg': return '#e65100';
      default: return '#757575';
    }
  }

  getDisplayName(): string {
    if (!this.currentUser) return '';
    const name = this.currentUser.fullName;
    return name ? name.split(' ')[0] : (this.currentUser.email || '');
  }

  logout(): void {
    this.signalRConnected = false;
    this.signalR.disconnect();
    this.auth.logout();
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.signalR.disconnect();
  }
}
