import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { trigger, style, animate, transition } from '@angular/animations';
import { SignalRService } from '../../../core/services/signalr.service';
import { NotificationDto } from '../../../core/models/models';
import { NotificationDetailDialogComponent } from '../notification-detail-dialog/notification-detail-dialog.component';

interface ToastItem { id: number; notif: NotificationDto; timer?: ReturnType<typeof setTimeout>; }

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogModule],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(110%)', opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(110%)', opacity: 0 }))
      ])
    ])
  ],
  template: `
    <div class="toast-container">
      <div *ngFor="let t of toasts; trackBy: trackById"
           [@slideIn]
           class="toast-item"
           [class]="'toast-type-' + getTypeClass(t.notif.type)"
           (click)="openDetail(t)">
        <div class="toast-icon">
          <mat-icon>{{getIcon(t.notif.type)}}</mat-icon>
        </div>
        <div class="toast-body">
          <div class="toast-title">{{t.notif.title}}</div>
          <div class="toast-msg">{{t.notif.message}}</div>
          <div class="toast-hint">Click to view details</div>
        </div>
        <button mat-icon-button class="toast-close" (click)="dismiss(t, $event)" title="Dismiss">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column-reverse;
      gap: 10px;
      max-width: 360px;
      pointer-events: none;
    }
    .toast-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: #0D1340;
      color: white;
      border-radius: 12px;
      padding: 14px 10px 14px 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      cursor: pointer;
      border-left: 4px solid #C9A66B;
      pointer-events: all;
      transition: transform .15s ease, box-shadow .15s ease;
      min-width: 300px;
    }
    .toast-item:hover { transform: translateX(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.5); }
    .toast-type-confirmed { border-left-color: #4caf50; }
    .toast-type-rejected  { border-left-color: #ef5350; }
    .toast-type-payment   { border-left-color: #42a5f5; }
    .toast-type-flight    { border-left-color: #C9A66B; }
    .toast-type-default   { border-left-color: #90a4ae; }

    .toast-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      margin-top: 1px;
      color: #C9A66B;
    }
    .toast-type-confirmed .toast-icon mat-icon { color: #81c784; }
    .toast-type-rejected  .toast-icon mat-icon { color: #ef9a9a; }
    .toast-type-payment   .toast-icon mat-icon { color: #90caf9; }

    .toast-body { flex: 1; min-width: 0; }
    .toast-title { font-weight: 700; font-size: 13px; margin-bottom: 3px; font-family: 'Inter', sans-serif; }
    .toast-msg { font-size: 12px; color: rgba(255,255,255,0.7); line-height: 1.4; }
    .toast-hint { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 5px; font-style: italic; }
    .toast-close {
      color: rgba(255,255,255,0.4) !important;
      width: 32px !important;
      height: 32px !important;
      flex-shrink: 0;
      margin: -2px -4px 0 0;
    }
    .toast-close mat-icon { font-size: 18px !important; width: 18px !important; height: 18px !important; }
  `]
})
export class NotificationToastComponent implements OnInit, OnDestroy {
  private signalR = inject(SignalRService);
  private dialog = inject(MatDialog);

  toasts: ToastItem[] = [];
  private nextId = 0;

  ngOnInit(): void {
    this.signalR.onNewNotification((notif: NotificationDto) => {
      this.addToast(notif);
    });
  }

  addToast(notif: NotificationDto): void {
    const item: ToastItem = { id: this.nextId++, notif };
    this.toasts = [...this.toasts, item];
    // Auto-dismiss after 6 seconds
    item.timer = setTimeout(() => this.dismiss(item), 6000);
  }

  dismiss(t: ToastItem, event?: Event): void {
    event?.stopPropagation();
    if (t.timer) clearTimeout(t.timer);
    this.toasts = this.toasts.filter(x => x.id !== t.id);
  }

  openDetail(t: ToastItem): void {
    this.dismiss(t);
    this.dialog.open(NotificationDetailDialogComponent, {
      data: t.notif,
      width: '480px',
      panelClass: 'notif-detail-dialog'
    });
  }

  trackById(_: number, t: ToastItem) { return t.id; }

  getIcon(type: string): string {
    switch (type) {
      case 'BookingConfirmed': return 'check_circle';
      case 'BookingRejected': return 'cancel';
      case 'PaymentUpdate': return 'payment';
      case 'BookingUpdate': return 'info';
      case 'NewEmptyLeg': return 'flight_takeoff';
      case 'SystemAlert': return 'campaign';
      default: return 'notifications';
    }
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'BookingConfirmed': return 'confirmed';
      case 'BookingRejected': return 'rejected';
      case 'PaymentUpdate': case 'BookingUpdate': return 'payment';
      case 'NewEmptyLeg': return 'flight';
      default: return 'default';
    }
  }

  ngOnDestroy(): void {}
}
