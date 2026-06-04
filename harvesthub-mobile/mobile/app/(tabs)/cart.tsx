import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, SafeAreaView, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '@/components/ui/AppButton';
import { useCart } from '@/hooks/useCart';

export default function CartScreen() {
  const { items, totalPrice, updateQuantity, removeItem, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0d1f15" />
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="cart-outline" size={80} color="#5a7c6b" />
          <Text style={styles.emptyTitle}>Корзина пуста</Text>
          <Text style={styles.emptyText}>Добавьте товары из каталога</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/(tabs)/catalog')}>
            <Text style={styles.emptyButtonText}>Перейти в каталог</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0d1f15" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <MaterialCommunityIcons name="cart" size={32} color="#74c69d" />
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Корзина</Text>
            <Text style={styles.subtitle}>{items.length} товаров · {totalPrice.toFixed(0)}₽</Text>
          </View>
          <TouchableOpacity style={styles.clearButton} onPress={() => clearCart()}>
            <MaterialCommunityIcons name="delete-sweep" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Cart Items */}
        {items.map((item) => (
          <View key={item.product.productId} style={styles.card}>
            <View style={styles.itemHeader}>
              <View style={styles.itemInfo}>
                <Text style={styles.productName} numberOfLines={1}>{item.product.name}</Text>
                <Text style={styles.meta}>
                  {item.product.basePrice.toFixed(0)}₽ / {item.product.unit || 'кг'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeItem(item.product.productId)}>
                <MaterialCommunityIcons name="trash-can" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>

            {/* Quantity Controls */}
            <View style={styles.itemFooter}>
              <View style={styles.quantityRow}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.product.productId, item.quantity - 1)}
                  disabled={item.quantity <= 1}>
                  <MaterialCommunityIcons name="minus" size={18} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.product.productId, item.quantity + 1)}>
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.totalLine}>
                {(item.product.basePrice * (item.expectedWeight || item.quantity)).toFixed(2)} ₽
              </Text>
            </View>
          </View>
        ))}

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Итого</Text>
          <Text style={styles.summaryValue}>{totalPrice.toFixed(2)} ₽</Text>
          <AppButton
            title="Оформить заказ"
            onPress={() => {
              if (items.length === 0) {
                Alert.alert('Корзина пуста');
                return;
              }
              router.push('/checkout');
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Base
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

  // Empty State
  emptyState: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: '#0d1f15',
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
  },
  emptyText: {
    fontSize: 15,
    color: '#8fa89a',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyButton: {
    backgroundColor: '#2d6a4f',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(116,198,157,0.3)',
  },
  emptyButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 4,
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(116,198,157,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(116,198,157,0.3)',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#8fa89a',
    fontSize: 15,
  },
  clearButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },

  // Card
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  // Item Header
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  itemInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  meta: {
    color: '#8fa89a',
    fontSize: 14,
    marginTop: 2,
  },
  removeButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },

  // Item Footer
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Quantity Controls
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2d6a4f',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(116,198,157,0.3)',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  quantityText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    minWidth: 28,
    textAlign: 'center',
  },
  totalLine: {
    fontSize: 18,
    fontWeight: '700',
    color: '#74c69d',
  },

  // Summary
  summary: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8fa89a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
});
