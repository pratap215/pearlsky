import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FlightService } from '../../core/services/flight.service';
import { CryptoService } from '../../core/services/crypto.service';
import { EmptyLegDto } from '../../core/models/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatAutocompleteModule
  ],
  template: `
    <!-- ── Hero ──────────────────────────────────────────────────────────── -->
    <section class="hero">
      <div class="hero-bg-dots"></div>
      <div class="hero-content">
        <div class="hero-badge">
          <mat-icon>bolt</mat-icon>
          <span>India's #1 Empty Leg Platform</span>
        </div>
        <h1 class="hero-title">
          Fly Exclusive.<br>
          <span class="hero-accent">Pay Smart.</span>
        </h1>
        <p class="hero-sub">Access private jets at a fraction of the cost.<br>
          Exclusive empty leg deals from 20+ operators across India & Sri Lanka.</p>

        <!-- Search Card -->
        <div class="search-card">
          <div class="search-row">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>From</mat-label>
              <mat-icon matPrefix>flight_takeoff</mat-icon>
              <input matInput [formControl]="originCtrl" [matAutocomplete]="originAuto" placeholder="Mumbai, BOM...">
              <mat-autocomplete #originAuto="matAutocomplete" (optionSelected)="originCtrl.setValue($event.option.value); searchOrigin=$event.option.value">
                <mat-option *ngFor="let opt of filteredOrigins" [value]="opt.value">{{opt.label}}</mat-option>
              </mat-autocomplete>
            </mat-form-field>
            <div class="search-divider"><mat-icon>swap_horiz</mat-icon></div>
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>To</mat-label>
              <mat-icon matPrefix>flight_land</mat-icon>
              <input matInput [formControl]="destCtrl" [matAutocomplete]="destAuto" placeholder="Bangalore, BLR...">
              <mat-autocomplete #destAuto="matAutocomplete" (optionSelected)="destCtrl.setValue($event.option.value); searchDest=$event.option.value">
                <mat-option *ngFor="let opt of filteredDestinations" [value]="opt.value">{{opt.label}}</mat-option>
              </mat-autocomplete>
            </mat-form-field>
            <mat-form-field appearance="outline" class="search-field-sm">
              <mat-label>Passengers</mat-label>
              <mat-icon matPrefix>people</mat-icon>
              <mat-select [(ngModel)]="searchPassengers">
                <mat-option *ngFor="let n of seatOptions" [value]="n">{{n}} pax</mat-option>
              </mat-select>
            </mat-form-field>
            <button mat-raised-button class="search-btn" (click)="goSearch()">
              <mat-icon>search</mat-icon> Find Flights
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Stats Bar ──────────────────────────────────────────────────────── -->
    <div class="stats-bar">
      <div class="stat-item">
        <div class="stat-icon"><mat-icon>flight</mat-icon></div>
        <div><div class="stat-num">200+</div><div class="stat-label">Jets Available</div></div>
      </div>
      <div class="stat-sep"></div>
      <div class="stat-item">
        <div class="stat-icon"><mat-icon>business</mat-icon></div>
        <div><div class="stat-num">20+</div><div class="stat-label">Operators</div></div>
      </div>
      <div class="stat-sep"></div>
      <div class="stat-item">
        <div class="stat-icon"><mat-icon>savings</mat-icon></div>
        <div><div class="stat-num">₹15K+</div><div class="stat-label">Avg. Savings</div></div>
      </div>
      <div class="stat-sep"></div>
      <div class="stat-item">
        <div class="stat-icon"><mat-icon>verified</mat-icon></div>
        <div><div class="stat-num">100%</div><div class="stat-label">Verified Operators</div></div>
      </div>
    </div>

    <!-- ── How It Works ──────────────────────────────────────────────────── -->
    <section class="section">
      <div class="page-container">
        <div class="section-header">
          <h2 class="section-title">How JetFlux Works</h2>
          <p class="section-sub">Book your private jet in three simple steps</p>
        </div>
        <div class="how-grid">
          <div class="how-card">
            <div class="how-num">01</div>
            <div class="how-icon"><mat-icon>search</mat-icon></div>
            <h3>Search</h3>
            <p>Browse real-time empty leg flights that match your route and travel dates</p>
          </div>
          <div class="how-card">
            <div class="how-num">02</div>
            <div class="how-icon"><mat-icon>lock_clock</mat-icon></div>
            <h3>Lock & Book</h3>
            <p>Secure your seats with a time-limited lock and complete payment seamlessly</p>
          </div>
          <div class="how-card">
            <div class="how-num">03</div>
            <div class="how-icon"><mat-icon>flight_takeoff</mat-icon></div>
            <h3>Fly Private</h3>
            <p>Board your exclusive private jet and enjoy the premium experience you deserve</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Featured Flights ───────────────────────────────────────────────── -->
    <section class="section section-dark">
      <div class="page-container">
        <div class="section-header">
          <h2 class="section-title light">Featured Flights</h2>
          <p class="section-sub light">Live empty legs ready to book right now</p>
        </div>
        <div *ngIf="isLoading" class="loading-spinner"><mat-spinner diameter="48"></mat-spinner></div>
        <div *ngIf="!isLoading" class="flight-grid">
          <mat-card *ngFor="let flight of flights" class="flight-card" (click)="goToFlight(flight.id)">
            <div class="flight-img-wrap">
              <img [src]="flight.mainImageUrl" [alt]="flight.jetModel"
                   (error)="onImgError($event)" class="flight-img">
              <div class="flight-img-overlay">
                <span class="status-badge available">{{flight.originCode}} → {{flight.destinationCode}}</span>
              </div>
              <div class="flight-price-badge">₹{{flight.price | number:'1.0-0'}}</div>
            </div>
            <mat-card-content class="flight-content">
              <div class="route-row">
                <span class="city-name">{{flight.origin}}</span>
                <mat-icon class="route-arrow">arrow_forward</mat-icon>
                <span class="city-name">{{flight.destination}}</span>
              </div>
              <div class="flight-meta">
                <span><mat-icon>calendar_today</mat-icon> {{flight.departureUtc | date:'MMM d, y'}}</span>
                <span><mat-icon>airline_seat_recline_normal</mat-icon> {{flight.availableSeats}} seats</span>
              </div>
              <div class="jet-row">
                <mat-icon>flight</mat-icon>
                <span>{{flight.manufacturer}} {{flight.jetModel}}</span>
              </div>
            </mat-card-content>
            <mat-card-actions class="flight-actions">
              <button mat-button (click)="goToFlight(flight.id); $event.stopPropagation()">Details</button>
              <button mat-flat-button color="accent" class="book-btn-small" (click)="bookFlight(flight.id); $event.stopPropagation()">
                Book Now
              </button>
            </mat-card-actions>
          </mat-card>
        </div>
        <div *ngIf="!isLoading && flights.length === 0" class="empty-state">
          <mat-icon>flight_off</mat-icon>
          <p>No flights available right now. Check back soon.</p>
        </div>
        <div class="view-all-wrap">
          <button mat-stroked-button class="view-all-btn" routerLink="/flights">
            View All Flights <mat-icon>arrow_forward</mat-icon>
          </button>
        </div>
      </div>
    </section>

    <!-- ── Footer ─────────────────────────────────────────────────────────── -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="18" fill="#FFB800"/>
            <path d="M9 23 L15 9 L20 16 L27 11 L23 27 L17 20 Z" fill="#0A0F2E"/>
          </svg>
          <span class="footer-logo-text">Jet<span style="color:#FFB800">Flux</span></span>
        </div>
        <p class="footer-copy">&copy; 2026 JetFlux. All rights reserved. | Private Jet Booking Platform</p>
      </div>
    </footer>
  `,
  styles: [`
    /* ── Hero ─────────────────────────────────────────────────────────────── */
    .hero {
      background: linear-gradient(135deg, #0A0F2E 0%, #131B4D 50%, #0D1A3A 100%);
      color: white;
      padding: 80px 24px 70px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .hero::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(ellipse at center, rgba(255,184,0,0.06) 0%, transparent 70%);
      pointer-events: none;
    }
    .hero-content { max-width: 860px; margin: 0 auto; position: relative; z-index: 1; }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,184,0,0.12);
      border: 1px solid rgba(255,184,0,0.3);
      color: #FFB800;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 24px;
    }
    .hero-badge mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .hero-title {
      font-family: 'Montserrat', sans-serif;
      font-size: 58px;
      font-weight: 900;
      line-height: 1.1;
      margin-bottom: 20px;
      letter-spacing: -1px;
    }
    .hero-accent { color: #FFB800; }
    .hero-sub { font-size: 18px; color: rgba(255,255,255,0.7); margin-bottom: 48px; line-height: 1.6; }
    .search-card {
      background: rgba(255,255,255,0.97);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .search-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; justify-content: center; }
    .search-field { min-width: 180px; flex: 1; }
    .search-field-sm { min-width: 140px; }
    .search-divider { color: #aaa; display: flex; align-items: center; }
    .search-btn {
      height: 56px;
      font-size: 15px;
      font-weight: 700;
      padding: 0 28px;
      background: #FFB800 !important;
      color: #0A0F2E !important;
      border-radius: 8px !important;
      flex-shrink: 0;
    }

    /* ── Stats Bar ─────────────────────────────────────────────────────────── */
    .stats-bar {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0;
      background: #0A0F2E;
      padding: 24px;
      border-top: 1px solid rgba(255,184,0,0.2);
      flex-wrap: wrap;
    }
    .stat-item { display: flex; align-items: center; gap: 12px; padding: 0 40px; }
    .stat-icon { width: 44px; height: 44px; border-radius: 10px; background: rgba(255,184,0,0.12); display: flex; align-items: center; justify-content: center; }
    .stat-icon mat-icon { color: #FFB800; font-size: 22px; width: 22px; height: 22px; }
    .stat-num { font-family: 'Montserrat', sans-serif; font-size: 22px; font-weight: 800; color: white; }
    .stat-label { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 2px; }
    .stat-sep { width: 1px; height: 48px; background: rgba(255,255,255,0.1); }

    /* ── How It Works ──────────────────────────────────────────────────────── */
    .section { padding: 72px 0; }
    .section-dark { background: #f8f9ff; }
    .section-header { text-align: center; margin-bottom: 48px; }
    .section-title { font-family: 'Montserrat', sans-serif; font-size: 32px; font-weight: 800; color: #0A0F2E; margin: 0 0 8px; }
    .section-title.light { color: #0A0F2E; }
    .section-sub { font-size: 16px; color: #666; margin: 0; }
    .section-sub.light { color: #666; }
    .how-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .how-card {
      background: white;
      border-radius: 16px;
      padding: 36px 28px;
      text-align: center;
      box-shadow: 0 2px 20px rgba(0,0,0,0.07);
      border: 1px solid #eee;
      position: relative;
    }
    .how-num { position: absolute; top: 20px; right: 20px; font-family: 'Montserrat', sans-serif; font-size: 48px; font-weight: 900; color: rgba(10,15,46,0.05); line-height: 1; }
    .how-icon { width: 64px; height: 64px; border-radius: 16px; background: #0A0F2E; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
    .how-icon mat-icon { font-size: 30px; width: 30px; height: 30px; color: #FFB800; }
    .how-card h3 { font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 800; margin-bottom: 10px; color: #0A0F2E; }
    .how-card p { color: #666; font-size: 14px; line-height: 1.6; margin: 0; }

    /* ── Flight Cards ──────────────────────────────────────────────────────── */
    .flight-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .flight-card {
      cursor: pointer;
      transition: transform .2s ease, box-shadow .2s ease;
      border-radius: 14px !important;
      overflow: hidden;
      background: white;
    }
    .flight-card:hover { transform: translateY(-5px); box-shadow: 0 12px 40px rgba(0,0,0,0.15) !important; }
    .flight-img-wrap { position: relative; height: 160px; overflow: hidden; background: linear-gradient(135deg, #0A0F2E, #1a237e); }
    .flight-img { width: 100%; height: 100%; object-fit: cover; }
    .flight-img-overlay { position: absolute; top: 10px; left: 10px; }
    .status-badge { background: rgba(0,0,0,0.6); color: white; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; }
    .flight-price-badge {
      position: absolute;
      bottom: 10px;
      right: 10px;
      background: #FFB800;
      color: #0A0F2E;
      padding: 4px 12px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 800;
      font-family: 'Montserrat', sans-serif;
    }
    .flight-content { padding: 16px 16px 4px; }
    .route-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .city-name { font-size: 16px; font-weight: 700; color: #0A0F2E; }
    .route-arrow { font-size: 18px; color: #FFB800; }
    .flight-meta { display: flex; gap: 12px; font-size: 12px; color: #666; margin-bottom: 6px; flex-wrap: wrap; }
    .flight-meta span { display: flex; align-items: center; gap: 4px; }
    .flight-meta mat-icon { font-size: 14px; width: 14px; height: 14px; color: #0A0F2E; }
    .jet-row { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #555; }
    .jet-row mat-icon { font-size: 16px; width: 16px; height: 16px; color: #0A0F2E; }
    .flight-actions { display: flex; justify-content: space-between; align-items: center; padding: 4px 8px 12px; }
    .book-btn-small { background: #0A0F2E !important; color: #FFB800 !important; font-weight: 700 !important; border-radius: 6px !important; }
    .view-all-wrap { text-align: center; margin-top: 40px; }
    .view-all-btn { color: #0A0F2E !important; border-color: #0A0F2E !important; font-weight: 700; font-size: 15px; padding: 8px 28px; border-radius: 8px !important; }
    .view-all-btn mat-icon { vertical-align: middle; }

    /* ── Loading / Empty ───────────────────────────────────────────────────── */
    .loading-spinner { display: flex; justify-content: center; padding: 60px 0; }
    .empty-state { text-align: center; padding: 60px 0; color: #aaa; }
    .empty-state mat-icon { font-size: 56px; width: 56px; height: 56px; display: block; margin: 0 auto 12px; }

    /* ── Footer ───────────────────────────────────────────────────────────── */
    .footer { background: #0A0F2E; padding: 28px 24px; }
    .footer-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
    .footer-brand { display: flex; align-items: center; gap: 10px; }
    .footer-logo-text { font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 900; color: white; }
    .footer-copy { color: rgba(255,255,255,0.4); font-size: 13px; margin: 0; }

    @media (max-width: 768px) {
      .hero-title { font-size: 36px; }
      .hero-sub { font-size: 15px; }
      .search-row { flex-direction: column; }
      .search-field, .search-field-sm { min-width: 100%; }
      .search-btn { width: 100%; }
      .how-grid { grid-template-columns: 1fr; }
      .stat-item { padding: 0 20px; }
      .stat-sep { display: none; }
    }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  private flightService = inject(FlightService);
  private router = inject(Router);
  private cryptoService = inject(CryptoService);
  private destroy$ = new Subject<void>();

  flights: EmptyLegDto[] = [];
  isLoading = false;
  searchOrigin = '';
  searchDest = '';
  searchPassengers = 1;
  seatOptions = Array.from({ length: 18 }, (_, i) => i + 1);

  originCtrl = new FormControl('');
  destCtrl = new FormControl('');
  allOrigins: any[] = [];
  allDestinations: any[] = [];
  filteredOrigins: any[] = [];
  filteredDestinations: any[] = [];

  ngOnInit(): void {
    this.loadFeatured();

    this.flightService.getAirports().subscribe({
      next: data => {
        this.allOrigins = data.origins;
        this.allDestinations = data.destinations;
        this.filteredOrigins = data.origins;
        this.filteredDestinations = data.destinations;
      }
    });

    this.originCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
      const v = (val || '').toLowerCase();
      this.filteredOrigins = this.allOrigins.filter(o => o.label.toLowerCase().includes(v));
      this.searchOrigin = val || '';
    });

    this.destCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
      const v = (val || '').toLowerCase();
      this.filteredDestinations = this.allDestinations.filter(d => d.label.toLowerCase().includes(v));
      this.searchDest = val || '';
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFeatured(): void {
    this.isLoading = true;
    this.flightService.search({ pageSize: 6, page: 1 }).subscribe({
      next: res => { this.flights = res.items || []; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  async goSearch(): Promise<void> {
    const params: any = {};
    if (this.searchOrigin) params['origin'] = this.searchOrigin;
    if (this.searchDest) params['destination'] = this.searchDest;
    if (this.searchPassengers > 1) params['minSeats'] = this.searchPassengers;

    if (Object.keys(params).length > 0) {
      const encrypted = await this.cryptoService.encrypt(params);
      this.router.navigate(['/flights'], { queryParams: { q: encrypted } });
    } else {
      this.router.navigate(['/flights']);
    }
  }

  goToFlight(id: number): void {
    this.router.navigate(['/flights', id]);
  }

  bookFlight(id: number): void {
    this.router.navigate(['/booking', id]);
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
