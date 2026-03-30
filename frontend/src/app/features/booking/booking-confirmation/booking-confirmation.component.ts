import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { FlightService } from '../../../core/services/flight.service';
import { BookingDto } from '../../../core/models/models';

@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatProgressSpinnerModule, MatTableModule
  ],
  template: `
    <div class="conf-page">
      <div *ngIf="isLoading" class="loading-spinner"><mat-spinner diameter="48"></mat-spinner></div>

      <div *ngIf="!isLoading && booking" class="conf-container">
        <!-- Success Icon -->
        <div class="conf-header">
          <mat-icon class="success-icon">
            {{booking.requiresOperatorConfirmation ? 'pending' : 'check_circle'}}
          </mat-icon>
          <h1 [class.pending-title]="booking.requiresOperatorConfirmation">
            {{booking.requiresOperatorConfirmation ? 'Awaiting Operator Approval' : 'Booking Confirmed!'}}
          </h1>
          <div class="booking-ref">Booking Reference: <strong>{{booking.bookingRef}}</strong></div>
          <p class="conf-subtitle">
            {{booking.requiresOperatorConfirmation
              ? 'Your booking request has been submitted. The operator will confirm within 24 hours.'
              : 'Your private jet is booked! Get ready for an amazing experience.'}}
          </p>
        </div>

        <mat-card class="details-card">
          <mat-card-header><mat-card-title>Flight Details</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="detail-grid">
              <div class="detail-row">
                <span class="detail-label">Route</span>
                <span class="detail-val"><strong>{{booking.origin}} → {{booking.destination}}</strong></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Departure</span>
                <span class="detail-val">{{booking.departureUtc | date:'EEEE, MMMM d, y h:mm a'}}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Aircraft</span>
                <span class="detail-val">{{booking.jetModel}}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Operator</span>
                <span class="detail-val">{{booking.operatorName}}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Passengers</span>
                <span class="detail-val">{{booking.passengerCount}}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status</span>
                <span class="detail-val">
                  <span class="status-badge" [ngClass]="'status-' + booking.status.toLowerCase()">{{booking.status}}</span>
                </span>
              </div>
            </div>
            <mat-divider style="margin: 16px 0"></mat-divider>
            <h4 style="margin-bottom:12px;color:#1a237e">Payment Summary</h4>
            <div class="detail-grid">
              <div class="detail-row"><span class="detail-label">Base Amount</span><span>₹{{booking.baseAmount | number:'1.0-0'}}</span></div>
              <div class="detail-row"><span class="detail-label">GST</span><span>₹{{booking.taxAmount | number:'1.0-0'}}</span></div>
              <div class="detail-row" *ngIf="booking.discountAmount > 0"><span class="detail-label">Discount</span><span class="green">-₹{{booking.discountAmount | number:'1.0-0'}}</span></div>
              <div class="detail-row" *ngIf="booking.creditsUsed > 0"><span class="detail-label">Credits Used</span><span class="green">-₹{{booking.creditsUsed | number:'1.0-0'}}</span></div>
              <div class="detail-row total"><span class="detail-label">Total Paid</span><span>₹{{booking.totalAmount | number:'1.0-0'}}</span></div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Passengers -->
        <mat-card class="details-card" *ngIf="booking.passengers && booking.passengers.length">
          <mat-card-header><mat-card-title>Passengers</mat-card-title></mat-card-header>
          <mat-card-content>
            <div *ngFor="let pax of booking.passengers; let i = index" class="pax-row">
              <mat-icon>person</mat-icon>
              <span>{{pax.firstName}} {{pax.lastName}}</span>
              <span class="pax-passport">Passport: {{pax.passportNumber}}</span>
              <span class="pax-nat">{{pax.nationality}}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Actions -->
        <div class="conf-actions">
          <button mat-raised-button color="primary" (click)="shareWhatsApp()">
            <mat-icon>share</mat-icon> Share via WhatsApp
          </button>
          <button mat-stroked-button (click)="printSummary()">
            <mat-icon>print</mat-icon> Print Summary
          </button>
          <button mat-button routerLink="/dashboard">
            <mat-icon>dashboard</mat-icon> My Bookings
          </button>
        </div>
      </div>

      <div *ngIf="!isLoading && !booking" class="empty-state">
        <mat-icon>receipt_long</mat-icon>
        <h3>Booking not found</h3>
        <button mat-raised-button color="primary" routerLink="/dashboard">Go to Dashboard</button>
      </div>
    </div>
  `,
  styles: [`
    .conf-page { min-height: calc(100vh - 64px); background: linear-gradient(135deg, #f5f7fa 0%, #e8eaf6 100%); padding: 40px 16px; }
    .conf-container { max-width: 700px; margin: 0 auto; }
    .conf-header { text-align: center; margin-bottom: 32px; }
    .success-icon { font-size: 80px; width: 80px; height: 80px; color: #4caf50; display: block; margin: 0 auto 16px; animation: checkmark 0.6s ease-out; }
    @keyframes checkmark { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }
    h1 { font-size: 28px; font-weight: 800; color: #1a237e; margin-bottom: 8px; }
    h1.pending-title { color: #e65100; }
    .booking-ref { font-size: 20px; font-weight: 700; color: #1a237e; background: #e8eaf6; padding: 8px 24px; border-radius: 8px; display: inline-block; margin-bottom: 12px; }
    .conf-subtitle { font-size: 14px; color: #666; max-width: 450px; margin: 0 auto; }
    .details-card { border-radius: 12px !important; margin-bottom: 20px; }
    .detail-grid { }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f5f5f5; font-size: 14px; }
    .detail-row.total { font-size: 16px; font-weight: 700; color: #1a237e; border-bottom: none; }
    .detail-label { color: #888; }
    .detail-val { font-weight: 500; }
    .green { color: #2e7d32; }
    .pax-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f5f5f5; font-size: 14px; }
    .pax-row mat-icon { color: #1a237e; }
    .pax-passport { color: #888; font-size: 12px; margin-left: auto; }
    .pax-nat { color: #666; font-size: 12px; }
    .conf-actions { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 24px; }
    .loading-spinner { display: flex; justify-content: center; padding: 60px; }
    .empty-state { text-align: center; padding: 60px; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; color: #ccc; display: block; margin: 0 auto 16px; }
  `]
})
export class BookingConfirmationComponent implements OnInit {
  private flightService = inject(FlightService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  booking: BookingDto | null = null;
  isLoading = true;

  ngOnInit(): void {
    const ref = this.route.snapshot.paramMap.get('ref');
    if (ref) this.loadBooking(ref);
    else this.isLoading = false;
  }

  loadBooking(ref: string): void {
    this.flightService.getUserBookings().subscribe({
      next: bookings => {
        this.booking = bookings.find(b => b.bookingRef === ref) || null;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  shareWhatsApp(): void {
    if (!this.booking) return;
    const text = `I just booked a private jet! ✈ ${this.booking.origin} → ${this.booking.destination} on ${new Date(this.booking.departureUtc).toDateString()}. Booking Ref: ${this.booking.bookingRef}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  printSummary(): void {
    window.print();
  }
}
