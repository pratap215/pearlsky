import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { NotificationDto } from '../models/models';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private hubConnection: signalR.HubConnection | null = null;

  connect(token: string): Promise<void> {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.hubUrl, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();
    return this.hubConnection.start();
  }

  disconnect(): Promise<void> {
    if (this.hubConnection) {
      return this.hubConnection.stop();
    }
    return Promise.resolve();
  }

  onEmptyLegStatusChanged(cb: (data: any) => void): void {
    this.hubConnection?.on('EmptyLegStatusChanged', cb);
  }

  onBookingStatusUpdated(cb: (data: any) => void): void {
    this.hubConnection?.on('BookingStatusUpdated', cb);
  }

  onNewNotification(cb: (n: NotificationDto) => void): void {
    this.hubConnection?.on('NewNotification', cb);
  }

  onLockExpired(cb: (data: any) => void): void {
    this.hubConnection?.on('LockExpired', cb);
  }

  joinUserGroup(userId: string): void {
    this.hubConnection?.invoke('JoinUserGroup', userId).catch(console.error);
  }

  get isConnected(): boolean {
    return this.hubConnection?.state === signalR.HubConnectionState.Connected;
  }
}
