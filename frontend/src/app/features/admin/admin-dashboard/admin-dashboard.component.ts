import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { AdminService } from '../../../core/services/admin.service';
import { AdminDashboardDto, OperatorListDto, BookingDto, CouponDto, CreateCouponRequest } from '../../../core/models/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatTabsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSlideToggleModule, MatProgressSpinnerModule, MatSnackBarModule, MatDividerModule
  ],
  template: `
    <div class="dashboard-layout">
      <!-- Sidebar -->
      <div class="sidebar">
        <div class="sidebar-header">
          <h3>Admin Panel</h3>
          <p>Platform Management</p>
        </div>
        <div class="sidebar-item" *ngFor="let item of navItems" (click)="activeSection = item.key" [class.active]="activeSection === item.key">
          <mat-icon>{{item.icon}}</mat-icon> {{item.label}}
        </div>
      </div>

      <div class="sidebar-content">

        <!-- OVERVIEW -->
        <div *ngIf="activeSection === 'overview'">
          <h2 class="page-title">Platform Overview</h2>
          <div *ngIf="isLoadingDash" class="loading-spinner"><mat-spinner diameter="40"></mat-spinner></div>
          <div *ngIf="!isLoadingDash && dashboard" class="stats-grid">
            <div class="stat-card"><mat-icon class="stat-icon">business</mat-icon><div class="stat-value">{{dashboard.totalOperators}}</div><div class="stat-label">Operators</div></div>
            <div class="stat-card"><mat-icon class="stat-icon">flight</mat-icon><div class="stat-value">{{dashboard.totalJets}}</div><div class="stat-label">Total Jets</div></div>
            <div class="stat-card"><mat-icon class="stat-icon">people</mat-icon><div class="stat-value">{{dashboard.totalUsers}}</div><div class="stat-label">Users</div></div>
            <div class="stat-card"><mat-icon class="stat-icon">book_online</mat-icon><div class="stat-value">{{dashboard.totalBookings}}</div><div class="stat-label">Bookings</div></div>
            <div class="stat-card"><mat-icon class="stat-icon">flight_takeoff</mat-icon><div class="stat-value">{{dashboard.activeEmptyLegs}}</div><div class="stat-label">Active Legs</div></div>
            <div class="stat-card"><mat-icon class="stat-icon">lock</mat-icon><div class="stat-value">{{dashboard.blockedEmptyLegs}}</div><div class="stat-label">Blocked Legs</div></div>
            <div class="stat-card"><mat-icon class="stat-icon">payments</mat-icon><div class="stat-value">₹{{(dashboard.totalRevenue || 0) | number:'1.0-0'}}</div><div class="stat-label">Total Revenue</div></div>
            <div class="stat-card"><mat-icon class="stat-icon">trending_up</mat-icon><div class="stat-value">₹{{(dashboard.monthlyRevenue || 0) | number:'1.0-0'}}</div><div class="stat-label">Monthly Revenue</div></div>
          </div>
          <div *ngIf="!isLoadingDash && dashboard?.recentBookings?.length" class="mat-table-container">
            <h3 style="padding:16px;margin:0;color:#1B2A5C">Recent Bookings</h3>
            <table mat-table [dataSource]="dashboard!.recentBookings">
              <ng-container matColumnDef="ref"><th mat-header-cell *matHeaderCellDef>Ref</th><td mat-cell *matCellDef="let b">{{b.bookingRef}}</td></ng-container>
              <ng-container matColumnDef="operator"><th mat-header-cell *matHeaderCellDef>Operator</th><td mat-cell *matCellDef="let b">{{b.operatorName}}</td></ng-container>
              <ng-container matColumnDef="route"><th mat-header-cell *matHeaderCellDef>Route</th><td mat-cell *matCellDef="let b">{{b.origin}} → {{b.destination}}</td></ng-container>
              <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let b"><span class="status-badge" [ngClass]="'status-' + b.status.toLowerCase()">{{b.status}}</span></td></ng-container>
              <ng-container matColumnDef="amount"><th mat-header-cell *matHeaderCellDef>Amount</th><td mat-cell *matCellDef="let b">₹{{b.totalAmount | number:'1.0-0'}}</td></ng-container>
              <tr mat-header-row *matHeaderRowDef="['ref','operator','route','status','amount']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['ref','operator','route','status','amount'];"></tr>
            </table>
          </div>
        </div>

        <!-- OPERATORS -->
        <div *ngIf="activeSection === 'operators'">
          <h2 class="page-title">Operators</h2>
          <div *ngIf="isLoadingOps" class="loading-spinner"><mat-spinner diameter="40"></mat-spinner></div>
          <div class="mat-table-container" *ngIf="!isLoadingOps">
            <table mat-table [dataSource]="operators">
              <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let o"><strong>{{o.name}}</strong></td></ng-container>
              <ng-container matColumnDef="location"><th mat-header-cell *matHeaderCellDef>Location</th><td mat-cell *matCellDef="let o">{{o.city}}, {{o.country}}</td></ng-container>
              <ng-container matColumnDef="jets"><th mat-header-cell *matHeaderCellDef>Jets</th><td mat-cell *matCellDef="let o">{{o.totalJets}}</td></ng-container>
              <ng-container matColumnDef="bookings"><th mat-header-cell *matHeaderCellDef>Bookings</th><td mat-cell *matCellDef="let o">{{o.totalBookings}}</td></ng-container>
              <ng-container matColumnDef="revenue"><th mat-header-cell *matHeaderCellDef>Revenue</th><td mat-cell *matCellDef="let o">₹{{o.revenue | number:'1.0-0'}}</td></ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let o">
                  <span class="status-badge" [ngClass]="o.isActive ? 'status-available' : 'status-blocked'">{{o.isActive ? 'Active' : 'Inactive'}}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="toggle">
                <th mat-header-cell *matHeaderCellDef>Toggle</th>
                <td mat-cell *matCellDef="let o">
                  <mat-slide-toggle [checked]="o.isActive" color="primary" (change)="toggleOperator(o)"></mat-slide-toggle>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="opColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: opColumns;"></tr>
            </table>
          </div>
        </div>

        <!-- ALL BOOKINGS -->
        <div *ngIf="activeSection === 'bookings'">
          <div class="section-header">
            <h2 class="page-title">All Bookings</h2>
            <mat-form-field appearance="outline" style="min-width:160px">
              <mat-label>Filter Status</mat-label>
              <mat-select [(ngModel)]="bookingFilter" (ngModelChange)="applyFilter()">
                <mat-option value="">All</mat-option>
                <mat-option value="Confirmed">Confirmed</mat-option>
                <mat-option value="Pending">Pending</mat-option>
                <mat-option value="Cancelled">Cancelled</mat-option>
                <mat-option value="Completed">Completed</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div *ngIf="isLoadingBookings" class="loading-spinner"><mat-spinner diameter="40"></mat-spinner></div>
          <div class="mat-table-container" *ngIf="!isLoadingBookings">
            <table mat-table [dataSource]="filteredBookings">
              <ng-container matColumnDef="ref"><th mat-header-cell *matHeaderCellDef>Ref</th><td mat-cell *matCellDef="let b"><strong>{{b.bookingRef}}</strong></td></ng-container>
              <ng-container matColumnDef="operator"><th mat-header-cell *matHeaderCellDef>Operator</th><td mat-cell *matCellDef="let b">{{b.operatorName}}</td></ng-container>
              <ng-container matColumnDef="route"><th mat-header-cell *matHeaderCellDef>Route</th><td mat-cell *matCellDef="let b">{{b.origin}} → {{b.destination}}</td></ng-container>
              <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let b">{{b.departureUtc | date:'MMM d, y'}}</td></ng-container>
              <ng-container matColumnDef="pax"><th mat-header-cell *matHeaderCellDef>Pax</th><td mat-cell *matCellDef="let b">{{b.passengerCount}}</td></ng-container>
              <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let b"><span class="status-badge" [ngClass]="'status-' + b.status.toLowerCase()">{{b.status}}</span></td></ng-container>
              <ng-container matColumnDef="amount"><th mat-header-cell *matHeaderCellDef>Amount</th><td mat-cell *matCellDef="let b">₹{{b.totalAmount | number:'1.0-0'}}</td></ng-container>
              <tr mat-header-row *matHeaderRowDef="bookingColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: bookingColumns;"></tr>
            </table>
            <p style="padding:12px 16px;font-size:13px;color:#999">Export functionality available via API</p>
          </div>
        </div>

        <!-- COUPONS -->
        <div *ngIf="activeSection === 'coupons'">
          <div class="section-header">
            <h2 class="page-title">Coupons</h2>
            <button mat-raised-button color="primary" (click)="showCouponForm = !showCouponForm">
              <mat-icon>add</mat-icon> Create Coupon
            </button>
          </div>
          <!-- Create Coupon Form -->
          <mat-card *ngIf="showCouponForm" class="coupon-form-card">
            <mat-card-header><mat-card-title>Create New Coupon</mat-card-title></mat-card-header>
            <mat-card-content>
              <form [formGroup]="couponForm" class="coupon-form">
                <div class="form-row2">
                  <mat-form-field appearance="outline"><mat-label>Coupon Code</mat-label><input matInput formControlName="code"></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Description</mat-label><input matInput formControlName="description"></mat-form-field>
                </div>
                <div class="form-row3">
                  <mat-form-field appearance="outline">
                    <mat-label>Discount Type</mat-label>
                    <mat-select formControlName="discountType">
                      <mat-option value="Percentage">Percentage</mat-option>
                      <mat-option value="Fixed">Fixed Amount</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Discount Value</mat-label><input matInput type="number" formControlName="discountValue"></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Max Uses</mat-label><input matInput type="number" formControlName="maxUses"></mat-form-field>
                </div>
                <div class="form-row2">
                  <mat-form-field appearance="outline"><mat-label>Expiry Date</mat-label><input matInput formControlName="expiryDate" placeholder="2026-12-31"></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Min Booking (₹)</mat-label><input matInput type="number" formControlName="minBookingAmount"></mat-form-field>
                </div>
                <div class="coupon-actions">
                  <button mat-button (click)="showCouponForm = false">Cancel</button>
                  <button mat-raised-button color="primary" (click)="createCoupon()" [disabled]="couponForm.invalid || isSavingCoupon">
                    <mat-spinner *ngIf="isSavingCoupon" diameter="20"></mat-spinner>
                    <span *ngIf="!isSavingCoupon">Create</span>
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
          <div *ngIf="isLoadingCoupons" class="loading-spinner"><mat-spinner diameter="40"></mat-spinner></div>
          <div class="mat-table-container" *ngIf="!isLoadingCoupons" style="margin-top:16px">
            <table mat-table [dataSource]="coupons">
              <ng-container matColumnDef="code"><th mat-header-cell *matHeaderCellDef>Code</th><td mat-cell *matCellDef="let c"><strong>{{c.code}}</strong></td></ng-container>
              <ng-container matColumnDef="type"><th mat-header-cell *matHeaderCellDef>Type</th><td mat-cell *matCellDef="let c">{{c.discountType}}</td></ng-container>
              <ng-container matColumnDef="value"><th mat-header-cell *matHeaderCellDef>Value</th><td mat-cell *matCellDef="let c">{{c.discountType === 'Percentage' ? c.discountValue + '%' : '₹' + (c.discountValue | number:'1.0-0')}}</td></ng-container>
              <ng-container matColumnDef="uses"><th mat-header-cell *matHeaderCellDef>Uses</th><td mat-cell *matCellDef="let c">{{c.currentUses}} / {{c.maxUses}}</td></ng-container>
              <ng-container matColumnDef="expiry"><th mat-header-cell *matHeaderCellDef>Expiry</th><td mat-cell *matCellDef="let c">{{c.expiryDate | date:'MMM d, y'}}</td></ng-container>
              <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let c"><span class="status-badge" [ngClass]="c.isActive ? 'status-available' : 'status-blocked'">{{c.isActive ? 'Active' : 'Inactive'}}</span></td></ng-container>
              <tr mat-header-row *matHeaderRowDef="couponColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: couponColumns;"></tr>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); text-align: center; }
    .stat-value { font-size: 26px; font-weight: 700; color: #1B2A5C; }
    .stat-label { font-size: 12px; color: #666; margin-top: 4px; }
    .stat-icon { color: #1B2A5C; opacity: 0.2; font-size: 32px; width: 32px; height: 32px; display: block; margin: 0 auto 8px; }
    .mat-table-container { overflow-x: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    table { width: 100%; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .page-title { font-size: 22px; font-weight: 700; color: #1B2A5C; margin-bottom: 20px; }
    .coupon-form-card { border-radius: 12px !important; margin-bottom: 16px; }
    .coupon-form { }
    .form-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 4px; }
    .form-row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 4px; }
    .coupon-actions { display: flex; gap: 12px; margin-top: 8px; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  activeSection = 'overview';
  dashboard: AdminDashboardDto | null = null;
  operators: OperatorListDto[] = [];
  bookings: BookingDto[] = [];
  filteredBookings: BookingDto[] = [];
  coupons: CouponDto[] = [];
  isLoadingDash = false;
  isLoadingOps = false;
  isLoadingBookings = false;
  isLoadingCoupons = false;
  isSavingCoupon = false;
  showCouponForm = false;
  bookingFilter = '';

  navItems = [
    { key: 'overview', icon: 'dashboard', label: 'Overview' },
    { key: 'operators', icon: 'business', label: 'Operators' },
    { key: 'bookings', icon: 'book_online', label: 'All Bookings' },
    { key: 'coupons', icon: 'local_offer', label: 'Coupons' }
  ];

  opColumns = ['name', 'location', 'jets', 'bookings', 'revenue', 'status', 'toggle'];
  bookingColumns = ['ref', 'operator', 'route', 'date', 'pax', 'status', 'amount'];
  couponColumns = ['code', 'type', 'value', 'uses', 'expiry', 'status'];

  couponForm = this.fb.group({
    code: ['', Validators.required],
    description: ['', Validators.required],
    discountType: ['Percentage', Validators.required],
    discountValue: [10, Validators.required],
    maxUses: [100, Validators.required],
    expiryDate: ['', Validators.required],
    minBookingAmount: [null as number | null],
    maxDiscountAmount: [null as number | null]
  });

  ngOnInit(): void {
    this.loadDashboard();
    this.loadOperators();
    this.loadBookings();
    this.loadCoupons();
  }

  loadDashboard(): void {
    this.isLoadingDash = true;
    this.adminService.getDashboard().subscribe({ next: d => { this.dashboard = d; this.isLoadingDash = false; }, error: () => { this.isLoadingDash = false; } });
  }
  loadOperators(): void {
    this.isLoadingOps = true;
    this.adminService.getOperators().subscribe({ next: o => { this.operators = o; this.isLoadingOps = false; }, error: () => { this.isLoadingOps = false; } });
  }
  loadBookings(): void {
    this.isLoadingBookings = true;
    this.adminService.getAllBookings().subscribe({ next: b => { this.bookings = b; this.filteredBookings = b; this.isLoadingBookings = false; }, error: () => { this.isLoadingBookings = false; } });
  }
  loadCoupons(): void {
    this.isLoadingCoupons = true;
    this.adminService.getCoupons().subscribe({ next: c => { this.coupons = c; this.isLoadingCoupons = false; }, error: () => { this.isLoadingCoupons = false; } });
  }

  toggleOperator(op: OperatorListDto): void {
    this.adminService.toggleOperator(op.id).subscribe({
      next: () => { op.isActive = !op.isActive; this.snackBar.open(`Operator ${op.isActive ? 'activated' : 'deactivated'}`, 'Close', { duration: 3000 }); }
    });
  }

  applyFilter(): void {
    this.filteredBookings = this.bookingFilter
      ? this.bookings.filter(b => b.status === this.bookingFilter)
      : this.bookings;
  }

  createCoupon(): void {
    if (this.couponForm.invalid) return;
    this.isSavingCoupon = true;
    const v = this.couponForm.value as CreateCouponRequest;
    this.adminService.createCoupon(v).subscribe({
      next: c => {
        this.coupons = [c, ...this.coupons];
        this.isSavingCoupon = false;
        this.showCouponForm = false;
        this.couponForm.reset({ discountType: 'Percentage', discountValue: 10, maxUses: 100 });
        this.snackBar.open('Coupon created!', 'Close', { duration: 3000 });
      },
      error: err => { this.isSavingCoupon = false; this.snackBar.open(err?.error?.message || 'Failed', 'Close', { duration: 3000 }); }
    });
  }
}
