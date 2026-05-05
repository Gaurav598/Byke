import { io, Socket } from 'socket.io-client';
import { SOCKET_URL as SOCKET_URL_ENV } from '../config/env';

const SOCKET_URL = SOCKET_URL_ENV || 'http://16.171.230.164:8080';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRideRoom(rideId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_ride', { rideId });
    }
  }

  leaveRideRoom(rideId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_ride', { rideId });
    }
  }

  onNewBid(callback: (bid: any) => void): void {
    if (this.socket) {
      this.socket.on('new_bid', callback);
    }
  }

  onBidAccepted(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('bid_accepted', callback);
    }
  }

  onRideStatusUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('ride_status_update', callback);
    }
  }

  onRiderLocationUpdate(callback: (location: any) => void): void {
    if (this.socket) {
      this.socket.on('rider_location_update', callback);
    }
  }

  offNewBid(callback: (bid: any) => void): void {
    if (this.socket) {
      this.socket.off('new_bid', callback);
    }
  }

  offBidAccepted(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('bid_accepted', callback);
    }
  }

  offRideStatusUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('ride_status_update', callback);
    }
  }

  offRiderLocationUpdate(callback: (location: any) => void): void {
    if (this.socket) {
      this.socket.off('rider_location_update', callback);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default new WebSocketService();
