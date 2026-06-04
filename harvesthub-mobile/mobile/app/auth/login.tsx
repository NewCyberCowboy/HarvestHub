import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await login({ email, password });
      router.replace('/(tabs)/profile');
    } catch (err) {
      Alert.alert('Ошибка входа', err instanceof Error ? err.message : 'Не удалось войти');
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Вход</Text>
        <Text style={styles.subtitle}>Используется тот же backend API, что и у web-версии.</Text>
        <AppInput label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" />
        <AppInput
          label="Пароль"
          value={password}
          onChangeText={setPassword}
          placeholder="Введите пароль"
          secureTextEntry
        />
        <AppButton title="Войти" onPress={handleLogin} loading={isLoading} />
        <AppButton title="Создать аккаунт" variant="secondary" onPress={() => router.push('/auth/register')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#f7faf7',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
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
  subtitle: {
    color: '#587061',
    lineHeight: 22,
  },
});
