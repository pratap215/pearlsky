import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { NotificationToastComponent } from './shared/components/notification-toast/notification-toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, NotificationToastComponent],
  template: `
    <app-navbar></app-navbar>
    <router-outlet></router-outlet>
    <app-notification-toast></app-notification-toast>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; font-family: 'Inter', sans-serif; }
  `]
})
export class App {}
