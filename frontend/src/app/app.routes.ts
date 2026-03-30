import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { operatorGuard } from './core/guards/operator.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
  { path: 'flights', loadComponent: () => import('./features/flights/flight-search/flight-search.component').then(m => m.FlightSearchComponent) },
  { path: 'flights/:id', loadComponent: () => import('./features/flights/flight-detail/flight-detail.component').then(m => m.FlightDetailComponent) },
  { path: 'booking/:id', loadComponent: () => import('./features/booking/booking-flow/booking-flow.component').then(m => m.BookingFlowComponent), canActivate: [authGuard] },
  { path: 'booking/confirmation/:ref', loadComponent: () => import('./features/booking/booking-confirmation/booking-confirmation.component').then(m => m.BookingConfirmationComponent), canActivate: [authGuard] },
  { path: 'dashboard', loadComponent: () => import('./features/dashboard/user-dashboard/user-dashboard.component').then(m => m.UserDashboardComponent), canActivate: [authGuard] },
  { path: 'operator', loadComponent: () => import('./features/operator/operator-dashboard/operator-dashboard.component').then(m => m.OperatorDashboardComponent), canActivate: [operatorGuard] },
  { path: 'admin', loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent), canActivate: [adminGuard] },
  { path: '**', redirectTo: '' }
];
