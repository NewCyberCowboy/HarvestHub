import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface Notification {
  id: number;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, [token]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Notification[]>('/Notifications', { token });
      setNotifications(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить уведомления');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await apiRequest(`/Notifications/${id}/read`, { method: 'POST', token });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiRequest('/Notifications/read-all', { method: 'POST', token });
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
      'new_order': 'cart',
      'order_status_changed': 'package',
      'order_delivered': 'check-circle',
      'order_cancelled': 'close-circle',
      'product_available': 'leaf',
      'product_out_of_stock': 'alert',
      'price_changed': 'tag',
      'farmer_response': 'message',
      'weight_updated': 'scale',
      'delivery_update': 'truck',
    };
    return icons[type] || 'bell';
  };

  const getNotificationColor = (type: string) => {
    const colors: Record<string, string> = {
      'new_order': '#74c69d',
      'order_status_changed': '#52b788',
      'order_delivered': '#40916c',
      'order_cancelled': '#ef4444',
      'product_available': '#74c69d',
      'product_out_of_stock': '#f59e0b',
      'price_changed': '#8b5cf6',
      'farmer_response': '#3b82f6',
      'weight_updated': '#10b981',
      'delivery_update': '#f97316',
    };
    return colors[type] || '#8fa89a';
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Уведомления</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllButtonText}>Прочитать все ({unreadCount})</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadNotifications} tintColor="#74c69d" />
        }
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#74c69d" />
            <Text style={styles.loadingText}>Загрузка...</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.centered}>
            <MaterialCommunityIcons name="bell-off" size={48} color="#8fa89a" />
            <Text style={styles.emptyText}>Уведомлений пока нет</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationItem,
                  !notification.isRead && styles.unreadItem,
                ]}
                onPress={() => {
                  if (!notification.isRead) {
                    markAsRead(notification.id);
                  }
                  router.push(`/notifications/${notification.id}` as any);
                }}
              >
                <View style={styles.notificationIcon}>
                  <MaterialCommunityIcons
                    name={getNotificationIcon(notification.type)}
                    size={24}
                    color={getNotificationColor(notification.type)}
                  />
                  {!notification.isRead && <View style={styles.unreadDot} />}
                </View>

                <View style={styles.notificationContent}>
                  <Text style={[
                    styles.notificationTitle,
                    !notification.isRead && styles.unreadTitle
                  ]} numberOfLines={2}>
                    {notification.title}
                  </Text>
                  <Text style={styles.notificationBody} numberOfLines={2}>
                    {notification.body}
                  </Text>
                  <Text style={styles.notificationDate}>
                    {new Date(notification.createdAt).toLocaleString('ru-RU')}
                  </Text>
                </View>

                <MaterialCommunityIcons name="chevron-right" size={20} color="#5a7c6b" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1f15',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(116,198,157,0.1)',
    borderRadius: 8,
  },
  markAllButtonText: {
    color: '#74c69d',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    color: '#8fa89a',
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    color: '#ef4444',
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    color: '#8fa89a',
    marginTop: 12,
    fontSize: 16,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  unreadItem: {
    backgroundColor: 'rgba(116,198,157,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(116,198,157,0.2)',
  },
  notificationIcon: {
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#74c69d',
    borderWidth: 2,
    borderColor: '#0d1f15',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    color: '#b8c4b8',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  unreadTitle: {
    color: '#74c69d',
    fontWeight: '700',
  },
  notificationBody: {
    color: '#8fa89a',
    fontSize: 14,
    marginBottom: 4,
  },
  notificationDate: {
    color: '#5a7c6b',
    fontSize: 12,
  },
});
