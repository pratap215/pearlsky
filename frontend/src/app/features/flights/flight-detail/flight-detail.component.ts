import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FlightService } from '../../../core/services/flight.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { EmptyLegDetailDto } from '../../../core/models/models';

@Component({
  selector: 'app-flight-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatExpansionModule, MatProgressSpinnerModule, MatDividerModule, MatSnackBarModule
  ],
  template: `
    <div class="page-container detail-page">
      <div class="back-bar">
        <button mat-button (click)="goBack()"><mat-icon>arrow_back</mat-icon> Back to Search</button>
      </div>

      <div *ngIf="isLoading" class="loading-spinner"><mat-spinner diameter="48"></mat-spinner></div>

      <div *ngIf="!isLoading && !flight" class="empty-state">
        <mat-icon>flight_off</mat-icon>
        <h3>Flight not found</h3>
        <button mat-raised-button color="primary" routerLink="/flights">Browse Flights</button>
      </div>

      <div *ngIf="!isLoading && flight" class="detail-layout">
        <!-- Left Column -->
        <div class="detail-left">
          <!-- Image Gallery -->
          <div class="gallery">
            <div class="gallery-main">
              <img [src]="activeImage || flight.mainImageUrl" [alt]="flight.jetModel"
                   (error)="onImgError($event)" class="main-img">
              <div class="main-img-fallback"><mat-icon>flight</mat-icon></div>
            </div>
            <div class="gallery-thumbs" *ngIf="allImages.length > 1">
              <div *ngFor="let img of allImages" class="thumb-wrap" (click)="activeImage = img"
                   [class.active]="activeImage === img">
                <img [src]="img" (error)="onThumbError($event)" class="thumb-img">
              </div>
            </div>
          </div>

          <!-- Aircraft Details -->
          <mat-card class="detail-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>flight</mat-icon>
              <mat-card-title>Aircraft Details</mat-card-title>
              <mat-card-subtitle>{{flight.manufacturer}} {{flight.jetModel}}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="spec-grid">
                <div class="spec-item"><span class="spec-label">Category</span><span class="spec-val">{{flight.jetCategory}}</span></div>
                <div class="spec-item"><span class="spec-label">Tail Number</span><span class="spec-val">{{flight.tailNumber}}</span></div>
                <div class="spec-item"><span class="spec-label">Year</span><span class="spec-val">{{flight.yearOfManufacture}}</span></div>
                <div class="spec-item"><span class="spec-label">Seats</span><span class="spec-val">{{flight.seatingCapacity}}</span></div>
                <div class="spec-item"><span class="spec-label">Range</span><span class="spec-val">{{flight.rangeKm}} km</span></div>
                <div class="spec-item"><span class="spec-label">Speed</span><span class="spec-val">{{flight.speedKmh}} km/h</span></div>
              </div>
              <div class="amenities-row">
                <span *ngIf="flight.hasWifi" class="chip-wifi"><mat-icon style="font-size:13px;width:13px;height:13px">wifi</mat-icon> WiFi</span>
                <span *ngIf="flight.hasCatering" class="chip-catering"><mat-icon style="font-size:13px;width:13px;height:13px">restaurant</mat-icon> Catering</span>
                <span *ngIf="flight.hasBedroom" class="chip-bedroom"><mat-icon style="font-size:13px;width:13px;height:13px">bed</mat-icon> Bedroom</span>
              </div>
              <p class="description" *ngIf="flight.description">{{flight.description}}</p>
              <mat-divider style="margin: 16px 0"></mat-divider>
              <div class="operator-row">
                <mat-icon>business</mat-icon>
                <div>
                  <div class="op-name">{{flight.operatorName}}</div>
                  <div class="op-sub">Verified Operator</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Policies -->
          <mat-card class="detail-card" *ngIf="flight.policies && flight.policies.length">
            <mat-card-header><mat-card-title>Policies</mat-card-title></mat-card-header>
            <mat-card-content>
              <mat-accordion>
                <mat-expansion-panel *ngFor="let policy of flight.policies">
                  <mat-expansion-panel-header>
                    <mat-panel-title>{{policy.title}}</mat-panel-title>
                    <mat-panel-description>{{policy.policyType}}</mat-panel-description>
                  </mat-expansion-panel-header>
                  <p>{{policy.content}}</p>
                </mat-expansion-panel>
              </mat-accordion>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Right Column - Booking Card -->
        <div class="detail-right">
          <mat-card class="booking-card">
            <mat-card-content>
              <!-- Route -->
              <div class="book-route">
                <div class="book-iata">{{flight.originCode}}</div>
                <mat-icon class="book-arrow">flight</mat-icon>
                <div class="book-iata">{{flight.destinationCode}}</div>
              </div>
              <div class="book-cities">{{flight.origin}} → {{flight.destination}}</div>
              <div class="book-date">
                <mat-icon>schedule</mat-icon>
                {{flight.departureUtc | date:'EEEE, MMMM d, y'}} at {{flight.departureUtc | date:'h:mm a'}}
              </div>
              <div class="book-duration">
                <mat-icon>timer</mat-icon> {{getDuration(flight.durationMinutes)}}
              </div>
              <mat-divider style="margin: 16px 0"></mat-divider>
              <!-- Price -->
              <div class="price-section">
                <div class="price-row2">
                  <span>Base Price</span>
                  <span>₹{{flight.price | number:'1.0-0'}}</span>
                </div>
                <div class="price-row2">
                  <span>GST (18%)</span>
                  <span>₹{{flight.taxAmount | number:'1.0-0'}}</span>
                </div>
                <div class="price-row2 total">
                  <span>Total</span>
                  <span>₹{{flight.totalPrice | number:'1.0-0'}}</span>
                </div>
              </div>
              <div class="book-seats">
                <mat-icon>people</mat-icon>
                <span>Capacity: {{flight.seatingCapacity}} passengers</span>
              </div>
              <div class="charter-badge">
                <mat-icon>flight</mat-icon> Private Charter — Full Aircraft
              </div>
              <div class="confirm-mode">
                <span class="confirm-badge" [ngClass]="flight.confirmationMode === 'Instant' ? 'confirm-instant' : 'confirm-approval'">
                  <mat-icon style="font-size:14px;width:14px;height:14px">
                    {{flight.confirmationMode === 'Instant' ? 'flash_on' : 'pending'}}
                  </mat-icon>
                  {{flight.confirmationMode === 'Instant' ? 'Instant Confirmation' : 'Requires Operator Approval'}}
                </span>
              </div>
              <button mat-raised-button color="primary" class="book-btn" (click)="bookNow()">
                <mat-icon>book_online</mat-icon> Book Now
              </button>
              <button mat-stroked-button class="fav-btn" (click)="toggleFav()">
                <mat-icon [color]="flight.isFavorite ? 'warn' : ''">
                  {{flight.isFavorite ? 'favorite' : 'favorite_border'}}
                </mat-icon>
                {{flight.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}}
              </button>
              <button mat-stroked-button class="sub-btn"
                      [class.subscribed]="isSubscribed"
                      (click)="toggleSubscription()"
                      *ngIf="authService.isLoggedIn()">
                <mat-icon>{{isSubscribed ? 'notifications_active' : 'notifications_none'}}</mat-icon>
                {{isSubscribed ? 'Subscribed to Jet' : 'Subscribe to Jet'}}
              </button>
              <button mat-button class="share-btn" (click)="shareUrl()">
                <mat-icon>share</mat-icon> Share
              </button>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .detail-page { padding: 24px; }
    .back-bar { margin-bottom: 16px; }
    .detail-layout { display: grid; grid-template-columns: 1fr 380px; gap: 24px; align-items: start; }
    .gallery { border-radius: 12px; overflow: hidden; margin-bottom: 20px; background: linear-gradient(135deg, #1a237e, #283593); }
    .gallery-main { height: 340px; position: relative; }
    .main-img { width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; }
    .main-img-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
    .main-img-fallback mat-icon { font-size: 80px; width: 80px; height: 80px; color: rgba(255,255,255,0.2); }
    .gallery-thumbs { display: flex; gap: 8px; padding: 8px; background: #f5f5f5; }
    .thumb-wrap { width: 80px; height: 60px; border-radius: 6px; overflow: hidden; cursor: pointer; border: 2px solid transparent; }
    .thumb-wrap.active { border-color: #1a237e; }
    .thumb-img { width: 100%; height: 100%; object-fit: cover; }
    .detail-card { border-radius: 12px !important; margin-bottom: 20px; }
    .spec-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
    .spec-item { display: flex; flex-direction: column; }
    .spec-label { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
    .spec-val { font-size: 15px; font-weight: 600; color: #1a237e; margin-top: 4px; }
    .amenities-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
    .chip-wifi, .chip-catering, .chip-bedroom { display: flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 10px; font-size: 12px; }
    .description { font-size: 14px; color: #555; line-height: 1.6; margin-top: 12px; }
    .operator-row { display: flex; align-items: center; gap: 12px; }
    .operator-row mat-icon { color: #1a237e; font-size: 28px; width: 28px; height: 28px; }
    .op-name { font-size: 15px; font-weight: 600; color: #1a237e; }
    .op-sub { font-size: 12px; color: #888; }
    .booking-card { border-radius: 12px !important; position: sticky; top: 80px; }
    .book-route { display: flex; align-items: center; gap: 12px; justify-content: center; margin-bottom: 4px; }
    .book-iata { font-size: 28px; font-weight: 800; color: #1a237e; }
    .book-arrow { font-size: 24px; color: #ffc107; transform: rotate(0deg); }
    .book-cities { text-align: center; font-size: 13px; color: #888; margin-bottom: 12px; }
    .book-date, .book-duration { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #444; margin-bottom: 8px; }
    .book-date mat-icon, .book-duration mat-icon { color: #1a237e; font-size: 18px; width: 18px; height: 18px; }
    .price-section { margin: 12px 0; }
    .price-row2 { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #555; }
    .price-row2.total { font-size: 18px; font-weight: 700; color: #1a237e; border-top: 2px solid #e0e0e0; margin-top: 8px; padding-top: 12px; }
    .book-seats { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #444; margin: 12px 0 8px; }
    .charter-badge { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #1a237e; background: #e8eaf6; padding: 6px 12px; border-radius: 6px; margin-bottom: 12px; font-weight: 600; }
    .charter-badge mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .confirm-mode { margin-bottom: 16px; }
    .confirm-badge { display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .confirm-instant { color: #1b5e20; background: #c8e6c9; }
    .confirm-approval { color: #0d47a1; background: #bbdefb; }
    .book-btn { width: 100%; height: 52px; font-size: 16px; font-weight: 700; margin-bottom: 10px; }
    .fav-btn, .share-btn, .sub-btn { width: 100%; margin-bottom: 8px; }
    .sub-btn { border-color: #0A0F2E !important; color: #0A0F2E !important; }
    .sub-btn.subscribed { border-color: #2e7d32 !important; color: #2e7d32 !important; background: #e8f5e9 !important; }
    @media (max-width: 900px) {
      .detail-layout { grid-template-columns: 1fr; }
      .booking-card { position: static; }
    }
  `]
})
export class FlightDetailComponent implements OnInit {
  private flightService = inject(FlightService);
  authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  flight: EmptyLegDetailDto | null = null;
  isLoading = false;
  activeImage = '';
  allImages: string[] = [];
  isSubscribed = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadFlight(+id);
  }

  loadFlight(id: number): void {
    this.isLoading = true;
    this.flightService.getDetail(id).subscribe({
      next: f => {
        this.flight = f;
        this.allImages = [f.mainImageUrl, ...(f.imageUrls || [])].filter(Boolean);
        this.activeImage = this.allImages[0] || '';
        this.isLoading = false;
        // Check subscription status if logged in
        if (this.authService.isLoggedIn()) {
          this.userService.getJetSubscriptionStatus(f.jetId).subscribe({
            next: r => { this.isSubscribed = r.isSubscribed; },
            error: () => {}
          });
        }
      },
      error: () => { this.isLoading = false; }
    });
  }

  bookNow(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.router.navigate(['/booking', this.flight!.id]);
  }

  toggleFav(): void {
    if (!this.authService.isLoggedIn()) { this.router.navigate(['/login']); return; }
    this.flightService.toggleFavorite(this.flight!.id).subscribe({
      next: (res: any) => {
        this.flight!.isFavorite = res.isFavorite;
        this.snackBar.open(
          res.isFavorite ? '❤ Added to favorites!' : 'Removed from favorites',
          'Close', { duration: 3000 }
        );
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Could not update favorites', 'Close', { duration: 3000 });
      }
    });
  }

  toggleSubscription(): void {
    if (!this.authService.isLoggedIn()) { this.router.navigate(['/login']); return; }
    const jetId = this.flight!.jetId;
    if (this.isSubscribed) {
      this.userService.unsubscribeFromJet(jetId).subscribe({
        next: () => {
          this.isSubscribed = false;
          this.snackBar.open('Unsubscribed from jet updates', 'Close', { duration: 3000 });
        },
        error: (err) => {
          this.snackBar.open(err?.error?.message || 'Could not unsubscribe', 'Close', { duration: 3000 });
        }
      });
    } else {
      this.userService.subscribeToJet(jetId).subscribe({
        next: () => {
          this.isSubscribed = true;
          this.snackBar.open('✓ Subscribed! You\'ll get email alerts for new flights on this jet.', 'Close', { duration: 4000 });
        },
        error: (err) => {
          this.snackBar.open(err?.error?.message || 'Could not subscribe', 'Close', { duration: 3000 });
        }
      });
    }
  }

  shareUrl(): void {
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.snackBar.open('Link copied to clipboard!', 'Close', { duration: 3000 });
    });
  }

  goBack(): void {
    this.router.navigate(['/flights']);
  }

  getDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  onThumbError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
