import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="login-page">
      <mat-card class="login-card">
        <mat-card-header>
          <div class="logo-area">
            <mat-icon class="logo-icon">flight</mat-icon>
            <h2>Sign In to EmptyLegs</h2>
            <p>Access exclusive private jet deals</p>
          </div>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <mat-icon matPrefix>email</mat-icon>
              <input matInput formControlName="email" type="email" placeholder="you@example.com">
              <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="form.get('email')?.hasError('email')">Invalid email</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <mat-icon matPrefix>lock</mat-icon>
              <input matInput formControlName="password" [type]="showPass ? 'text' : 'password'">
              <button mat-icon-button matSuffix type="button" (click)="showPass = !showPass">
                <mat-icon>{{showPass ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="form.get('password')?.hasError('required')">Password is required</mat-error>
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit" class="submit-btn" [disabled]="isLoading || form.invalid">
              <mat-spinner *ngIf="isLoading" diameter="20" class="inline-spinner"></mat-spinner>
              <span *ngIf="!isLoading">Sign In</span>
            </button>
          </form>
          <p class="register-link">Don't have an account? <a routerLink="/register">Register here</a></p>

          <!-- Demo Credentials -->
          <div class="demo-box">
            <div class="demo-title"><mat-icon>info</mat-icon> Demo Credentials</div>
            <div class="demo-item" (click)="fillDemo('aditya@example.com', 'User@123')">
              <span class="demo-role">User</span> aditya&#64;example.com / User&#64;123
            </div>
            <div class="demo-item" (click)="fillDemo('admin@indijet.in', 'Admin@123')">
              <span class="demo-role operator">Operator</span> admin&#64;indijet.in / Admin&#64;123
            </div>
            <div class="demo-item" (click)="fillDemo('admin@emptylegs.com', 'Admin@123')">
              <span class="demo-role admin">Admin</span> admin&#64;emptylegs.com / Admin&#64;123
            </div>
            <p class="demo-hint">Click to auto-fill</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-page { min-height: calc(100vh - 64px); display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f5f7fa 0%, #e8eaf6 100%); padding: 24px; }
    .login-card { width: 100%; max-width: 440px; border-radius: 16px !important; box-shadow: 0 8px 32px rgba(0,0,0,0.12) !important; }
    .logo-area { text-align: center; width: 100%; padding: 24px 0 16px; }
    .logo-icon { font-size: 48px; width: 48px; height: 48px; color: #1B2A5C; }
    .logo-area h2 { font-size: 22px; font-weight: 700; color: #1B2A5C; margin: 8px 0 4px; }
    .logo-area p { color: #666; font-size: 14px; }
    .full-width { width: 100%; margin-bottom: 16px; }
    .submit-btn { width: 100%; height: 48px; font-size: 16px; font-weight: 600; margin-top: 8px; }
    .inline-spinner { display: inline-block; }
    .register-link { text-align: center; margin-top: 16px; font-size: 14px; color: #666; }
    .register-link a { color: #1B2A5C; font-weight: 600; text-decoration: none; }
    .demo-box { margin-top: 20px; background: #f8f9ff; border: 1px solid #e8eaf6; border-radius: 8px; padding: 16px; }
    .demo-title { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #1B2A5C; margin-bottom: 10px; }
    .demo-title mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .demo-item { font-size: 12px; padding: 6px 8px; border-radius: 4px; cursor: pointer; margin-bottom: 4px; color: #444; display: flex; align-items: center; gap: 8px; }
    .demo-item:hover { background: #e8eaf6; }
    .demo-role { background: #e8eaf6; color: #1B2A5C; padding: 2px 8px; border-radius: 10px; font-weight: 600; font-size: 10px; }
    .demo-role.operator { background: #e8f5e9; color: #2e7d32; }
    .demo-role.admin { background: #fce4ec; color: #c62828; }
    .demo-hint { font-size: 10px; color: #999; margin-top: 4px; text-align: right; }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  isLoading = false;
  showPass = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  fillDemo(email: string, password: string): void {
    this.form.patchValue({ email, password });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isLoading = true;
    const { email, password } = this.form.value;
    this.auth.login({ email: email!, password: password! }).subscribe({
      next: res => {
        this.isLoading = false;
        if (res.role === 'SuperAdmin') this.router.navigate(['/admin']);
        else if (res.role === 'OperatorAdmin') this.router.navigate(['/operator']);
        else this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.isLoading = false;
        const msg = err?.error?.message || 'Invalid email or password';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: 'error-snack' });
      }
    });
  }
}
