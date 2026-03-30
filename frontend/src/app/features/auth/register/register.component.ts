import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirm = control.get('confirmPassword');
  if (password && confirm && password.value !== confirm.value) {
    confirm.setErrors({ mismatch: true });
    return { mismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="register-page">
      <mat-card class="register-card">
        <mat-card-header>
          <div class="logo-area">
            <mat-icon class="logo-icon">flight</mat-icon>
            <h2>Create Your Account</h2>
            <p>Join EmptyLegs for exclusive private jet deals</p>
          </div>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="row-2">
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
            </div>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <mat-icon matPrefix>email</mat-icon>
              <input matInput formControlName="email" type="email">
              <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="form.get('email')?.hasError('email')">Invalid email</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Phone</mat-label>
              <mat-icon matPrefix>phone</mat-icon>
              <input matInput formControlName="phone" type="tel">
              <mat-error>Phone is required</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <mat-icon matPrefix>lock</mat-icon>
              <input matInput formControlName="password" [type]="showPass ? 'text' : 'password'">
              <button mat-icon-button matSuffix type="button" (click)="showPass = !showPass">
                <mat-icon>{{showPass ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="form.get('password')?.hasError('required')">Password is required</mat-error>
              <mat-error *ngIf="form.get('password')?.hasError('minlength')">Minimum 6 characters</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirm Password</mat-label>
              <mat-icon matPrefix>lock_outline</mat-icon>
              <input matInput formControlName="confirmPassword" type="password">
              <mat-error *ngIf="form.get('confirmPassword')?.hasError('mismatch')">Passwords do not match</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Referral Code (optional)</mat-label>
              <mat-icon matPrefix>card_giftcard</mat-icon>
              <input matInput formControlName="referralCode">
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit" class="submit-btn" [disabled]="isLoading || form.invalid">
              <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
              <span *ngIf="!isLoading">Create Account</span>
            </button>
          </form>
          <p class="login-link">Already have an account? <a routerLink="/login">Sign in</a></p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-page { min-height: calc(100vh - 64px); display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f5f7fa 0%, #e8eaf6 100%); padding: 24px; }
    .register-card { width: 100%; max-width: 500px; border-radius: 16px !important; box-shadow: 0 8px 32px rgba(0,0,0,0.12) !important; }
    .logo-area { text-align: center; width: 100%; padding: 24px 0 16px; }
    .logo-icon { font-size: 48px; width: 48px; height: 48px; color: #1a237e; }
    .logo-area h2 { font-size: 22px; font-weight: 700; color: #1a237e; margin: 8px 0 4px; }
    .logo-area p { color: #666; font-size: 14px; }
    .full-width { width: 100%; margin-bottom: 8px; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 8px; }
    .submit-btn { width: 100%; height: 48px; font-size: 16px; font-weight: 600; margin-top: 8px; }
    .login-link { text-align: center; margin-top: 16px; font-size: 14px; color: #666; }
    .login-link a { color: #1a237e; font-weight: 600; text-decoration: none; }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  isLoading = false;
  showPass = false;

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
    referralCode: ['']
  }, { validators: passwordMatchValidator });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isLoading = true;
    const v = this.form.value;
    this.auth.register({
      firstName: v.firstName!,
      lastName: v.lastName!,
      email: v.email!,
      password: v.password!,
      phone: v.phone!,
      referralCode: v.referralCode || undefined
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Account created successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.isLoading = false;
        const msg = err?.error?.message || 'Registration failed. Please try again.';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: 'error-snack' });
      }
    });
  }
}
