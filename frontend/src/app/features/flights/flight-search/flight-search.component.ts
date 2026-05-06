import { Component, OnInit, OnDestroy, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormControl } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FlightService } from '../../../core/services/flight.service';
import { AuthService } from '../../../core/services/auth.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { CryptoService } from '../../../core/services/crypto.service';
import { EmptyLegDto, PagedResult } from '../../../core/models/models';

@Component({
  selector: 'app-flight-search',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatChipsModule, MatPaginatorModule,
    MatAutocompleteModule
  ],
  template: `
    <!-- Sticky Filter Bar -->
    <div class="filter-bar">
      <div class="page-container filter-inner">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Origin</mat-label>
          <mat-icon matPrefix>flight_takeoff</mat-icon>
          <input matInput [formControl]="originCtrl" [matAutocomplete]="originAuto" placeholder="Mumbai, BOM...">
          <mat-autocomplete #originAuto="matAutocomplete" (optionSelected)="originCtrl.setValue($event.option.value); filters.origin=$event.option.value; onFilterChange()">
            <mat-option *ngFor="let opt of filteredOrigins" [value]="opt.value">{{opt.label}}</mat-option>
          </mat-autocomplete>
        </mat-form-field>
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Destination</mat-label>
          <mat-icon matPrefix>flight_land</mat-icon>
          <input matInput [formControl]="destCtrl" [matAutocomplete]="destAuto" placeholder="Bangalore, BLR...">
          <mat-autocomplete #destAuto="matAutocomplete" (optionSelected)="destCtrl.setValue($event.option.value); filters.destination=$event.option.value; onFilterChange()">
            <mat-option *ngFor="let opt of filteredDestinations" [value]="opt.value">{{opt.label}}</mat-option>
          </mat-autocomplete>
        </mat-form-field>
        <mat-form-field appearance="outline" class="filter-field-sm">
          <mat-label>Min Seats</mat-label>
          <mat-select [(ngModel)]="filters.minSeats" (ngModelChange)="onFilterChange()">
            <mat-option [value]="null">Any</mat-option>
            <mat-option *ngFor="let n of seatOptions" [value]="n">{{n}}+</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="filter-field-sm">
          <mat-label>Max Price (₹)</mat-label>
          <input matInput type="number" [(ngModel)]="filters.maxPrice" (ngModelChange)="onFilterChange()">
        </mat-form-field>
        <mat-form-field appearance="outline" class="filter-field-sm">
          <mat-label>Category</mat-label>
          <mat-select [(ngModel)]="filters.category" (ngModelChange)="onFilterChange()">
            <mat-option value="">All</mat-option>
            <mat-option *ngFor="let c of categories" [value]="c">{{c}}</mat-option>
          </mat-select>
        </mat-form-field>
        <button mat-raised-button color="primary" (click)="search()">
          <mat-icon>search</mat-icon> Search
        </button>
        <button mat-stroked-button (click)="resetFilters()">
          <mat-icon>clear</mat-icon> Reset
        </button>
      </div>
    </div>

    <!-- Results -->
    <div class="page-container results-area">
      <div class="results-header">
        <h2 class="results-title" *ngIf="!isLoading">
          <mat-icon>flight</mat-icon>
          {{totalCount}} Flights Available
        </h2>
        <h2 class="results-title" *ngIf="isLoading">Searching...</h2>
      </div>

      <div *ngIf="isLoading" class="loading-spinner"><mat-spinner diameter="48"></mat-spinner></div>

      <div *ngIf="!isLoading && flights.length === 0" class="empty-state">
        <mat-icon>flight_off</mat-icon>
        <h3>No flights found</h3>
        <p>Try adjusting your filters or search a different route</p>
        <button mat-raised-button color="primary" (click)="resetFilters()">Clear Filters</button>
      </div>

      <div *ngIf="!isLoading && flights.length > 0" class="flight-grid">
        <mat-card *ngFor="let flight of flights" class="flight-card-item" [class.blocked]="flight.status === 'Blocked'">
          <!-- Image -->
          <div class="fcard-img">
            <img [src]="flight.mainImageUrl" [alt]="flight.jetModel" (error)="onImgError($event)" class="fcard-photo">
            <div class="fcard-img-placeholder"><mat-icon>flight</mat-icon></div>
            <div class="fcard-badges">
              <span class="status-badge" [ngClass]="'status-' + flight.status.toLowerCase()">
                <mat-icon *ngIf="flight.status === 'Blocked'" style="font-size:12px;width:12px;height:12px">lock</mat-icon>
                {{flight.status === 'Blocked' ? 'Being Booked' : flight.status}}
              </span>
              <span class="confirm-badge" [ngClass]="flight.confirmationMode === 'Instant' ? 'confirm-instant' : 'confirm-approval'">
                {{flight.confirmationMode === 'Instant' ? 'Instant' : 'Needs Approval'}}
              </span>
            </div>
          </div>
          <!-- Body -->
          <mat-card-content class="fcard-body">
            <div class="fcard-route">
              <div class="fcard-iata">{{flight.originCode}}</div>
              <mat-icon class="fcard-arrow">arrow_forward</mat-icon>
              <div class="fcard-iata">{{flight.destinationCode}}</div>
            </div>
            <div class="fcard-cities">{{flight.origin}} → {{flight.destination}}</div>
            <div class="fcard-meta">
              <span><mat-icon>schedule</mat-icon> {{flight.departureUtc | date:'MMM d, h:mm a'}}</span>
              <span><mat-icon>timer</mat-icon> {{getDuration(flight.durationMinutes)}}</span>
            </div>
            <div class="fcard-aircraft">
              <mat-icon>flight</mat-icon> {{flight.manufacturer}} {{flight.jetModel}}
              <span class="cat-chip">{{flight.jetCategory}}</span>
            </div>
            <div class="fcard-amenities">
              <span *ngIf="flight.hasWifi" class="chip-wifi">WiFi</span>
              <span *ngIf="flight.hasCatering" class="chip-catering">Catering</span>
              <span *ngIf="flight.hasBedroom" class="chip-bedroom">Bedroom</span>
            </div>
            <div class="fcard-seats">
              <mat-icon>airline_seat_recline_normal</mat-icon> {{flight.availableSeats}} seats • {{flight.operatorName}}
            </div>
            <div class="fcard-price">
              <div class="fcard-price-main">₹{{flight.price | number:'1.0-0'}}</div>
              <div class="fcard-price-tax">+₹{{flight.taxAmount | number:'1.0-0'}} GST</div>
            </div>
          </mat-card-content>
          <!-- Actions -->
          <mat-card-actions class="fcard-actions">
            <button mat-icon-button [color]="flight.isFavorite ? 'warn' : ''" (click)="toggleFav(flight)">
              <mat-icon>{{flight.isFavorite ? 'favorite' : 'favorite_border'}}</mat-icon>
            </button>
            <button mat-button color="primary" [routerLink]="['/flights', flight.id]">Details</button>
            <button mat-raised-button color="primary" (click)="bookFlight(flight)" [disabled]="flight.status === 'Blocked' || flight.status === 'Booked'">
              <mat-icon>book_online</mat-icon> Book Now
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <!-- Pagination -->
      <mat-paginator
        *ngIf="totalCount > pageSize"
        [length]="totalCount"
        [pageSize]="pageSize"
        [pageIndex]="currentPage - 1"
        [pageSizeOptions]="[6, 12, 24]"
        (page)="onPageChange($event)"
        class="paginator">
      </mat-paginator>
    </div>
  `,
  styles: [`
    .filter-bar { background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 16px 0; position: sticky; top: 64px; z-index: 100; }
    .filter-inner { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .filter-field { min-width: 180px; }
    .filter-field-sm { min-width: 130px; }
    .results-area { padding: 24px 24px; }
    .results-header { margin-bottom: 16px; }
    .results-title { display: flex; align-items: center; gap: 8px; font-size: 20px; font-weight: 700; color: #1B2A5C; }
    .flight-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
    .flight-card-item { border-radius: 12px !important; overflow: hidden; transition: transform 0.2s; }
    .flight-card-item:hover { transform: translateY(-3px); }
    .flight-card-item.blocked { opacity: 0.75; }
    .fcard-img { position: relative; height: 160px; overflow: hidden; background: linear-gradient(135deg, #1B2A5C, #2A3D75); }
    .fcard-photo { width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; }
    .fcard-img-placeholder { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
    .fcard-img-placeholder mat-icon { font-size: 64px; width: 64px; height: 64px; color: rgba(255,255,255,0.2); }
    .fcard-badges { position: absolute; top: 8px; left: 8px; display: flex; flex-direction: column; gap: 4px; }
    .status-badge, .confirm-badge { padding: 3px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; display: flex; align-items: center; gap: 3px; }
    .confirm-badge { }
    .fcard-body { padding: 12px 16px 4px; }
    .fcard-route { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .fcard-iata { font-size: 20px; font-weight: 800; color: #1B2A5C; }
    .fcard-arrow { color: #ffc107; }
    .fcard-cities { font-size: 11px; color: #888; margin-bottom: 8px; }
    .fcard-meta { display: flex; gap: 12px; font-size: 11px; color: #555; margin-bottom: 6px; }
    .fcard-meta span { display: flex; align-items: center; gap: 3px; }
    .fcard-meta mat-icon { font-size: 13px; width: 13px; height: 13px; }
    .fcard-aircraft { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #444; margin-bottom: 6px; }
    .fcard-aircraft mat-icon { font-size: 14px; width: 14px; height: 14px; color: #1B2A5C; }
    .cat-chip { background: #e8eaf6; color: #1B2A5C; font-size: 10px; padding: 2px 6px; border-radius: 8px; margin-left: 4px; }
    .fcard-amenities { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px; }
    .fcard-seats { font-size: 11px; color: #666; display: flex; align-items: center; gap: 4px; margin-bottom: 8px; }
    .fcard-seats mat-icon { font-size: 13px; width: 13px; height: 13px; }
    .fcard-price { display: flex; align-items: baseline; gap: 8px; }
    .fcard-price-main { font-size: 20px; font-weight: 700; color: #1B2A5C; }
    .fcard-price-tax { font-size: 11px; color: #999; }
    .fcard-actions { padding: 8px 8px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #f0f0f0; }
    .paginator { margin-top: 24px; }
    @media (max-width: 768px) { .filter-inner { flex-direction: column; } .filter-field, .filter-field-sm { width: 100%; min-width: unset; } }
  `]
})
export class FlightSearchComponent implements OnInit, OnDestroy {
  private flightService = inject(FlightService);
  private authService = inject(AuthService);
  private signalR = inject(SignalRService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private cryptoService = inject(CryptoService);
  private destroy$ = new Subject<void>();
  private filterChange$ = new Subject<void>();

  flights: EmptyLegDto[] = [];
  isLoading = false;
  totalCount = 0;
  currentPage = 1;
  pageSize = 12;

  filters = {
    origin: '',
    destination: '',
    minSeats: null as number | null,
    maxPrice: null as number | null,
    category: ''
  };

  originCtrl = new FormControl('');
  destCtrl = new FormControl('');
  allOrigins: any[] = [];
  allDestinations: any[] = [];
  filteredOrigins: any[] = [];
  filteredDestinations: any[] = [];

  seatOptions = [1, 2, 4, 6, 8, 10, 12, 18];
  categories = ['VeryLight', 'Light', 'Midsize', 'SuperMidsize', 'Heavy', 'UltraLong'];

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;

    // Support encrypted ?q= param (from home search) or legacy plain params
    const q = params['q'];
    if (q) {
      this.cryptoService.decrypt<any>(q).then(data => {
        if (data) {
          if (data['origin']) { this.filters.origin = data['origin']; this.originCtrl.setValue(data['origin'], {emitEvent: false}); }
          if (data['destination']) { this.filters.destination = data['destination']; this.destCtrl.setValue(data['destination'], {emitEvent: false}); }
          if (data['minSeats']) this.filters.minSeats = +data['minSeats'];
        }
        this.search();
      });
    } else {
      if (params['origin']) { this.filters.origin = params['origin']; this.originCtrl.setValue(params['origin'], {emitEvent: false}); }
      if (params['destination']) { this.filters.destination = params['destination']; this.destCtrl.setValue(params['destination'], {emitEvent: false}); }
      if (params['minSeats']) this.filters.minSeats = +params['minSeats'];
    }

    // Debounced pipeline for typing in filter boxes
    this.filterChange$.pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => this.search());

