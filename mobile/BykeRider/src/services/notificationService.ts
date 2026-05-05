import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

const LAST_NOTIF_ID_KEY = 'last_notification_id';
let pollingInterval: ReturnType<typeof setInterval> | null = null;

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
};

export const setupNotificationListeners = (
  onNotification: (notification: any) => void,
  _onNotificationOpened: (notification: any) => void
): (() => void) => {
  // Poll backend for new unread notifications every 10 seconds
  const pollNotifications = async () => {
    try {
      const response = await api.get('/notifications/unread');
      const notifications = response.data;
      if (Array.isArray(notifications) && notifications.length > 0) {
        const lastSeenId = await AsyncStorage.getItem(LAST_NOTIF_ID_KEY);
        const lastId = lastSeenId ? parseInt(lastSeenId, 10) : 0;

        for (const notif of notifications) {
          if (notif.id > lastId) {
            onNotification({
              notification: {
                title: notif.title,
                body: notif.message,
              },
              data: {
                type: notif.type,
                bookingId: notif.bookingId?.toString() || '',
              },
            });
          }
        }

        // Save the highest notification ID we've seen
        const maxId = Math.max(...notifications.map((n: any) => n.id));
        if (maxId > lastId) {
          await AsyncStorage.setItem(LAST_NOTIF_ID_KEY, maxId.toString());
        }
      }
    } catch (error) {
      // Silently fail - user might not be authenticated yet
    }
  };

  // Start polling
  pollNotifications();
  pollingInterval = setInterval(pollNotifications, 10000);

  return () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  };
};
