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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { OperatorService } from '../../../core/services/operator.service';
import { JetDto, EmptyLegDto, BookingDto, OperatorDashboardDto, CreateJetRequest, CreateEmptyLegRequest } from '../../../core/models/models';

@Component({
  selector: 'app-operator-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatTabsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDividerModule, MatChipsModule
  ],
  template: `
    <div class="dashboard-layout">
      <!-- Sidebar -->
      <div class="sidebar">
        <div class="sidebar-header">
          <h3>Operator Panel</h3>
          <p>Manage your fleet &amp; flights</p>
        </div>
        <div class="sidebar-item" *ngFor="let item of navItems"
             (click)="activeSection = item.key; clearDetail()"
             [class.active]="activeSection === item.key">
          <mat-icon>{{item.icon}}</mat-icon>
          <span>{{item.label}}</span>
        </div>
      </div>

      <div class="sidebar-content">

        <!-- ── OVERVIEW ────────────────────────────────────────────────────── -->
        <div *ngIf="activeSection === 'overview'">
          <h2 class="page-title">Operator Overview</h2>
          <div *ngIf="isLoadingDash" class="loading-spinner"><mat-spinner diameter="40"></mat-spinner></div>
          <div *ngIf="!isLoadingDash && dashboard" class="stats-grid">
            <div class="stat-card">
              <mat-icon class="stat-icon">flight</mat-icon>
              <div class="stat-value">{{dashboard.totalJets}}</div>
              <div class="stat-label">Total Jets</div>
            </div>
            <div class="stat-card">
              <mat-icon class="stat-icon">flight_takeoff</mat-icon>
              <div class="stat-value">{{dashboard.activeEmptyLegs}}</div>
              <div class="stat-label">Active Legs</div>
            </div>
            <div class="stat-card">
              <mat-icon class="stat-icon">book_online</mat-icon>
              <div class="stat-value">{{dashboard.totalBookings}}</div>
              <div class="stat-label">Bookings</div>
            </div>
            <div class="stat-card">
              <mat-icon class="stat-icon">pending_actions</mat-icon>
              <div class="stat-value">{{dashboard.pendingConfirmations}}</div>
              <div class="stat-label">Pending</div>
            </div>
            <div class="stat-card">
              <mat-icon class="stat-icon">payments</mat-icon>
              <div class="stat-value">₹{{(dashboard.totalRevenue || 0) | number:'1.0-0'}}</div>
              <div class="stat-label">Revenue</div>
            </div>
          </div>

          <div *ngIf="!isLoadingDash && dashboard?.recentBookings?.length" style="margin-top:24px">
            <h3 style="color:#1a237e;margin-bottom:12px">Recent Bookings</h3>
            <div class="table-wrap">
              <table mat-table [dataSource]="dashboard!.recentBookings" class="full-table">
                <ng-container matColumnDef="ref"><th mat-header-cell *matHeaderCellDef>Ref</th><td mat-cell *matCellDef="let b">{{b.bookingRef}}</td></ng-container>
                <ng-container matColumnDef="route"><th mat-header-cell *matHeaderCellDef>Route</th><td mat-cell *matCellDef="let b">{{b.origin}} → {{b.destination}}</td></ng-container>
                <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let b">{{b.departureUtc | date:'MMM d'}}</td></ng-container>
                <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let b"><span class="status-badge" [ngClass]="'status-' + b.status.toLowerCase()">{{b.status}}</span></td></ng-container>
                <ng-container matColumnDef="amount"><th mat-header-cell *matHeaderCellDef>Amount</th><td mat-cell *matCellDef="let b">₹{{b.totalAmount | number:'1.0-0'}}</td></ng-container>
                <tr mat-header-row *matHeaderRowDef="['ref','route','date','status','amount']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['ref','route','date','status','amount'];"></tr>
              </table>
            </div>
          </div>
        </div>

        <!-- ── MY JETS ──────────────────────────────────────────────────────── -->
        <div *ngIf="activeSection === 'jets'">
          <div class="section-header">
            <h2 class="page-title">My Jets</h2>
            <button mat-raised-button color="primary" (click)="openJetDialog(null)">
              <mat-icon>add</mat-icon> Add Jet
            </button>
          </div>
          <div *ngIf="isLoadingJets" class="loading-spinner"><mat-spinner diameter="40"></mat-spinner></div>
          <div class="table-wrap" *ngIf="!isLoadingJets">
            <table mat-table [dataSource]="jets" class="full-table">
              <ng-container matColumnDef="model">
                <th mat-header-cell *matHeaderCellDef>Model</th>
                <td mat-cell *matCellDef="let j">{{j.manufacturer}} {{j.modelName}}</td>
              </ng-container>
              <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef>Category</th>
                <td mat-cell *matCellDef="let j">{{j.category}}</td>
              </ng-container>
              <ng-container matColumnDef="tail">
                <th mat-header-cell *matHeaderCellDef>Tail #</th>
                <td mat-cell *matCellDef="let j">{{j.tailNumber}}</td>
              </ng-container>
              <ng-container matColumnDef="seats">
                <th mat-header-cell *matHeaderCellDef>Seats</th>
                <td mat-cell *matCellDef="let j">{{j.seatingCapacity}}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let j">
                  <span class="status-badge" [ngClass]="'status-' + (j.status || 'active').toLowerCase()">{{j.status}}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="confirm">
                <th mat-header-cell *matHeaderCellDef>Mode</th>
                <td mat-cell *matCellDef="let j">
                  <span class="confirm-badge" [ngClass]="j.confirmationMode === 'Instant' ? 'confirm-instant' : 'confirm-approval'">
                    {{j.confirmationMode}}
                  </span>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let j">
                  <button mat-icon-button color="primary" (click)="openJetDialog(j)" title="Edit">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteJet(j)" title="Deactivate">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="jetColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: jetColumns;"></tr>
            </table>
            <div *ngIf="jets.length === 0" class="empty-state">No jets found.</div>
          </div>
        </div>

        <!-- ── EMPTY LEGS ───────────────────────────────────────────────────── -->
        <div *ngIf="activeSection === 'emptylegs'">
          <div class="section-header">
            <h2 class="page-title">Empty Legs</h2>
            <button mat-raised-button color="primary" (click)="openLegDialog()">
              <mat-icon>add</mat-icon> Add Empty Leg
            </button>
          </div>
          <div *ngIf="isLoadingLegs" class="loading-spinner"><mat-spinner diameter="40"></mat-spinner></div>
          <div class="table-wrap" *ngIf="!isLoadingLegs">
            <table mat-table [dataSource]="legs" class="full-table">
              <ng-container matColumnDef="route">
                <th mat-header-cell *matHeaderCellDef>Route</th>
                <td mat-cell *matCellDef="let l">{{l.originCode}} → {{l.destinationCode}}</td>
              </ng-container>
              <ng-container matColumnDef="departure">
                <th mat-header-cell *matHeaderCellDef>Departure</th>
                <td mat-cell *matCellDef="let l">{{l.departureUtc | date:'MMM d, h:mm a'}}</td>
              </ng-container>
              <ng-container matColumnDef="seats">
                <th mat-header-cell *matHeaderCellDef>Seats</th>
                <td mat-cell *matCellDef="let l">{{l.availableSeats}}</td>
              </ng-container>
              <ng-container matColumnDef="price">
                <th mat-header-cell *matHeaderCellDef>Price</th>
                <td mat-cell *matCellDef="let l">₹{{l.price | number:'1.0-0'}}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let l">
                  <span class="status-badge" [ngClass]="'status-' + l.status.toLowerCase()">{{l.status}}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let l">
                  <button mat-icon-button color="warn" (click)="deleteLeg(l.id)" title="Cancel">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="legColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: legColumns;"></tr>
            </table>
            <div *ngIf="legs.length === 0" class="empty-state">No empty legs found.</div>
          </div>
        </div>

        <!-- ── BOOKINGS ─────────────────────────────────────────────────────── -->
        <div *ngIf="activeSection === 'bookings'">
          <h2 class="page-title">Bookings</h2>
          <div *ngIf="isLoadingBookings" class="loading-spinner"><mat-spinner diameter="40"></mat-spinner></div>
          <mat-tab-group *ngIf="!isLoadingBookings" animationDuration="200ms">

            <!-- Pending Confirmation -->
            <mat-tab label="Pending Confirmation">
              <div class="table-wrap" style="margin-top:16px">
                <table mat-table [dataSource]="pendingBookings" class="full-table">
                  <ng-container matColumnDef="ref"><th mat-header-cell *matHeaderCellDef>Ref</th><td mat-cell *matCellDef="let b">{{b.bookingRef}}</td></ng-container>
                  <ng-container matColumnDef="route"><th mat-header-cell *matHeaderCellDef>Route</th><td mat-cell *matCellDef="let b">{{b.origin}} → {{b.destination}}</td></ng-container>
                  <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let b">{{b.departureUtc | date:'MMM d, y'}}</td></ng-container>
                  <ng-container matColumnDef="pax"><th mat-header-cell *matHeaderCellDef>Pax</th><td mat-cell *matCellDef="let b">{{b.passengerCount}}</td></ng-container>
                  <ng-container matColumnDef="amount"><th mat-header-cell *matHeaderCellDef>Amount</th><td mat-cell *matCellDef="let b">₹{{b.totalAmount | number:'1.0-0'}}</td></ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let b">
                      <button mat-raised-button color="primary" (click)="confirmBooking(b.id)" style="margin-right:8px">
                        <mat-icon>check</mat-icon> Confirm
                      </button>
                      <button mat-raised-button color="warn" (click)="promptReject(b.id)">
                        <mat-icon>close</mat-icon> Reject
                      </button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="['ref','route','date','pax','amount','actions']"></tr>
                  <tr mat-row *matRowDef="let row; columns: ['ref','route','date','pax','amount','actions'];"></tr>
                </table>
                <div *ngIf="pendingBookings.length === 0" class="empty-state">No pending confirmations</div>
              </div>
            </mat-tab>

            <!-- All Bookings -->
            <mat-tab label="All Bookings">
              <div class="table-wrap" style="margin-top:16px">
                <table mat-table [dataSource]="bookings" class="full-table">
                  <ng-container matColumnDef="ref"><th mat-header-cell *matHeaderCellDef>Ref</th><td mat-cell *matCellDef="let b">{{b.bookingRef}}</td></ng-container>
                  <ng-container matColumnDef="route"><th mat-header-cell *matHeaderCellDef>Route</th><td mat-cell *matCellDef="let b">{{b.origin}} → {{b.destination}}</td></ng-container>
                  <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let b">{{b.departureUtc | date:'MMM d, y'}}</td></ng-container>
                  <ng-container matColumnDef="pax"><th mat-header-cell *matHeaderCellDef>Pax</th><td mat-cell *matCellDef="let b">{{b.passengerCount}}</td></ng-container>
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let b">
                      <span class="status-badge" [ngClass]="'status-' + b.status.toLowerCase()">{{b.status}}</span>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="amount"><th mat-header-cell *matHeaderCellDef>Amount</th><td mat-cell *matCellDef="let b">₹{{b.totalAmount | number:'1.0-0'}}</td></ng-container>
                  <ng-container matColumnDef="detail">
                    <th mat-header-cell *matHeaderCellDef></th>
                    <td mat-cell *matCellDef="let b">
                      <button mat-icon-button color="primary" (click)="viewBooking(b)" title="View Details">
                        <mat-icon>visibility</mat-icon>
                      </button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="['ref','route','date','pax','status','amount','detail']"></tr>
                  <tr mat-row *matRowDef="let row; columns: ['ref','route','date','pax','status','amount','detail'];"></tr>
                </table>
                <div *ngIf="bookings.length === 0" class="empty-state">No bookings yet</div>
              </div>

              <!-- Booking Detail Panel -->
              <div *ngIf="selectedBooking" class="booking-detail-panel">
                <div class="detail-header">
                  <h3>Booking Details — {{selectedBooking.bookingRef}}</h3>
                  <button mat-icon-button (click)="selectedBooking = null"><mat-icon>close</mat-icon></button>
                </div>
                <div class="detail-grid">
                  <div class="detail-row"><span class="detail-label">Route</span><span>{{selectedBooking.origin}} → {{selectedBooking.destination}}</span></div>
                  <div class="detail-row"><span class="detail-label">Jet</span><span>{{selectedBooking.jetModel}}</span></div>
                  <div class="detail-row"><span class="detail-label">Departure</span><span>{{selectedBooking.departureUtc | date:'MMM d, y, h:mm a'}}</span></div>
                  <div class="detail-row"><span class="detail-label">Status</span><span class="status-badge" [ngClass]="'status-' + selectedBooking.status.toLowerCase()">{{selectedBooking.status}}</span></div>
                  <div class="detail-row"><span class="detail-label">Base Amount</span><span>₹{{selectedBooking.baseAmount | number:'1.0-0'}}</span></div>
                  <div class="detail-row"><span class="detail-label">Tax</span><span>₹{{selectedBooking.taxAmount | number:'1.0-0'}}</span></div>
                  <div class="detail-row total-row"><span class="detail-label">Total</span><span>₹{{selectedBooking.totalAmount | number:'1.0-0'}}</span></div>
                </div>
                <div *ngIf="selectedBooking.passengers?.length" style="margin-top:16px">
                  <h4 style="color:#1a237e;margin-bottom:8px">Passengers</h4>
                  <table mat-table [dataSource]="selectedBooking.passengers" class="full-table">
                    <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let p">{{p.firstName}} {{p.lastName}}</td></ng-container>
                    <ng-container matColumnDef="passport"><th mat-header-cell *matHeaderCellDef>Passport</th><td mat-cell *matCellDef="let p">{{p.passportNumber}}</td></ng-container>
                    <ng-container matColumnDef="nationality"><th mat-header-cell *matHeaderCellDef>Nationality</th><td mat-cell *matCellDef="let p">{{p.nationality}}</td></ng-container>
                    <ng-container matColumnDef="dob"><th mat-header-cell *matHeaderCellDef>DOB</th><td mat-cell *matCellDef="let p">{{p.dateOfBirth | date:'MMM d, y'}}</td></ng-container>
                    <tr mat-header-row *matHeaderRowDef="['name','passport','nationality','dob']"></tr>
                    <tr mat-row *matRowDef="let row; columns: ['name','passport','nationality','dob'];"></tr>
                  </table>
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </div>

        <!-- ── JET FORM DIALOG ──────────────────────────────────────────────── -->
        <div *ngIf="showJetForm" class="dialog-overlay" (click)="closeJetForm()">
          <mat-card class="dialog-card" (click)="$event.stopPropagation()">
            <mat-card-header>
              <mat-card-title>{{editingJet ? 'Edit Jet' : 'Add New Jet'}}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="jetForm" class="jet-form">
                <div class="form-row2">
                  <mat-form-field appearance="outline">
                    <mat-label>Manufacturer</mat-label>
                    <input matInput formControlName="manufacturer">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Model Name</mat-label>
                    <input matInput formControlName="modelName">
                  </mat-form-field>
                </div>
                <div class="form-row2">
                  <mat-form-field appearance="outline">
                    <mat-label>Category</mat-label>
                    <mat-select formControlName="category">
                      <mat-option *ngFor="let c of categories" [value]="c">{{c}}</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Tail Number</mat-label>
                    <input matInput formControlName="tailNumber">
                  </mat-form-field>
                </div>
                <div class="form-row3">
                  <mat-form-field appearance="outline">
                    <mat-label>Year</mat-label>
                    <input matInput type="number" formControlName="yearOfManufacture">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Seats</mat-label>
                    <input matInput type="number" formControlName="seatingCapacity">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Base Price (₹)</mat-label>
                    <input matInput type="number" formControlName="basePrice">
                  </mat-form-field>
                </div>
                <div class="form-row3">
                  <mat-form-field appearance="outline">
                    <mat-label>Range (km)</mat-label>
                    <input matInput type="number" formControlName="rangeKm">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Speed (km/h)</mat-label>
                    <input matInput type="number" formControlName="speedKmh">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Confirmation</mat-label>
                    <mat-select formControlName="confirmationMode">
                      <mat-option value="Instant">Instant</mat-option>
                      <mat-option value="ManualApproval">Manual Approval</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Description</mat-label>
                  <textarea matInput formControlName="description" rows="2"></textarea>
                </mat-form-field>
                <div class="toggles-row">
                  <mat-checkbox formControlName="hasWifi" color="primary">WiFi</mat-checkbox>
                  <mat-checkbox formControlName="hasCatering" color="primary">Catering</mat-checkbox>
                  <mat-checkbox formControlName="hasBedroom" color="primary">Bedroom</mat-checkbox>
                </div>
              </form>
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-button (click)="closeJetForm()">Cancel</button>
              <button mat-raised-button color="primary" (click)="saveJet()" [disabled]="jetForm.invalid || isSavingJet">
                <mat-spinner *ngIf="isSavingJet" diameter="18" style="display:inline-block;margin-right:6px"></mat-spinner>
                {{editingJet ? 'Update' : 'Create'}}
              </button>
            </mat-card-actions>
          </mat-card>
        </div>

        <!-- ── LEG FORM DIALOG ──────────────────────────────────────────────── -->
        <div *ngIf="showLegForm" class="dialog-overlay" (click)="closeLegForm()">
          <mat-card class="dialog-card" (click)="$event.stopPropagation()">
            <mat-card-header><mat-card-title>Add Empty Leg</mat-card-title></mat-card-header>
            <mat-card-content>
              <form [formGroup]="legForm" class="jet-form">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Jet</mat-label>
                  <mat-select formControlName="jetId">
                    <mat-option *ngFor="let j of jets" [value]="j.id">
                      {{j.manufacturer}} {{j.modelName}} ({{j.tailNumber}})
                    </mat-option>
                  </mat-select>
                </mat-form-field>
                <div class="form-row2">
                  <mat-form-field appearance="outline">
                    <mat-label>Origin City</mat-label>
                    <input matInput formControlName="origin">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Origin Code (IATA)</mat-label>
                    <input matInput formControlName="originCode" maxlength="4" style="text-transform:uppercase">
                  </mat-form-field>
                </div>
                <div class="form-row2">
                  <mat-form-field appearance="outline">
                    <mat-label>Destination City</mat-label>
                    <input matInput formControlName="destination">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Dest Code (IATA)</mat-label>
                    <input matInput formControlName="destinationCode" maxlength="4" style="text-transform:uppercase">
                  </mat-form-field>
                </div>
                <div class="form-row2">
                  <mat-form-field appearance="outline">
                    <mat-label>Departure (local date/time)</mat-label>
                    <input matInput type="datetime-local" formControlName="departureUtc">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Arrival (local date/time)</mat-label>
                    <input matInput type="datetime-local" formControlName="arrivalUtc">
                  </mat-form-field>
                </div>
                <div class="form-row3">
                  <mat-form-field appearance="outline">
                    <mat-label>Seats</mat-label>
                    <input matInput type="number" formControlName="availableSeats">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Price (₹)</mat-label>
                    <input matInput type="number" formControlName="price">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Lock (mins)</mat-label>
                    <input matInput type="number" formControlName="lockDurationMinutes">
                  </mat-form-field>
                </div>
              </form>
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-button (click)="closeLegForm()">Cancel</button>
              <button mat-raised-button color="primary" (click)="saveLeg()" [disabled]="legForm.invalid || isSavingLeg">
                <mat-spinner *ngIf="isSavingLeg" diameter="18" style="display:inline-block;margin-right:6px"></mat-spinner>
                Create
              </button>
            </mat-card-actions>
          </mat-card>
        </div>

      </div><!-- /sidebar-content -->
    </div><!-- /dashboard-layout -->
  `,
  styles: [`
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); text-align: center; }
    .stat-value { font-size: 26px; font-weight: 700; color: #1a237e; }
    .stat-label { font-size: 12px; color: #666; margin-top: 4px; }
    .stat-icon { color: #1a237e; opacity: 0.25; font-size: 32px; width: 32px; height: 32px; display: block; margin: 0 auto 8px; }
    .table-wrap { overflow-x: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); background: white; }
    .full-table { width: 100%; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .page-title { font-size: 22px; font-weight: 700; color: #1a237e; margin-bottom: 16px; }
    .dialog-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; overflow-y: auto; }
    .dialog-card { max-width: 620px; width: 100%; max-height: 92vh; overflow-y: auto; border-radius: 12px !important; }
    .jet-form { padding: 8px 0; }
    .form-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .full-width { width: 100%; }
    .toggles-row { display: flex; gap: 24px; margin-top: 8px; }
    .confirm-badge { padding: 3px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .confirm-instant { color: #1b5e20; background: #c8e6c9; }
    .confirm-approval { color: #0d47a1; background: #bbdefb; }
    .empty-state { padding: 40px; text-align: center; color: #999; font-size: 14px; }
    /* Booking detail panel */
    .booking-detail-panel { background: white; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); padding: 24px; margin-top: 24px; border-left: 4px solid #1a237e; }
    .detail-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .detail-header h3 { font-size: 16px; font-weight: 700; color: #1a237e; }
    .detail-grid { display: grid; gap: 8px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    .detail-label { font-weight: 600; color: #555; }
    .total-row { font-weight: 700; font-size: 16px; color: #1a237e; border-bottom: none; padding-top: 12px; border-top: 2px solid #e0e0e0; }
    mat-form-field { width: 100%; margin-bottom: 4px; }
  `]
})
export class OperatorDashboardComponent implements OnInit {
  private operatorService = inject(OperatorService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  activeSection = 'overview';
  dashboard: OperatorDashboardDto | null = null;
  jets: JetDto[] = [];
  legs: EmptyLegDto[] = [];
  bookings: BookingDto[] = [];
  isLoadingDash = false;
  isLoadingJets = false;
  isLoadingLegs = false;
  isLoadingBookings = false;
  isSavingJet = false;
  isSavingLeg = false;
  showJetForm = false;
  showLegForm = false;
  editingJet: JetDto | null = null;
  selectedBooking: BookingDto | null = null;

  categories = ['VeryLight', 'Light', 'Midsize', 'SuperMidsize', 'Heavy', 'UltraLong'];
  jetColumns = ['model', 'category', 'tail', 'seats', 'status', 'confirm', 'actions'];
  legColumns = ['route', 'departure', 'seats', 'price', 'status', 'actions'];

  navItems = [
    { key: 'overview', icon: 'dashboard', label: 'Overview' },
    { key: 'jets', icon: 'flight', label: 'My Jets' },
    { key: 'emptylegs', icon: 'flight_takeoff', label: 'Empty Legs' },
    { key: 'bookings', icon: 'book_online', label: 'Bookings' }
  ];

  jetForm = this.fb.group({
    manufacturer: ['', Validators.required],
    modelName: ['', Validators.required],
    category: ['', Validators.required],
    tailNumber: ['', Validators.required],
    yearOfManufacture: [2020, Validators.required],
    seatingCapacity: [8, [Validators.required, Validators.min(1)]],
    rangeKm: [4000, [Validators.required, Validators.min(100)]],
    speedKmh: [800, [Validators.required, Validators.min(100)]],
    description: [''],
    basePrice: [100000, [Validators.required, Validators.min(1)]],
    confirmationMode: ['Instant', Validators.required],
    hasWifi: [true],
    hasCatering: [false],
    hasBedroom: [false]
  });

  legForm = this.fb.group({
    jetId: [null as number | null, Validators.required],
    origin: ['', Validators.required],
    originCode: ['', Validators.required],
    destination: ['', Validators.required],
    destinationCode: ['', Validators.required],
    departureUtc: ['', Validators.required],
    arrivalUtc: ['', Validators.required],
    availableSeats: [8, [Validators.required, Validators.min(1)]],
    price: [100000, [Validators.required, Validators.min(1)]],
    lockDurationMinutes: [15, [Validators.required, Validators.min(5)]]
  });

  get pendingBookings(): BookingDto[] {
    return this.bookings.filter(b =>
      b.requiresOperatorConfirmation && b.status === 'PendingConfirmation'
    );
  }

  ngOnInit(): void {
    this.loadDashboard();
    this.loadJets();
    this.loadLegs();
    this.loadBookings();
  }

  loadDashboard(): void {
    this.isLoadingDash = true;
    this.operatorService.getDashboard().subscribe({
      next: d => { this.dashboard = d; this.isLoadingDash = false; },
      error: () => { this.isLoadingDash = false; }
    });
  }

  loadJets(): void {
    this.isLoadingJets = true;
    this.operatorService.getJets().subscribe({
      next: j => { this.jets = j; this.isLoadingJets = false; },
      error: () => { this.isLoadingJets = false; }
    });
  }

  loadLegs(): void {
    this.isLoadingLegs = true;
    this.operatorService.getEmptyLegs().subscribe({
      next: l => { this.legs = l; this.isLoadingLegs = false; },
      error: () => { this.isLoadingLegs = false; }
    });
  }

  loadBookings(): void {
    this.isLoadingBookings = true;
    this.operatorService.getBookings().subscribe({
      next: b => { this.bookings = b; this.isLoadingBookings = false; },
      error: () => { this.isLoadingBookings = false; }
    });
  }

  clearDetail(): void { this.selectedBooking = null; }

  viewBooking(b: BookingDto): void {
    this.selectedBooking = this.selectedBooking?.id === b.id ? null : b;
  }

  openJetDialog(jet: JetDto | null): void {
    this.editingJet = jet;
    if (jet) {
      this.jetForm.patchValue({
        manufacturer: jet.manufacturer, modelName: jet.modelName, category: jet.category,
        tailNumber: jet.tailNumber, yearOfManufacture: jet.yearOfManufacture,
        seatingCapacity: jet.seatingCapacity, rangeKm: jet.rangeKm, speedKmh: jet.speedKmh,
        description: jet.description, basePrice: jet.basePrice,
        confirmationMode: jet.confirmationMode,
        hasWifi: jet.hasWifi, hasCatering: jet.hasCatering, hasBedroom: jet.hasBedroom
      });
    } else {
      this.jetForm.reset({
        yearOfManufacture: 2020, seatingCapacity: 8, rangeKm: 4000, speedKmh: 800,
        basePrice: 100000, confirmationMode: 'Instant', hasWifi: true, hasCatering: false, hasBedroom: false,
        category: 'Light'
      });
    }
    this.showJetForm = true;
  }

  closeJetForm(): void { this.showJetForm = false; this.editingJet = null; }

  saveJet(): void {
    if (this.jetForm.invalid) return;
    this.isSavingJet = true;
    const v = this.jetForm.value as CreateJetRequest;
    const obs = this.editingJet
      ? this.operatorService.updateJet(this.editingJet.id, v)
      : this.operatorService.createJet(v);
    obs.subscribe({
      next: () => {
        this.isSavingJet = false;
        this.closeJetForm();
        this.loadJets();
        this.loadDashboard();
        this.snackBar.open('Jet saved successfully!', 'Close', { duration: 3000 });
      },
      error: err => {
        this.isSavingJet = false;
        this.snackBar.open(err?.error?.message || 'Failed to save jet. Please try again.', 'Close', { duration: 4000 });
      }
    });
  }

  deleteJet(j: JetDto): void {
    if (!confirm(`Deactivate ${j.manufacturer} ${j.modelName}?`)) return;
    this.operatorService.deleteJet(j.id).subscribe({
      next: () => { this.loadJets(); this.snackBar.open('Jet deactivated', 'Close', { duration: 2000 }); },
      error: () => { this.snackBar.open('Failed to deactivate jet', 'Close', { duration: 3000 }); }
    });
  }

  openLegDialog(): void { this.showLegForm = true; this.legForm.reset({ availableSeats: 8, price: 100000, lockDurationMinutes: 15 }); }
  closeLegForm(): void { this.showLegForm = false; }

  saveLeg(): void {
    if (this.legForm.invalid) return;
    this.isSavingLeg = true;
    const raw = this.legForm.value;
    // Convert datetime-local value to ISO string for the API
    const payload: CreateEmptyLegRequest = {
      jetId: raw.jetId!,
      origin: raw.origin!,
      originCode: (raw.originCode || '').toUpperCase(),
      destination: raw.destination!,
      destinationCode: (raw.destinationCode || '').toUpperCase(),
      departureUtc: raw.departureUtc ? new Date(raw.departureUtc).toISOString() : '',
      arrivalUtc: raw.arrivalUtc ? new Date(raw.arrivalUtc).toISOString() : '',
      availableSeats: raw.availableSeats!,
      price: raw.price!,
      lockDurationMinutes: raw.lockDurationMinutes!
    };
    this.operatorService.createEmptyLeg(payload).subscribe({
      next: () => {
        this.isSavingLeg = false;
        this.closeLegForm();
        this.loadLegs();
        this.loadDashboard();
        this.snackBar.open('Empty leg created!', 'Close', { duration: 3000 });
      },
      error: err => {
        this.isSavingLeg = false;
        this.snackBar.open(err?.error?.message || 'Failed to create empty leg. Please try again.', 'Close', { duration: 4000 });
      }
    });
  }

  deleteLeg(id: number): void {
    if (!confirm('Cancel this empty leg?')) return;
    this.operatorService.deleteEmptyLeg(id).subscribe({
      next: () => { this.legs = this.legs.filter(l => l.id !== id); this.snackBar.open('Empty leg cancelled', 'Close', { duration: 2000 }); },
      error: () => { this.snackBar.open('Failed to cancel empty leg', 'Close', { duration: 3000 }); }
    });
  }

  confirmBooking(id: number): void {
    this.operatorService.confirmBooking(id).subscribe({
      next: () => { this.loadBookings(); this.snackBar.open('Booking confirmed!', 'Close', { duration: 3000 }); },
      error: () => { this.snackBar.open('Failed to confirm booking', 'Close', { duration: 3000 }); }
    });
  }

  promptReject(id: number): void {
    const reason = prompt('Enter rejection reason:');
    if (reason !== null) {
      this.operatorService.rejectBooking(id, reason || 'No reason provided').subscribe({
        next: () => { this.loadBookings(); this.snackBar.open('Booking rejected', 'Close', { duration: 3000 }); },
        error: () => { this.snackBar.open('Failed to reject booking', 'Close', { duration: 3000 }); }
      });
    }
  }
}
