import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { useAuth } from '@/hooks/useAuth';
import { favoritesService } from '@/services/favorites';
import type { FavoriteDto } from '@/types/backend';

export default function FavoritesScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteDto[]>([]);

  const loadFavorites = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const result = await favoritesService.getAll(token);
      setFavorites(result);
    } catch (err) {
      Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось загрузить избранное');
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void loadFavorites();
    }, [loadFavorites])
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Избранное</Text>
      {favorites.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Пока ничего не добавлено</Text>
          <Text style={styles.emptyText}>Отмечай любимые товары с карточки продукта.</Text>
        </View>
      ) : null}
      {favorites.map((favorite) => (
        <TouchableOpacity
          key={favorite.favoriteId}
          style={styles.card}
          onPress={() => router.push(`/product/${favorite.productId}`)}>
          <Text style={styles.productTitle}>{favorite.productName}</Text>
          <Text style={styles.meta}>{favorite.productDescription || 'Фермерский продукт'}</Text>
          <Text style={styles.price}>{favorite.productPrice.toFixed(2)} ₽</Text>
          <Text style={styles.meta}>Статус: {favorite.productStatus}</Text>
          <AppButton
            title="Удалить из избранного"
            variant="danger"
            onPress={async () => {
              if (!token) {
                return;
              }
              await favoritesService.remove(favorite.productId, token);
              await loadFavorites();
            }}
          />
        </TouchableOpacity>
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
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#16301f',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16301f',
  },
  emptyText: {
    color: '#587061',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16301f',
  },
  meta: {
    color: '#587061',
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16301f',
  },
});
