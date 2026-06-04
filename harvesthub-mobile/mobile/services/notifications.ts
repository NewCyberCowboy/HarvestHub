import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '@/lib/api';

// Check if running in Expo Go
const isExpoGo = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require('expo-constants');
    return Constants.default?.expoConfig?.hostUri !== undefined ||
      Constants.default?.appOwnership === 'expo';
  } catch {
    return false;
  }
};

export interface PushToken {
  token: string;
  platform: string;
}

export interface OrderNotification {
  orderId: number;
  orderNumber: string;
  totalAmount: number;
  customerName: string;
  items: number;
}

export interface NotificationData {
  type: 'new_order' | 'order_status_changed' | 'order_delivered' | 'order_cancelled' |
  'product_available' | 'product_out_of_stock' | 'price_changed' |
  'farmer_response' | 'weight_updated' | 'delivery_update';
  orderId?: number;
  productId?: number;
  status?: string;
  amount?: number;
  [key: string]: any;
}

// Configure notifications (only in native builds, not Expo Go)
try {
  if (!isExpoGo()) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch (e) {
  console.warn('Failed to set notification handler:', e);
}

const STORAGE_KEY = 'harvesthub-mobile-notifications';
const LAST_CHECK_KEY = 'harvesthub-last-order-check';

export const notificationsService = {
  // Request permissions
  requestPermissions: async (): Promise<boolean> => {
    if (!Device.isDevice) {
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  },

  // Get push token
  getPushToken: async (): Promise<string | null> => {
    if (!Device.isDevice || isExpoGo()) {
      console.log('Push tokens not available in Expo Go or simulator');
      return null;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'harvesthub-mobile', // Replace with your actual project ID
      });
      return tokenData.data;
    } catch (error) {
      console.warn('Failed to get push token:', error);
      return null;
    }
  },

  // Register device token on server
  registerDeviceToken: async (token: string, userToken: string): Promise<void> => {
    try {
      await apiRequest('/Notifications/register', {
        method: 'POST',
        body: { pushToken: token, platform: Platform.OS },
        token: userToken,
      });
      console.log('Device token registered successfully');
    } catch (error) {
      console.error('Failed to register device token:', error);
      throw error;
    }
  },

  // Schedule local notification
  scheduleLocalNotification: async (
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<string> => {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // Immediate
    });
  },

  // Show new order notification (for farmers)
  showNewOrderNotification: async (order: OrderNotification): Promise<void> => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🛒 Новый заказ!',
        body: `Заказ #${order.orderNumber} на ${order.totalAmount.toFixed(2)} ₽ от ${order.customerName} (${order.items} товаров)`,
        data: { type: 'new_order', orderId: order.orderId } as NotificationData,
        sound: 'default',
        badge: 1,
      },
      trigger: null,
    });
  },

  // Show order status change notification (for users)
  showOrderStatusNotification: async (orderNumber: string, status: string): Promise<void> => {
    const statusText: Record<string, string> = {
      'Confirmed': 'Подтвержден',
      'Processing': 'В обработке',
      'AwaitingWeight': 'Ожидает взвешивания',
      'ReadyToShip': 'Готов к отправке',
      'Shipped': 'Отправлен',
      'Delivered': 'Доставлен',
      'Cancelled': 'Отменен',
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📦 Статус заказа обновлен',
        body: `Заказ #${orderNumber}: ${statusText[status] || status}`,
        data: { type: 'order_status_changed', status } as NotificationData,
        sound: 'default',
        badge: 1,
      },
      trigger: null,
    });
  },

  // Show order delivered notification (for users)
  showOrderDeliveredNotification: async (orderNumber: string): Promise<void> => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ Заказ доставлен!',
        body: `Ваш заказ #${orderNumber} успешно доставлен`,
        data: { type: 'order_delivered' } as NotificationData,
        sound: 'default',
        badge: 1,
      },
      trigger: null,
    });
  },

  // Show order cancelled notification (for users/farmers)
  showOrderCancelledNotification: async (orderNumber: string, reason?: string): Promise<void> => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '❌ Заказ отменен',
        body: `Заказ #${orderNumber}${reason ? `: ${reason}` : ''}`,
        data: { type: 'order_cancelled' } as NotificationData,
        sound: 'default',
        badge: 1,
      },
      trigger: null,
    });
  },

  // Show product available notification (for users)
  showProductAvailableNotification: async (productName: string, farmerName: string): Promise<void> => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🥬 Товар доступен!',
        body: `${productName} от ${farmerName} теперь в наличии`,
        data: { type: 'product_available' } as NotificationData,
        sound: 'default',
        badge: 1,
      },
      trigger: null,
    });
  },

  // Show product out of stock notification (for users)
  showProductOutOfStockNotification: async (productName: string): Promise<void> => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ Товар закончился',
        body: `${productName} временно недоступен`,
        data: { type: 'product_out_of_stock' } as NotificationData,
        sound: 'default',
        badge: 1,
      },
      trigger: null,
    });
  },

  // Show price changed notification (for users)
  showPriceChangedNotification: async (productName: string, oldPrice: number, newPrice: number): Promise<void> => {
    const change = newPrice - oldPrice;
    const isIncrease = change > 0;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: isIncrease ? '📈 Цена увеличилась' : '📉 Цена снизилась',
        body: `${productName}: ${oldPrice.toFixed(2)}₽ → ${newPrice.toFixed(2)}₽`,
        data: { type: 'price_changed', amount: change } as NotificationData,
        sound: 'default',
        badge: 1,
      },
      trigger: null,
    });
  },

  // Show farmer response notification (for users)
  showFarmerResponseNotification: async (farmerName: string, message: string): Promise<void> => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `💬 Ответ от ${farmerName}`,
        body: message,
        data: { type: 'farmer_response' } as NotificationData,
        sound: 'default',
        badge: 1,
      },
      trigger: null,
    });
  },

  // Show weight updated notification (for users)
  showWeightUpdatedNotification: async (orderNumber: string, productName: string, weight: number): Promise<void> => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚖️ Вес обновлен',
        body: `Заказ #${orderNumber}: ${productName} - ${weight} кг`,
        data: { type: 'weight_updated' } as NotificationData,
        sound: 'default',
        badge: 1,
      },
      trigger: null,
    });
  },

  // Show delivery update notification (for users)
  showDeliveryUpdateNotification: async (orderNumber: string, status: string, eta?: string): Promise<void> => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚚 Обновление доставки',
        body: `Заказ #${orderNumber}: ${status}${eta ? `. Ожидаемое время: ${eta}` : ''}`,
        data: { type: 'delivery_update', status } as NotificationData,
        sound: 'default',
        badge: 1,
      },
      trigger: null,
    });
  },

  // Save last check time
  saveLastCheck: async (timestamp: number) => {
    await AsyncStorage.setItem(LAST_CHECK_KEY, String(timestamp));
  },

  // Get last check time
  getLastCheck: async (): Promise<number> => {
    const value = await AsyncStorage.getItem(LAST_CHECK_KEY);
    return value ? parseInt(value, 10) : 0;
  },

  // Check for new orders and notify
  checkNewOrders: async (
    orders: { orderId: number; orderNumber: string; totalAmount: number; customerName: string; createdAt: string }[]
  ): Promise<void> => {
    const lastCheck = await notificationsService.getLastCheck();
    const now = Date.now();

    const newOrders = orders.filter((order) => {
      const orderTime = new Date(order.createdAt).getTime();
      return orderTime > lastCheck;
    });

    for (const order of newOrders.slice(0, 3)) {
      // Max 3 notifications at once
      await notificationsService.showNewOrderNotification({
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        customerName: order.customerName,
        items: 0, // Will be fetched from order details
      });
    }

    await notificationsService.saveLastCheck(now);
  },

  // Cancel all notifications
  cancelAll: async (): Promise<void> => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  // Get badge count
  getBadgeCount: async (): Promise<number> => {
    return await Notifications.getBadgeCountAsync();
  },

  // Set badge count
  setBadgeCount: async (count: number): Promise<void> => {
    await Notifications.setBadgeCountAsync(count);
  },

  // Clear badge
  clearBadge: async (): Promise<void> => {
    await Notifications.setBadgeCountAsync(0);
  },
};

// Listen for notification responses
export const addNotificationResponseListener = (
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription | null => {
  try {
    return Notifications.addNotificationResponseReceivedListener(callback);
  } catch (e) {
    console.warn('Failed to add notification response listener:', e);
    return null;
  }
};

// Listen for received notifications
export const addNotificationReceivedListener = (
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription | null => {
  try {
    return Notifications.addNotificationReceivedListener(callback);
  } catch (e) {
    console.warn('Failed to add notification received listener:', e);
    return null;
  }
};
