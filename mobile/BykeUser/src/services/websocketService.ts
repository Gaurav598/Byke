import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE_URL } from '../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Polyfill for text-encoding required by STOMP over React Native
import 'text-encoding';

class WebSocketService {
  private client: Client | null = null;
  private connected = false;
  private subscriptions: Map<string, any> = new Map();

  connect = async (onConnectCallback?: () => void) => {
    if (this.connected) return;

    const token = await AsyncStorage.getItem('token');
    
    const socketUrl = `${API_BASE_URL}/ws`;

    this.client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: function (str) {
        console.log('[STOMP]', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      this.connected = true;
      console.log('WebSocket connected');
      if (onConnectCallback) {
        onConnectCallback();
      }
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    this.client.onWebSocketClose = () => {
      this.connected = false;
      console.log('WebSocket disconnected');
    };

    this.client.activate();
  };

  disconnect = () => {
    if (this.client) {
      this.client.deactivate();
      this.connected = false;
    }
  };

  subscribe = (topic: string, callback: (message: any) => void) => {
    if (!this.client || !this.connected) {
      console.warn('Cannot subscribe. WebSocket not connected.');
      return;
    }

    const subscription = this.client.subscribe(topic, (message) => {
      if (message.body) {
        callback(JSON.parse(message.body));
      }
    });

    this.subscriptions.set(topic, subscription);
    return subscription;
  };

  unsubscribe = (topic: string) => {
    const subscription = this.subscriptions.get(topic);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(topic);
    }
  };

  publish = (destination: string, body: any) => {
    if (!this.client || !this.connected) {
      console.warn('Cannot publish. WebSocket not connected.');
      return;
    }

    this.client.publish({
      destination,
      body: JSON.stringify(body),
    });
  };
}

export default new WebSocketService();
