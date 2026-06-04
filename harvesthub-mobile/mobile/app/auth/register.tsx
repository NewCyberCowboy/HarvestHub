import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterScreen() {
  const { register, isLoading } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
  });

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleRegister = async () => {
    try {
      await register({
        ...form,
        role: 'Customer',
      });
      router.replace('/(tabs)/profile');
    } catch (err) {
      Alert.alert('Ошибка регистрации', err instanceof Error ? err.message : 'Не удалось зарегистрироваться');
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Регистрация</Text>
        <AppInput label="Имя" value={form.firstName} onChangeText={(value) => update('firstName', value)} />
        <AppInput label="Фамилия" value={form.lastName} onChangeText={(value) => update('lastName', value)} />
        <AppInput label="Email" value={form.email} onChangeText={(value) => update('email', value)} />
        <AppInput label="Телефон" value={form.phone} onChangeText={(value) => update('phone', value)} />
        <AppInput label="Адрес" value={form.address} onChangeText={(value) => update('address', value)} />
        <AppInput
          label="Пароль"
          value={form.password}
          onChangeText={(value) => update('password', value)}
          secureTextEntry
        />
        <AppButton title="Создать аккаунт" onPress={handleRegister} loading={isLoading} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#f7faf7',
  },
  container: {
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    gap: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#16301f',
  },
});
