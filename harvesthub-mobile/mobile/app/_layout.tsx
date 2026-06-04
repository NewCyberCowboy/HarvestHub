import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <CartProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth/login" options={{ title: 'Вход' }} />
            <Stack.Screen name="auth/register" options={{ title: 'Регистрация' }} />
            <Stack.Screen name="product/[id]" options={{ title: 'Товар' }} />
            <Stack.Screen name="checkout/index" options={{ title: 'Оформление заказа' }} />
            <Stack.Screen name="orders/index" options={{ title: 'Мои заказы' }} />
            <Stack.Screen name="addresses/index" options={{ title: 'Адреса' }} />
            <Stack.Screen name="favorites/index" options={{ title: 'Избранное' }} />
            <Stack.Screen name="farmer/index" options={{ title: 'Панель фермера' }} />
          </Stack>
          <StatusBar style="auto" />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
