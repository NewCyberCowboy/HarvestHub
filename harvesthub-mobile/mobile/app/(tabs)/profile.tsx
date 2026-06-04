import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '@/components/ui/AppButton';
import { useAuth } from '@/hooks/useAuth';
import { ordersService } from '@/services/orders';
import type { OrderDto } from '@/types/backend';

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!token) {
      setOrders([]);
      return;
    }

    try {
      const result = await ordersService.getMyOrders(token);
      setOrders(result);
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0d1f15" />
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="account-circle" size={80} color="#5a7c6b" />
          <Text style={styles.title}>Профиль</Text>
          <Text style={styles.text}>Войдите, чтобы увидеть заказы и данные профиля</Text>
          <AppButton title="Войти" onPress={() => router.push('/auth/login')} />
          <AppButton title="Зарегистрироваться" variant="secondary" onPress={() => router.push('/auth/register')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0d1f15" />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadOrders();
            }}
            tintColor="#74c69d"
          />
        }>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <MaterialCommunityIcons name="account" size={32} color="#74c69d" />
          </View>
          <View>
            <Text style={styles.kicker}>Личный кабинет</Text>
            <Text style={styles.title}>
              {user.firstName || user.lastName || user.email || 'Пользователь'}
            </Text>
          </View>
        </View>

        {/* User Card */}
        <View style={styles.heroCard}>
          <View style={styles.userInfoRow}>
            <MaterialCommunityIcons name="email" size={20} color="#74c69d" />
            <Text style={styles.text}>{user.email}</Text>
          </View>
          <View style={styles.userInfoRow}>
            <MaterialCommunityIcons name="phone" size={20} color="#74c69d" />
            <Text style={styles.text}>{user.phone}</Text>
          </View>
          <View style={styles.userInfoRow}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#74c69d" />
            <Text style={styles.text}>{user.address}</Text>
          </View>
          <AppButton title="Выйти из аккаунта" variant="secondary" onPress={() => logout()} />
        </View>

        {/* Orders Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="clipboard-list" size={24} color="#74c69d" />
            <Text style={styles.sectionTitle}>Мои заказы</Text>
          </View>
          {orders.length === 0 ? (
            <View style={styles.emptyOrders}>
              <MaterialCommunityIcons name="package-variant" size={48} color="#5a7c6b" />
              <Text style={styles.text}>Заказов пока нет</Text>
            </View>
          ) : (
            orders.map((order) => (
              <View key={order.orderId} style={styles.orderRow}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNumber} numberOfLines={1}>#{order.orderNumber || order.orderId}</Text>
                  <Text style={styles.orderAmount}>{order.totalAmount.toFixed(0)}₽</Text>
                </View>
                <Text style={styles.orderStatus}>{order.status}</Text>
              </View>
            ))
          )}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navButtonsContainer}>
          <TouchableOpacity style={styles.navButton} onPress={() => router.push('/orders')}>
            <MaterialCommunityIcons name="clipboard-list" size={22} color="#74c69d" />
            <Text style={styles.navButtonText}>Все заказы</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#5a7c6b" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navButton} onPress={() => router.push('/addresses')}>
            <MaterialCommunityIcons name="map-marker" size={22} color="#74c69d" />
            <Text style={styles.navButtonText}>Адреса доставки</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#5a7c6b" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navButton} onPress={() => router.push('/favorites')}>
            <MaterialCommunityIcons name="heart" size={22} color="#74c69d" />
            <Text style={styles.navButtonText}>Избранное</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#5a7c6b" />
          </TouchableOpacity>

          {(user.role === 'Farmer' || user.role === 'Admin') ? (
            <TouchableOpacity style={[styles.navButton, styles.navButtonHighlight]} onPress={() => router.push('/farmer')}>
              <MaterialCommunityIcons name="sprout" size={22} color="#74c69d" />
              <Text style={styles.navButtonText}>Панель фермера</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#5a7c6b" />
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0d1f15',
    paddingTop: 0,
  },
  screen: {
    backgroundColor: '#0d1f15',
  },
  container: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 100,
    gap: 16,
  },
  emptyState: {
    flex: 1,
    backgroundColor: '#0d1f15',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },

  // Header - Compact to prevent overflow
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 4,
    paddingRight: 8,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(116,198,157,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(116,198,157,0.3)',
    flexShrink: 0,
  },
  headerContent: {
    flex: 1,
    flexShrink: 1,
  },

  // Cards
  heroCard: {
    backgroundColor: 'rgba(116,198,157,0.15)',
    borderRadius: 24,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(116,198,157,0.3)',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },

  // Typography
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  kicker: {
    color: '#74c69d',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  text: {
    color: '#8fa89a',
    fontSize: 15,
    lineHeight: 22,
  },

  // User Info
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },

  // Empty Orders
  emptyOrders: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },

  // Orders
  orderRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 6,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  orderNumber: {
    fontWeight: '700',
    color: '#74c69d',
    fontSize: 16,
    flex: 1,
    flexShrink: 1,
  },
  orderAmount: {
    fontWeight: '700',
    color: '#74c69d',
    fontSize: 16,
    flexShrink: 0,
  },
  orderStatus: {
    color: '#8fa89a',
    fontSize: 14,
    textTransform: 'capitalize',
  },

  // Navigation Buttons - Dark glassmorphism
  navButtonsContainer: {
    gap: 10,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  navButtonHighlight: {
    backgroundColor: 'rgba(45,106,79,0.3)',
    borderColor: 'rgba(116,198,157,0.4)',
  },
  navButtonText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
