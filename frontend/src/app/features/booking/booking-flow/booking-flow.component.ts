import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatSliderModule } from '@angular/material/slider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FlightService } from '../../../core/services/flight.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { EmptyLegDetailDto, BookingLockResponse, PassengerDto } from '../../../core/models/models';

@Component({
  selector: 'app-booking-flow',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    MatStepperModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule,
    MatCheckboxModule, MatProgressSpinnerModule, MatProgressBarModule,
    MatDividerModule, MatSliderModule, MatDialogModule, MatSnackBarModule
  ],
  template: `
    <div class="booking-container">
      <h2 class="page-title"><mat-icon>book_online</mat-icon> Book Your Flight</h2>

      <!-- Lock Timer -->
      <div *ngIf="lockResponse" class="lock-timer" [class.warning]="timerSeconds < 120">
        <mat-icon>lock_clock</mat-icon>
        <div>
          <div class="timer-text">Seat locked for: {{formatTimer(timerSeconds)}}</div>
          <mat-progress-bar mode="determinate" [value]="timerPercent" [color]="timerSeconds < 30 ? 'warn' : timerSeconds < 120 ? 'accent' : 'primary'"></mat-progress-bar>
        </div>
      </div>

      <div *ngIf="isLoadingFlight" class="loading-spinner"><mat-spinner diameter="48"></mat-spinner></div>

      <mat-stepper *ngIf="!isLoadingFlight && flight" #stepper linear orientation="horizontal">

        <!-- STEP 1: Flight Summary -->
        <mat-step label="Flight Summary">
          <div class="step-content">
            <mat-card class="flight-summary-card">
              <mat-card-content>
                <div class="sum-route">
                  <span class="sum-iata">{{flight.originCode}}</span>
                  <mat-icon>flight</mat-icon>
                  <span class="sum-iata">{{flight.destinationCode}}</span>
                </div>
                <div class="sum-cities">{{flight.origin}} → {{flight.destination}}</div>
                <div class="sum-meta">
                  <span><mat-icon>schedule</mat-icon> {{flight.departureUtc | date:'EEE, MMM d, y h:mm a'}}</span>
                  <span><mat-icon>timer</mat-icon> {{getDuration(flight.durationMinutes)}}</span>
                  <span><mat-icon>flight</mat-icon> {{flight.manufacturer}} {{flight.jetModel}}</span>
                  <span><mat-icon>business</mat-icon> {{flight.operatorName}}</span>
                </div>
                <div class="charter-note">
                  <mat-icon>info</mat-icon>
                  <span>You are chartering the <strong>entire aircraft</strong>. This is a private charter — you pay for the full flight.</span>
                </div>
                <div class="passengers-input">
                  <label>Number of Passengers (for manifest):</label>
                  <div class="seat-btns">
                    <button mat-mini-fab (click)="adjustPassengers(-1)" [disabled]="passengerCount <= 1" type="button">
                      <mat-icon>remove</mat-icon>
                    </button>
                    <span class="seat-count">{{passengerCount}}</span>
                    <button mat-mini-fab (click)="adjustPassengers(1)" [disabled]="passengerCount >= (flight.seatingCapacity || 8)" type="button">
                      <mat-icon>add</mat-icon>
                    </button>
                  </div>
                  <span class="seat-avail">Max {{flight.seatingCapacity || 8}} passengers</span>
                </div>
                <div class="charter-price">
                  <div class="price-row"><span>Charter Price</span><span>₹{{flight.price | number:'1.0-0'}}</span></div>
                  <div class="price-row"><span>GST (18%)</span><span>₹{{flight.taxAmount | number:'1.0-0'}}</span></div>
                  <div class="price-row total"><span>Total Charter Fee</span><span>₹{{flight.totalPrice | number:'1.0-0'}}</span></div>
                </div>
              </mat-card-content>
            </mat-card>
            <div class="step-actions">
              <button mat-raised-button color="primary" (click)="initiateBooking(stepper)" [disabled]="isInitiating">
                <mat-spinner *ngIf="isInitiating" diameter="20"></mat-spinner>
                <span *ngIf="!isInitiating"><mat-icon>lock</mat-icon> Lock Seat & Continue</span>
              </button>
            </div>
          </div>
        </mat-step>

        <!-- STEP 2: Passenger Details -->
        <mat-step label="Passengers" [stepControl]="passengersForm">
          <div class="step-content">
            <h3>Passenger Information</h3>
            <form [formGroup]="passengersForm">
              <div formArrayName="passengers">
                <div *ngFor="let pax of passengersArray.controls; let i = index" [formGroupName]="i" class="passenger-form">
                  <h4>Passenger {{i + 1}}</h4>
                  <div class="pax-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>First Name</mat-label>
                      <input matInput formControlName="firstName">
                      <mat-error>Required</mat-error>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Last Name</mat-label>
                      <input matInput formControlName="lastName">
                      <mat-error>Required</mat-error>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Passport Number</mat-label>
                      <input matInput formControlName="passportNumber">
                      <mat-error>Required</mat-error>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Nationality</mat-label>
                      <input matInput formControlName="nationality">
                      <mat-error>Required</mat-error>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Date of Birth</mat-label>
                      <input matInput formControlName="dateOfBirth" [matDatepicker]="dob">
                      <mat-datepicker-toggle matSuffix [for]="dob"></mat-datepicker-toggle>
                      <mat-datepicker #dob></mat-datepicker>
                      <mat-error>Required</mat-error>
                    </mat-form-field>
                  </div>
                  <mat-divider *ngIf="i < passengersArray.length - 1" style="margin: 16px 0"></mat-divider>
                </div>
              </div>
            </form>
            <div class="step-actions">
              <button mat-button matStepperPrevious>Back</button>
              <button mat-raised-button color="primary" matStepperNext [disabled]="passengersForm.invalid">
                Continue <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </div>
        </mat-step>

        <!-- STEP 3: Discounts -->
        <mat-step label="Discounts">
          <div class="step-content">
            <h3>Apply Discounts</h3>
            <div class="coupon-section">
              <mat-form-field appearance="outline" class="coupon-field">
                <mat-label>Coupon Code</mat-label>
                <mat-icon matPrefix>local_offer</mat-icon>
                <input matInput [(ngModel)]="couponCode" placeholder="Enter code">
              </mat-form-field>
              <button mat-raised-button color="accent" (click)="applyCoupon()" [disabled]="!couponCode || isValidating">
                <mat-spinner *ngIf="isValidating" diameter="20"></mat-spinner>
                <span *ngIf="!isValidating">Apply</span>
              </button>
            </div>
            <div *ngIf="couponMessage" class="coupon-msg" [class.success]="couponValid" [class.error]="!couponValid">
              <mat-icon>{{couponValid ? 'check_circle' : 'error'}}</mat-icon>
              {{couponMessage}}
            </div>
            <div class="credits-section" *ngIf="userCredits > 0">
              <h4>Use Credits (Available: ₹{{userCredits | number:'1.0-0'}})</h4>
              <mat-slider min="0" [max]="maxCredits" step="100" class="credits-slider">
                <input matSliderThumb [(ngModel)]="creditsToUse" (ngModelChange)="updateTotal()">
              </mat-slider>
              <div class="credits-display">Using: ₹{{creditsToUse | number:'1.0-0'}}</div>
            </div>
            <div class="price-breakdown">
              <div class="price-row"><span>Base Amount</span><span>₹{{baseAmount | number:'1.0-0'}}</span></div>
              <div class="price-row"><span>GST (18%)</span><span>₹{{taxAmount | number:'1.0-0'}}</span></div>
              <div class="price-row discount" *ngIf="discountAmount > 0"><span>Coupon Discount</span><span>-₹{{discountAmount | number:'1.0-0'}}</span></div>
              <div class="price-row discount" *ngIf="creditsToUse > 0"><span>Credits Applied</span><span>-₹{{creditsToUse | number:'1.0-0'}}</span></div>
              <div class="price-row total"><span>Total Payable</span><span>₹{{finalTotal | number:'1.0-0'}}</span></div>
            </div>
            <div class="step-actions">
              <button mat-button matStepperPrevious>Back</button>
              <button mat-raised-button color="primary" matStepperNext>Continue <mat-icon>arrow_forward</mat-icon></button>
            </div>
          </div>
        </mat-step>

        <!-- STEP 4: Policy & Confirm -->
        <mat-step label="Policy" [stepControl]="policyForm">
          <div class="step-content">
            <h3>Review Policies</h3>
            <div class="policy-text">
              <h4>Cancellation Policy</h4>
              <p>Empty leg flights are non-refundable once confirmed. Cancellations made more than 24 hours before departure may be eligible for credit. No-shows will be charged the full amount.</p>
              <h4>Terms of Service</h4>
              <p>By booking this flight, you agree to present valid identification for all passengers. Luggage is subject to aircraft weight limits. The operator reserves the right to cancel due to weather or technical issues.</p>
            </div>
            <div class="price-breakdown">
              <div class="price-row"><span>Base Amount</span><span>₹{{baseAmount | number:'1.0-0'}}</span></div>
              <div class="price-row"><span>GST (18%)</span><span>₹{{taxAmount | number:'1.0-0'}}</span></div>
              <div class="price-row discount" *ngIf="discountAmount > 0"><span>Coupon Discount</span><span>-₹{{discountAmount | number:'1.0-0'}}</span></div>
              <div class="price-row discount" *ngIf="creditsToUse > 0"><span>Credits Applied</span><span>-₹{{creditsToUse | number:'1.0-0'}}</span></div>
              <div class="price-row total"><span>Total Payable</span><span>₹{{finalTotal | number:'1.0-0'}}</span></div>
            </div>
            <form [formGroup]="policyForm">
              <mat-checkbox formControlName="policyAcknowledged" color="primary">
                I have read and agree to the cancellation policy and terms of service
              </mat-checkbox>
            </form>
            <div class="step-actions">
              <button mat-button matStepperPrevious>Back</button>
              <button mat-raised-button color="primary" matStepperNext [disabled]="policyForm.invalid">
                Proceed to Payment <mat-icon>payment</mat-icon>
              </button>
            </div>
          </div>
        </mat-step>

        <!-- STEP 5: Payment -->
        <mat-step label="Payment">
          <div class="step-content">
            <h3>Payment</h3>
            <!-- Credit Card Visual -->
            <div class="credit-card">
              <div class="card-chip"></div>
              <div class="card-number">{{cardNumber || '•••• •••• •••• ••••'}}</div>
              <div class="card-info">
                <span>{{cardName || 'CARDHOLDER NAME'}}</span>
                <span>{{cardExpiry || 'MM/YY'}}</span>
              </div>
            </div>
            <!-- Payment Form -->
            <div class="payment-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Card Number</mat-label>
                <mat-icon matPrefix>credit_card</mat-icon>
                <input matInput [(ngModel)]="cardNumber" maxlength="19" placeholder="1234 5678 9012 3456">
              </mat-form-field>
              <div class="card-row">
                <mat-form-field appearance="outline">
                  <mat-label>Expiry (MM/YY)</mat-label>
                  <input matInput [(ngModel)]="cardExpiry" maxlength="5" placeholder="12/28">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>CVV</mat-label>
                  <input matInput [(ngModel)]="cardCvv" maxlength="3" type="password" placeholder="***">
                </mat-form-field>
              </div>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Name on Card</mat-label>
                <input matInput [(ngModel)]="cardName">
              </mat-form-field>
            </div>
            <div class="payment-total">Total: ₹{{finalTotal | number:'1.0-0'}}</div>
            <div class="payment-actions">
              <button mat-raised-button color="primary" class="pay-btn" (click)="processPayment(true)" [disabled]="isPaying">
                <mat-spinner *ngIf="isPaying" diameter="20"></mat-spinner>
                <span *ngIf="!isPaying"><mat-icon>payment</mat-icon> Pay ₹{{finalTotal | number:'1.0-0'}}</span>
              </button>
              <button mat-stroked-button color="warn" (click)="processPayment(false)" [disabled]="isPaying">
                Simulate Failure
              </button>
            </div>
            <div class="step-actions">
              <button mat-button matStepperPrevious>Back</button>
            </div>
          </div>
        </mat-step>
      </mat-stepper>
    </div>
  `,
  styles: [`
    .booking-container { max-width: 800px; margin: 0 auto; padding: 32px 16px; }
    .page-title { display: flex; align-items: center; gap: 8px; font-size: 24px; font-weight: 700; color: #1B2A5C; margin-bottom: 24px; }
    .lock-timer { background: #fff3e0; border: 1px solid #ff9800; border-radius: 8px; padding: 12px 20px; display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .lock-timer.warning { background: #ffebee; border-color: #f44336; }
    .lock-timer mat-icon { color: #e65100; }
    .timer-text { font-size: 16px; font-weight: 700; color: #e65100; margin-bottom: 4px; }
    .step-content { padding: 24px 0; }
    .flight-summary-card { border-radius: 12px !important; }
    .sum-route { display: flex; align-items: center; gap: 12px; font-size: 28px; font-weight: 800; color: #1B2A5C; margin-bottom: 4px; }
    .sum-iata { font-size: 28px; font-weight: 800; }
    .sum-cities { color: #888; font-size: 14px; margin-bottom: 12px; }
    .sum-meta { display: flex; flex-wrap: wrap; gap: 16px; font-size: 13px; color: #444; margin-bottom: 16px; }
    .sum-meta span { display: flex; align-items: center; gap: 4px; }
    .sum-meta mat-icon { font-size: 15px; width: 15px; height: 15px; color: #1B2A5C; }
    .seat-selector { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; }
    .seat-btns { display: flex; align-items: center; gap: 12px; }
    .seat-count { font-size: 20px; font-weight: 700; color: #1B2A5C; min-width: 24px; text-align: center; }
    .seat-avail { font-size: 12px; color: #888; }
    .sum-price { display: flex; align-items: center; gap: 12px; font-size: 15px; }
    .sum-price strong { font-size: 20px; color: #1B2A5C; }
    .step-actions { display: flex; gap: 12px; margin-top: 24px; }
    .passenger-form { margin-bottom: 16px; }
    .passenger-form h4 { font-size: 15px; font-weight: 600; color: #1B2A5C; margin-bottom: 12px; }
    .pax-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
    .coupon-section { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
    .coupon-field { flex: 1; }
    .coupon-msg { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 6px; font-size: 13px; margin-bottom: 12px; }
    .coupon-msg.success { background: #e8f5e9; color: #2e7d32; }
    .coupon-msg.error { background: #ffebee; color: #b71c1c; }
    .credits-section { margin-bottom: 16px; }
    .credits-section h4 { font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #1B2A5C; }
    .credits-slider { width: 100%; }
    .credits-display { font-size: 13px; color: #555; margin-top: 4px; }
    .price-breakdown { background: #f9f9fb; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .price-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #555; }
    .price-row.discount { color: #2e7d32; }
    .price-row.total { font-size: 18px; font-weight: 700; color: #1B2A5C; border-top: 2px solid #e0e0e0; margin-top: 8px; padding-top: 12px; }
    .policy-text { background: #f5f7fa; border-radius: 8px; padding: 16px; margin-bottom: 16px; font-size: 14px; color: #444; line-height: 1.6; }
    .policy-text h4 { font-size: 14px; font-weight: 700; color: #1B2A5C; margin-bottom: 4px; margin-top: 12px; }
    .credit-card { width: 100%; max-width: 380px; height: 220px; background: linear-gradient(135deg, #1B2A5C, #2A3D75 50%, #0d47a1); border-radius: 16px; padding: 24px; color: white; position: relative; box-shadow: 0 8px 32px rgba(26,35,126,0.4); margin: 0 auto 24px; }
    .card-chip { width: 40px; height: 30px; background: #ffd54f; border-radius: 4px; margin-bottom: 24px; }
    .card-number { font-size: 20px; letter-spacing: 3px; margin-bottom: 20px; font-family: monospace; }
    .card-info { display: flex; justify-content: space-between; font-size: 13px; opacity: 0.8; }
    .payment-form { max-width: 400px; }
    .full-width { width: 100%; }
    .card-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .payment-total { font-size: 20px; font-weight: 700; color: #1B2A5C; margin: 16px 0; }
    .payment-actions { display: flex; gap: 12px; margin-bottom: 16px; }
    .pay-btn { height: 52px; font-size: 16px; font-weight: 700; padding: 0 32px; }
    .charter-note { display: flex; align-items: flex-start; gap: 8px; background: #e8f4fd; border-radius: 8px; padding: 12px 16px; margin: 16px 0 8px; font-size: 13px; color: #0d47a1; }
    .charter-note mat-icon { font-size: 18px; width: 18px; height: 18px; margin-top: 1px; flex-shrink: 0; }
    .charter-price { background: #f8f9ff; border-radius: 8px; padding: 14px 16px; margin: 12px 0; }
    .charter-price .price-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; color: #555; border-bottom: 1px solid #eee; }
    .charter-price .price-row:last-child { border-bottom: none; }
    .charter-price .price-row.total { font-size: 16px; font-weight: 700; color: #1B2A5C; padding-top: 10px; margin-top: 4px; }
    .passengers-input { display: flex; align-items: center; gap: 12px; margin: 12px 0; font-size: 14px; }
  `]
})
export class BookingFlowComponent implements OnInit, OnDestroy {
  private flightService = inject(FlightService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private signalR = inject(SignalRService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  flight: EmptyLegDetailDto | null = null;
  lockResponse: BookingLockResponse | null = null;
  isLoadingFlight = false;
  isInitiating = false;
  isValidating = false;
  isPaying = false;

  passengerCount = 1;
  userCredits = 0;
  couponCode = '';
  couponValid = false;
  couponMessage = '';
  discountAmount = 0;
  creditsToUse = 0;
  maxCredits = 0;
  baseAmount = 0;
  taxAmount = 0;
  finalTotal = 0;

  cardNumber = '';
  cardExpiry = '';
  cardCvv = '';
  cardName = '';

  timerSeconds = 0;
  timerTotal = 0;
  timerPercent = 100;
  private timerInterval: any;

  passengersForm = this.fb.group({
    passengers: this.fb.array([])
  });

  policyForm = this.fb.group({
    policyAcknowledged: [false, Validators.requiredTrue]
  });

  get passengersArray(): FormArray {
    return this.passengersForm.get('passengers') as FormArray;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadFlight(+id);
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userService.getCredits().subscribe({ next: c => { this.userCredits = c.totalCredits || 0; } });
    }
  }

  loadFlight(id: number): void {
    this.isLoadingFlight = true;
    this.flightService.getDetail(id).subscribe({
      next: f => {
        this.flight = f;
        this.isLoadingFlight = false;
        this.baseAmount = f.price;
        this.taxAmount = f.taxAmount;
        this.finalTotal = f.totalPrice;
        this.buildPassengerForms();
      },
      error: () => { this.isLoadingFlight = false; }
    });
  }

  buildPassengerForms(): void {
    const arr = this.passengersArray;
    while (arr.length) arr.removeAt(0);
    for (let i = 0; i < this.passengerCount; i++) {
      arr.push(this.fb.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        passportNumber: ['', Validators.required],
        nationality: ['', Validators.required],
        dateOfBirth: ['', Validators.required]
      }));
    }
  }

  adjustPassengers(delta: number): void {
    this.passengerCount = Math.max(1, Math.min(this.flight!.seatingCapacity || 8, this.passengerCount + delta));
    this.buildPassengerForms();
  }

  initiateBooking(stepper: any): void {
    this.isInitiating = true;
    const passengers: PassengerDto[] = this.passengersArray.controls.map(c => ({
      firstName: c.get('firstName')?.value || '',
      lastName: c.get('lastName')?.value || '',
      passportNumber: c.get('passportNumber')?.value || '',
      nationality: c.get('nationality')?.value || '',
      dateOfBirth: c.get('dateOfBirth')?.value instanceof Date
        ? (c.get('dateOfBirth')?.value as Date).toISOString().split('T')[0]
        : c.get('dateOfBirth')?.value || null
    }));

    this.flightService.initiateBooking(this.flight!.id, {
      emptyLegId: this.flight!.id,
      passengerCount: this.passengerCount,
      passengers,
      creditsToUse: 0,
      policyAcknowledged: false
    }).subscribe({
      next: res => {
        this.lockResponse = res;
        this.baseAmount = res.baseAmount;
        this.taxAmount = res.taxAmount;
        this.discountAmount = res.discountAmount;
        this.finalTotal = res.totalAmount;
        this.startTimer(res.lockDurationSeconds);
        this.isInitiating = false;
        stepper.next();
      },
      error: err => {
        this.isInitiating = false;
        this.snackBar.open(err?.error?.message || 'Could not initiate booking', 'Close', { duration: 4000 });
      }
    });
  }

  startTimer(seconds: number): void {
    this.timerSeconds = seconds;
    this.timerTotal = seconds;
    this.timerPercent = 100;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timerSeconds--;
      this.timerPercent = (this.timerSeconds / this.timerTotal) * 100;
      if (this.timerSeconds <= 0) {
        clearInterval(this.timerInterval);
        this.snackBar.open('Your seat reservation has expired. Please search again.', 'Search Again', { duration: 0 })
          .onAction().subscribe(() => this.router.navigate(['/flights']));
      }
    }, 1000);
  }

  formatTimer(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  applyCoupon(): void {
    this.isValidating = true;
    this.flightService.validateCoupon(this.couponCode, this.baseAmount + this.taxAmount).subscribe({
      next: res => {
        this.isValidating = false;
        this.couponValid = res.isValid;
        this.couponMessage = res.message;
        if (res.isValid) {
          this.discountAmount = res.discountAmount;
          this.updateTotal();
        }
      },
      error: () => {
        this.isValidating = false;
        this.couponValid = false;
        this.couponMessage = 'Failed to validate coupon';
      }
    });
  }

  updateTotal(): void {
    if (!this.flight) return;
    const base = this.flight.price;
    const tax = this.flight.taxAmount;
    const discount = this.discountAmount;
    const credits = Math.min(this.creditsToUse, this.userCredits, base + tax - discount);
    this.baseAmount = base;
    this.taxAmount = tax;
    this.creditsToUse = credits;
    this.maxCredits = Math.min(this.userCredits, base + tax - discount);
    this.finalTotal = Math.max(0, base + tax - discount - credits);
  }

  processPayment(success: boolean): void {
    if (!this.lockResponse) return;
    this.isPaying = true;
    setTimeout(() => {
      this.flightService.confirmPayment(this.lockResponse!.bookingId, success, this.couponValid ? this.couponCode : undefined, this.creditsToUse).subscribe({
        next: booking => {
          this.isPaying = false;
          if (success) {
            this.router.navigate(['/booking/confirmation', booking.bookingRef]);
          } else {
            this.snackBar.open('Payment failed. Please try again.', 'Close', { duration: 4000 });
          }
        },
        error: err => {
          this.isPaying = false;
          this.snackBar.open(err?.error?.message || 'Payment processing failed', 'Close', { duration: 4000 });
        }
      });
    }, 3000);
  }

  getDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }
}
