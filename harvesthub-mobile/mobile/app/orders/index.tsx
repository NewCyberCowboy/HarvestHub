import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import { ordersService } from '@/services/orders';
import type { OrderDto } from '@/types/backend';

export default function OrdersScreen() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      if (!token) {
        return;
      }

      try {
        const result = await ordersService.getMyOrders(token);
        setOrders(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить заказы');
      }
    };

    void loadOrders();
  }, [token]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Мои заказы</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {orders.map((order) => (
        <View key={order.orderId} style={styles.card}>
          <Text style={styles.number}>#{order.orderNumber}</Text>
          <Text style={styles.meta}>Статус: {order.status}</Text>
          <Text style={styles.meta}>Сумма: {order.totalAmount.toFixed(2)} ₽</Text>
          <Text style={styles.address}>{order.deliveryAddress}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#f7faf7',
  },
  container: {
    padding: 16,
    gap: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#16301f',
  },
  error: {
    color: '#b42318',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    gap: 6,
  },
  number: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16301f',
  },
  meta: {
    color: '#587061',
  },
  address: {
    color: '#405248',
  },
});
