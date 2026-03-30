import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { NotificationDto } from '../../../core/models/models';

@Component({
  selector: 'app-notification-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule, RouterModule],
  template: `
    <div class="notif-dialog">
      <div class="notif-dialog-header" [style.background]="getHeaderColor()">
        <mat-icon class="notif-dialog-icon">{{getIcon()}}</mat-icon>
        <h2 class="notif-dialog-title">{{data.title}}</h2>
      </div>
      <mat-dialog-content>
        <p class="notif-message">{{data.message}}</p>
        <mat-divider></mat-divider>
        <div class="notif-meta">
          <span class="notif-type-badge" [style.background]="getHeaderColor()">{{data.type}}</span>
          <span class="notif-date">
            <mat-icon style="font-size:14px;width:14px;height:14px;vertical-align:middle;">schedule</mat-icon>
            {{data.createdAt | date:'MMM d, yyyy · h:mm a'}}
          </span>
        </div>
        <div *ngIf="data.bookingId" class="notif-booking-link">
          <mat-icon>receipt_long</mat-icon>
          <div>
            <p>This notification is linked to a booking.</p>
            <a mat-stroked-button color="primary" routerLink="/dashboard" (click)="close()">
              View My Bookings
            </a>
          </div>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-flat-button color="primary" (click)="close()">Close</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .notif-dialog-header {
      padding: 20px 24px;
      display: flex;
      align-items: center;
      gap: 14px;
      border-radius: 4px 4px 0 0;
      margin: -24px -24px 0;
    }
    .notif-dialog-title { margin: 0; color: white; font-size: 18px; font-weight: 700; font-family: 'Montserrat', sans-serif; }
    .notif-dialog-icon { color: white; font-size: 30px; width: 30px; height: 30px; }
    .notif-message { font-size: 15px; color: #333; line-height: 1.7; margin: 20px 0 16px; }
    .notif-meta { display: flex; align-items: center; gap: 14px; margin: 16px 0; flex-wrap: wrap; }
    .notif-type-badge {
      color: white; padding: 4px 12px; border-radius: 12px;
      font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;
    }
    .notif-date { font-size: 13px; color: #888; display: flex; align-items: center; gap: 4px; }
    .notif-booking-link {
      display: flex; gap: 14px; align-items: flex-start;
      background: #f5f7ff; border-radius: 10px; padding: 16px;
      margin-top: 12px; border: 1px solid #e0e7ff;
    }
    .notif-booking-link mat-icon { color: #3f51b5; margin-top: 2px; }
    .notif-booking-link p { margin: 0 0 10px; color: #555; font-size: 13px; }
  `]
})
export class NotificationDetailDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: NotificationDto,
    private dialogRef: MatDialogRef<NotificationDetailDialogComponent>
  ) {}

  close() { this.dialogRef.close(); }

  getIcon(): string {
    switch (this.data.type) {
      case 'BookingConfirmed': return 'check_circle';
      case 'BookingRejected': return 'cancel';
      case 'PaymentUpdate': return 'payment';
      case 'BookingUpdate': return 'info';
      case 'NewEmptyLeg': return 'flight_takeoff';
      case 'SystemAlert': return 'campaign';
      default: return 'notifications';
    }
  }

  getHeaderColor(): string {
    switch (this.data.type) {
      case 'BookingConfirmed': return '#2e7d32';
      case 'BookingRejected': return '#c62828';
      case 'PaymentUpdate': return '#1565c0';
      case 'BookingUpdate': return '#1565c0';
      case 'NewEmptyLeg': return '#e65100';
      case 'SystemAlert': return '#4527a0';
      default: return '#455a64';
    }
  }
}
