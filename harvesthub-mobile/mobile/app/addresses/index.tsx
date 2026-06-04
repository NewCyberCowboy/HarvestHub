import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { useAuth } from '@/hooks/useAuth';
import { addressesService } from '@/services/addresses';
import type { AddressDto } from '@/types/backend';

const emptyForm = {
  street: '',
  apartment: '',
  city: '',
  postalCode: '',
  country: 'Россия',
  isDefault: false,
};

export default function AddressesScreen() {
  const { token } = useAuth();
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadAddresses = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const result = await addressesService.getAll(token);
      setAddresses(result);
    } catch (err) {
      Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось загрузить адреса');
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void loadAddresses();
    }, [loadAddresses])
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!token) {
      Alert.alert('Вход обязателен');
      return;
    }

    if (!form.street.trim() || !form.city.trim() || !form.postalCode.trim()) {
      Alert.alert('Заполни основные поля адреса');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingId) {
        await addressesService.update(editingId, form, token);
      } else {
        await addressesService.create(form, token);
      }
      resetForm();
      await loadAddresses();
    } catch (err) {
      Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось сохранить адрес');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Адреса доставки</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{editingId ? 'Редактирование адреса' : 'Новый адрес'}</Text>
        <AppInput label="Улица и дом" value={form.street} onChangeText={(value) => setForm((prev) => ({ ...prev, street: value }))} />
        <AppInput label="Квартира" value={form.apartment} onChangeText={(value) => setForm((prev) => ({ ...prev, apartment: value }))} />
        <AppInput label="Город" value={form.city} onChangeText={(value) => setForm((prev) => ({ ...prev, city: value }))} />
        <AppInput label="Индекс" value={form.postalCode} onChangeText={(value) => setForm((prev) => ({ ...prev, postalCode: value }))} />
        <AppInput label="Страна" value={form.country} onChangeText={(value) => setForm((prev) => ({ ...prev, country: value }))} />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Сделать основным</Text>
          <Switch
            value={form.isDefault}
            onValueChange={(value) => setForm((prev) => ({ ...prev, isDefault: value }))}
          />
        </View>
        <AppButton
          title={editingId ? 'Сохранить изменения' : 'Добавить адрес'}
          onPress={handleSubmit}
          loading={isSubmitting}
        />
        {editingId ? <AppButton title="Отменить" variant="secondary" onPress={resetForm} /> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Сохранённые адреса</Text>
        {addresses.length === 0 ? <Text style={styles.meta}>Пока адресов нет.</Text> : null}
        {addresses.map((address) => (
          <View key={address.addressId} style={styles.addressRow}>
            <Text style={styles.addressTitle}>
              {address.street}, {address.apartment ? `кв. ${address.apartment}, ` : ''}
              {address.city}
            </Text>
            <Text style={styles.meta}>
              {address.country}, {address.postalCode}
            </Text>
            {address.isDefault ? <Text style={styles.defaultBadge}>Основной</Text> : null}
            <View style={styles.actions}>
              <AppButton
                title="Изменить"
                variant="secondary"
                onPress={() => {
                  setEditingId(address.addressId);
                  setForm({
                    street: address.street,
                    apartment: address.apartment,
                    city: address.city,
                    postalCode: address.postalCode,
                    country: address.country,
                    isDefault: address.isDefault,
                  });
                }}
              />
              {!address.isDefault ? (
                <AppButton
                  title="Сделать основным"
                  variant="secondary"
                  onPress={async () => {
                    if (!token) {
                      return;
                    }
                    await addressesService.setDefault(address.addressId, token);
                    await loadAddresses();
                  }}
                />
              ) : null}
              <AppButton
                title="Удалить"
                variant="danger"
                onPress={async () => {
                  if (!token) {
                    return;
                  }
                  await addressesService.remove(address.addressId, token);
                  await loadAddresses();
                }}
              />
            </View>
          </View>
        ))}
      </View>
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16301f',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    color: '#16301f',
    fontSize: 16,
    fontWeight: '600',
  },
  addressRow: {
    borderTopWidth: 1,
    borderTopColor: '#edf4ef',
    paddingTop: 12,
    gap: 6,
  },
  addressTitle: {
    color: '#16301f',
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    color: '#587061',
  },
  defaultBadge: {
    color: '#1f7a45',
    fontWeight: '700',
  },
  actions: {
    gap: 8,
    marginTop: 6,
  },
});
