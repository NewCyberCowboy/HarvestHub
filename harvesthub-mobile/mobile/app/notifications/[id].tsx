import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotification();
  }, [id, token]);

  const loadNotification = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Notification>(`/Notifications/${id}`, { token });
      setNotification(data);

      // Mark as read
      if (!data.isRead) {
        await apiRequest(`/Notifications/${id}/read`, { method: 'POST', token });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить уведомление');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#74c69d" />
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !notification) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error || 'Уведомление не найдено'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Уведомление</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.notificationCard, { borderLeftColor: getNotificationColor(notification.type) }]}>
          <View style={styles.notificationHeader}>
            <MaterialCommunityIcons
              name={getNotificationIcon(notification.type)}
              size={32}
              color={getNotificationColor(notification.type)}
            />
            <Text style={styles.notificationDate}>
              {new Date(notification.createdAt).toLocaleString('ru-RU')}
            </Text>
          </View>

          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <Text style={styles.notificationBody}>{notification.body}</Text>

          {notification.data && Object.keys(notification.data).length > 0 && (
            <View style={styles.dataSection}>
              <Text style={styles.dataTitle}>Дополнительная информация:</Text>
              {Object.entries(notification.data).map(([key, value]) => (
                <View key={key} style={styles.dataRow}>
                  <Text style={styles.dataKey}>{key}:</Text>
                  <Text style={styles.dataValue}>{String(value)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1f15',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  notificationCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  notificationDate: {
    color: '#8fa89a',
    fontSize: 12,
  },
  notificationTitle: {
    color: '#74c69d',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  notificationBody: {
    color: '#b8c4b8',
    fontSize: 16,
    lineHeight: 24,
  },
  dataSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  dataTitle: {
    color: '#8fa89a',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  dataRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dataKey: {
    color: '#8fa89a',
    fontSize: 14,
    width: 120,
  },
  dataValue: {
    color: '#74c69d',
    fontSize: 14,
    flex: 1,
  },
});
