import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { favoritesService } from '@/services/favorites';
import { getImageUrl } from '@/lib/config';
import type { ProductDto } from '@/types/backend';

interface ProductCardProps {
  product: ProductDto;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { token } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);

  const handleAddToCart = () => {
    addItem(product, 1);
    Alert.alert('Добавлено в корзину', `${product.name} — 1 ${product.unit || 'кг'}`);
  };

  const handleAddToFavorites = async () => {
    if (!token) {
      Alert.alert('Требуется авторизация', 'Войдите, чтобы добавить в избранное');
      return;
    }
    try {
      await favoritesService.add(product.productId, token);
      setIsFavorite(true);
      Alert.alert('Добавлено в избранное', product.name);
    } catch (err) {
      Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось добавить в избранное');
    }
  };

  return (
    <TouchableOpacity
      onPress={() => router.push(`/product/${product.productId}`)}
      style={styles.card}
      activeOpacity={0.9}>
      {/* Image */}
      {product.imageUrl ? (
        <Image source={{ uri: getImageUrl(product.imageUrl) }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <MaterialCommunityIcons name="sprout" size={48} color="#74c69d" />
        </View>
      )}

      {/* Content */}
      <View style={styles.body}>
        {/* Category Badge */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{product.categoryName}</Text>
        </View>

        {/* Title & Description */}
        <Text style={styles.title} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {product.description || 'Свежий фермерский продукт'}
        </Text>

        {/* Price Row */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>{product.basePrice.toFixed(0)}₽</Text>
          <Text style={styles.unit}>/{product.unit || 'кг'}</Text>
        </View>

        {/* Stock Indicator */}
        <View style={styles.stockRow}>
          <View style={[styles.stockDot, product.currentStock > 0 && styles.stockDotAvailable]} />
          <Text style={styles.stockText}>
            {product.currentStock > 0 ? `В наличии: ${product.currentStock}` : 'Нет в наличии'}
          </Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.cartButton, product.currentStock === 0 && styles.cartButtonDisabled]}
            onPress={handleAddToCart}
            disabled={product.currentStock === 0}>
            <MaterialCommunityIcons name="cart-plus" size={18} color="#fff" />
            <Text style={[styles.cartButtonText, product.currentStock === 0 && styles.cartButtonTextDisabled]}>В корзину</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.favButton, isFavorite && styles.favButtonActive]}
            onPress={handleAddToFavorites}>
            <MaterialCommunityIcons
              name={isFavorite ? "heart" : "heart-outline"}
              size={22}
              color={isFavorite ? "#ef4444" : "#8fa89a"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // 2026 Glassmorphism Card
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Body Content
  body: {
    padding: 18,
    gap: 8,
  },

  // Category Badge
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(116,198,157,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(116,198,157,0.3)',
  },
  categoryText: {
    color: '#74c69d',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Typography
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  description: {
    color: '#8fa89a',
    fontSize: 14,
    lineHeight: 20,
  },

  // Price Row
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 4,
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: '#74c69d',
    letterSpacing: -0.5,
  },
  unit: {
    color: '#8fa89a',
    fontSize: 14,
    fontWeight: '500',
  },

  // Stock Indicator
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  stockDotAvailable: {
    backgroundColor: '#10b981',
  },
  stockText: {
    color: '#8fa89a',
    fontSize: 12,
    fontWeight: '500',
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  cartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2d6a4f',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(116,198,157,0.3)',
  },
  cartButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cartButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  cartButtonTextDisabled: {
    color: '#8fa89a',
  },
  favButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  favButtonActive: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
});