    // Initial load (only if no encrypted q)
    if (!q) this.search();

    // Load airports for autocomplete
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
      if (this.filters.origin !== val) {
        this.filters.origin = val || '';
        this.onFilterChange();
      }
    });

    this.destCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
      const v = (val || '').toLowerCase();
      this.filteredDestinations = this.allDestinations.filter(d => d.label.toLowerCase().includes(v));
      if (this.filters.destination !== val) {
        this.filters.destination = val || '';
        this.onFilterChange();
      }
    });

    // SignalR real-time status updates
    this.signalR.onEmptyLegStatusChanged(data => {
      const flight = this.flights.find(f => f.id === data.id);
      if (flight) this.zone.run(() => { flight.status = data.status; });
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.filterChange$.next();
  }

  search(): void {
    this.isLoading = true;
    this.updateSearchUrl();
    this.flightService.search({
      origin: this.filters.origin || undefined,
      destination: this.filters.destination || undefined,
      minSeats: this.filters.minSeats || undefined,
      maxPrice: this.filters.maxPrice || undefined,
      category: this.filters.category || undefined,
      page: this.currentPage,
      pageSize: this.pageSize
    }).subscribe({
      next: res => {
        this.flights = res.items || [];
        this.totalCount = res.totalCount || 0;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private async updateSearchUrl(): Promise<void> {
    const params: any = {};
    if (this.filters.origin) params['origin'] = this.filters.origin;
    if (this.filters.destination) params['destination'] = this.filters.destination;
    if (this.filters.minSeats) params['minSeats'] = this.filters.minSeats;
    if (this.filters.maxPrice) params['maxPrice'] = this.filters.maxPrice;
    if (this.filters.category) params['category'] = this.filters.category;

    if (Object.keys(params).length > 0) {
      const encrypted = await this.cryptoService.encrypt(params);
      this.router.navigate([], {
        queryParams: { q: encrypted },
        replaceUrl: true,
        relativeTo: this.route
      });
    } else {
      this.router.navigate([], { queryParams: {}, replaceUrl: true, relativeTo: this.route });
    }
  }

  resetFilters(): void {
    this.originCtrl.setValue('', {emitEvent: false});
    this.destCtrl.setValue('', {emitEvent: false});
    this.filters = { origin: '', destination: '', minSeats: null, maxPrice: null, category: '' };
    this.currentPage = 1;
    this.search();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.search();
  }

  toggleFav(flight: EmptyLegDto): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.flightService.toggleFavorite(flight.id).subscribe({
      next: () => { flight.isFavorite = !flight.isFavorite; },
      error: () => {}
    });
  }

  bookFlight(flight: EmptyLegDto): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.router.navigate(['/booking', flight.id]);
  }

  getDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.filterChange$.complete();
  }
}
