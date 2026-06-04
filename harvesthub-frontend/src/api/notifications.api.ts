import axios from './axios';

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

export interface Notification {
  id: number;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  data?: NotificationData;
}

export interface DeviceTokenRequest {
  pushToken: string;
  platform: string;
}

// Browser notification service
class NotificationsService {
  private permission: NotificationPermission = 'default';

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    const result = await Notification.requestPermission();
    this.permission = result;
    return result === 'granted';
  }

  // Check if permission is granted
  hasPermission(): boolean {
    return this.permission === 'granted' || Notification.permission === 'granted';
  }

  // Show local notification
  async showLocalNotification(title: string, body: string, data?: NotificationData): Promise<void> {
    if (!this.hasPermission()) {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: data?.type || 'notification',
      data: data || {},
    });

    notification.onclick = () => {
      window.focus();
      notification.close();

      // Handle navigation based on notification type
      if (data?.type === 'new_order' || data?.type === 'order_status_changed') {
        if (data?.orderId) {
          window.location.href = `/orders/${data.orderId}`;
        }
      }
    };
  }

  // Show new order notification (for farmers)
  async showNewOrderNotification(order: {
    orderId: number;
    orderNumber: string;
    totalAmount: number;
    customerName: string;
    items: number;
  }): Promise<void> {
    await this.showLocalNotification(
      '🛒 Новый заказ!',
      `Заказ #${order.orderNumber} на ${order.totalAmount.toFixed(2)} ₽ от ${order.customerName} (${order.items} товаров)`,
      { type: 'new_order', orderId: order.orderId }
    );
  }

  // Show order status change notification (for users)
  async showOrderStatusNotification(orderNumber: string, status: string): Promise<void> {
    const statusText: Record<string, string> = {
      'Confirmed': 'Подтвержден',
      'Processing': 'В обработке',
      'AwaitingWeight': 'Ожидает взвешивания',
      'ReadyToShip': 'Готов к отправке',
      'Shipped': 'Отправлен',
      'Delivered': 'Доставлен',
      'Cancelled': 'Отменен',
    };

    await this.showLocalNotification(
      '📦 Статус заказа обновлен',
      `Заказ #${orderNumber}: ${statusText[status] || status}`,
      { type: 'order_status_changed', status }
    );
  }

  // Show order delivered notification (for users)
  async showOrderDeliveredNotification(orderNumber: string): Promise<void> {
    await this.showLocalNotification(
      '✅ Заказ доставлен!',
      `Ваш заказ #${orderNumber} успешно доставлен`,
      { type: 'order_delivered' }
    );
  }

  // Show order cancelled notification (for users/farmers)
  async showOrderCancelledNotification(orderNumber: string, reason?: string): Promise<void> {
    await this.showLocalNotification(
      '❌ Заказ отменен',
      `Заказ #${orderNumber}${reason ? `: ${reason}` : ''}`,
      { type: 'order_cancelled' }
    );
  }

  // Show product available notification (for users)
  async showProductAvailableNotification(productName: string, farmerName: string): Promise<void> {
    await this.showLocalNotification(
      '🥬 Товар доступен!',
      `${productName} от ${farmerName} теперь в наличии`,
      { type: 'product_available' }
    );
  }

  // Show product out of stock notification (for users)
  async showProductOutOfStockNotification(productName: string): Promise<void> {
    await this.showLocalNotification(
      '⚠️ Товар закончился',
      `${productName} временно недоступен`,
      { type: 'product_out_of_stock' }
    );
  }

  // Show price changed notification (for users)
  async showPriceChangedNotification(productName: string, oldPrice: number, newPrice: number): Promise<void> {
    const change = newPrice - oldPrice;
    const isIncrease = change > 0;

    await this.showLocalNotification(
      isIncrease ? '📈 Цена увеличилась' : '📉 Цена снизилась',
      `${productName}: ${oldPrice.toFixed(2)}₽ → ${newPrice.toFixed(2)}₽`,
      { type: 'price_changed', amount: change }
    );
  }

  // Show farmer response notification (for users)
  async showFarmerResponseNotification(farmerName: string, message: string): Promise<void> {
    await this.showLocalNotification(
      `💬 Ответ от ${farmerName}`,
      message,
      { type: 'farmer_response' }
    );
  }

  // Show weight updated notification (for users)
  async showWeightUpdatedNotification(orderNumber: string, productName: string, weight: number): Promise<void> {
    await this.showLocalNotification(
      '⚖️ Вес обновлен',
      `Заказ #${orderNumber}: ${productName} - ${weight} кг`,
      { type: 'weight_updated' }
    );
  }

  // Show delivery update notification (for users)
  async showDeliveryUpdateNotification(orderNumber: string, status: string, eta?: string): Promise<void> {
    await this.showLocalNotification(
      '🚚 Обновление доставки',
      `Заказ #${orderNumber}: ${status}${eta ? `. Ожидаемое время: ${eta}` : ''}`,
      { type: 'delivery_update', status }
    );
  }
}

export const notificationsService = new NotificationsService();

// API methods for notifications
export const notificationsApi = {
  // Get all notifications for current user
  getNotifications: async (): Promise<Notification[]> => {
    const response = await axios.get<Notification[]>('/Notifications');
    return response.data;
  },

  // Get notification by id
  getNotification: async (id: number): Promise<Notification> => {
    const response = await axios.get<Notification>(`/Notifications/${id}`);
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (id: number): Promise<void> => {
    await axios.post(`/Notifications/${id}/read`);
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<void> => {
    await axios.post('/Notifications/read-all');
  },

  // Register device token
  registerDeviceToken: async (data: DeviceTokenRequest): Promise<void> => {
    await axios.post('/Notifications/register', data);
  },

  // Unregister device token
  unregisterDeviceToken: async (): Promise<void> => {
    await axios.post('/Notifications/unregister');
  },
};
