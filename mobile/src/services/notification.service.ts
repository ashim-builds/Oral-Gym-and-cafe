import apiClient, { getAuthToken } from './api';
import { adminApi, getAdminToken } from './admin.service';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export interface NotificationItem {
  id: number;
  recipient_type: 'CUSTOMER' | 'ADMIN' | 'ALL';
  customer_id?: number | null;
  admin_id?: number | null;
  title: string;
  message: string;
  type: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

export interface NotificationResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

class NotificationService {
  private pushToken: string | null = null;

  /**
   * Initialize and register push notification token with backend
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      const Device = await import('expo-device');
      const Notifications = await import('expo-notifications');

      // Set notification handler so notifications show while app is in foreground and notification center
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // Configure Android Notification Channel (Required for Android 8+ Notification Center)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Order & Store Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#DC2626',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });
      }

      if (Device.isDevice) {
        // Expo Go dropped remote push notifications starting from SDK 53.
        // Check if running in Expo Go; if so, skip remote token registration to avoid warnings/crashes.
        const isExpoGo =
          Constants.appOwnership === 'expo' ||
          (Constants as any).executionEnvironment === 'storeClient';

        if (isExpoGo) {
          return null;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          return null;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync();
        const token = tokenData.data;
        this.pushToken = token;

        // Register token with backend
        await this.syncTokenWithBackend(token);
        return token;
      } else {
        return null;
      }
    } catch (err: any) {
      return null;
    }
  }

  /**
   * Post immediate system notification to device notification center
   */
  async showLocalNotification(title: string, body: string, data?: any) {
    try {
      const Notifications = await import('expo-notifications');
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null,
      });
    } catch {}
  }

  /**
   * Sync push token with backend API
   */
  async syncTokenWithBackend(token?: string) {
    const t = token || this.pushToken;
    if (!t) return;
    try {
      await apiClient.post('/notifications/register-token', {
        token: t,
        device_type: Platform.OS,
      });
    } catch (err: any) {
      // Ignore token sync warning
    }
  }

  /**
   * Fetch customer notifications (Safe: checks token, returns empty on unauthenticated/guest)
   */
  async getCustomerNotifications(): Promise<NotificationResponse> {
    try {
      const token = await getAuthToken();
      if (!token) {
        return { notifications: [], unreadCount: 0 };
      }
      const response = await apiClient.get<{ data: NotificationResponse }>('/notifications/customer');
      return response.data.data || { notifications: [], unreadCount: 0 };
    } catch {
      return { notifications: [], unreadCount: 0 };
    }
  }

  /**
   * Fetch admin notifications (Safe: uses adminApi with admin token)
   */
  async getAdminNotifications(): Promise<NotificationResponse> {
    try {
      const token = await getAdminToken();
      if (!token) {
        return { notifications: [], unreadCount: 0 };
      }
      const response = await adminApi.get<{ data: NotificationResponse }>('/notifications/admin');
      return response.data.data || { notifications: [], unreadCount: 0 };
    } catch {
      return { notifications: [], unreadCount: 0 };
    }
  }

  /**
   * Mark individual notification as read
   */
  async markAsRead(id: number) {
    try {
      const response = await apiClient.put(`/notifications/${id}/read`);
      return response.data;
    } catch {
      return null;
    }
  }

  /**
   * Mark all customer notifications as read
   */
  async markAllAsReadCustomer() {
    try {
      const response = await apiClient.put('/notifications/customer/read-all');
      return response.data;
    } catch {
      return null;
    }
  }

  /**
   * Mark all admin notifications as read
   */
  async markAllAsReadAdmin() {
    try {
      const response = await adminApi.put('/notifications/admin/read-all');
      return response.data;
    } catch {
      return null;
    }
  }



  /**
   * Check if notification permission is already granted
   */
  async checkNotificationPermission(): Promise<boolean> {
    try {
      const Notifications = await import('expo-notifications');
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Request push notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    try {
      const Notifications = await import('expo-notifications');
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        await this.registerForPushNotifications();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;

