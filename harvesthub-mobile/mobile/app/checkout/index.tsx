import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { addressesService } from '@/services/addresses';
import { ordersService } from '@/services/orders';
import type { AddressDto } from '@/types/backend';

export default function CheckoutScreen() {
  const { items, totalPrice, clearCart } = useCart();
  const { token, user } = useAuth();
  const [savedAddresses, setSavedAddresses] = useState<AddressDto[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadDefaultAddress = async () => {
      if (!token) {
        return;
      }

      try {
        const addresses = await addressesService.getAll(token);
        setSavedAddresses(addresses);
        const address = await addressesService.getDefault(token);
        const fullAddress = [
          address.street,
          address.apartment ? `кв. ${address.apartment}` : '',
          address.city,
          address.country,
          address.postalCode,
        ]
          .filter(Boolean)
          .join(', ');
        setDeliveryAddress(fullAddress);
      } catch {
        if (user?.address) {
          setDeliveryAddress(user.address);
        }
      }
    };

    void loadDefaultAddress();
  }, [token, user?.address]);

  const handleCheckout = async () => {
    if (!token) {
      Alert.alert('Нужен вход', 'Чтобы оформить заказ, войди в аккаунт.');
      router.push('/auth/login');
      return;
    }

    if (!deliveryAddress.trim()) {
      Alert.alert('Заполни адрес', 'Укажи адрес доставки.');
      return;
    }

    try {
      setIsSubmitting(true);
      const order = await ordersService.create(
        {
          deliveryAddress,
          customerNotes: notes,
          items: items.map((item) => ({
            productId: item.product.productId,
            quantity: item.quantity,
            expectedWeight: item.expectedWeight,
            price: item.product.basePrice,
          })),
        },
        token
      );

      clearCart();
      Alert.alert('Заказ оформлен', `Номер заказа: ${order.orderNumber}`);
      router.replace('/orders');
    } catch (err) {
      Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось оформить заказ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Оформление заказа</Text>
      <Text style={styles.subtitle}>Товаров в заказе: {items.length}</Text>

      <View style={styles.card}>
        {savedAddresses.length > 0 ? (
          <View style={styles.addressPicker}>
            <Text style={styles.addressPickerTitle}>Сохранённые адреса</Text>
            {savedAddresses.map((address) => {
              const fullAddress = [
                address.street,
                address.apartment ? `кв. ${address.apartment}` : '',
                address.city,
                address.country,
                address.postalCode,
              ]
                .filter(Boolean)
                .join(', ');

              const selected = deliveryAddress === fullAddress;

              return (
                <TouchableOpacity
                  key={address.addressId}
                  style={[styles.addressOption, selected && styles.addressOptionSelected]}
                  onPress={() => setDeliveryAddress(fullAddress)}>
                  <Text style={styles.addressOptionText}>{fullAddress}</Text>
                  {address.isDefault ? <Text style={styles.defaultBadge}>Основной</Text> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
        <AppInput
          label="Адрес доставки"
          value={deliveryAddress}
          onChangeText={setDeliveryAddress}
          placeholder="Город, улица, дом"
        />
        <AppInput
          label="Комментарий"
          value={notes}
          onChangeText={setNotes}
          placeholder="Домофон, этаж, пожелания"
          multiline
        />
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>К оплате</Text>
        <Text style={styles.summaryValue}>{totalPrice.toFixed(2)} ₽</Text>
      </View>

      <AppButton title="Подтвердить заказ" onPress={handleCheckout} loading={isSubmitting} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#f7faf7',
  },
  container: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#16301f',
  },
  subtitle: {
    color: '#587061',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  addressPicker: {
    gap: 8,
  },
  addressPickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16301f',
  },
  addressOption: {
    borderWidth: 1,
    borderColor: '#d0ddd5',
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  addressOptionSelected: {
    borderColor: '#1f7a45',
    backgroundColor: '#edf7f0',
  },
  addressOptionText: {
    color: '#16301f',
    lineHeight: 20,
  },
  defaultBadge: {
    color: '#1f7a45',
    fontSize: 12,
    fontWeight: '700',
  },
  summary: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    gap: 6,
  },
  summaryLabel: {
    color: '#587061',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#16301f',
  },
});
