import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { getImageUrl } from '@/lib/config';
import { favoritesService } from '@/services/favorites';
import { ordersService } from '@/services/orders';
import { productsService } from '@/services/products';
import { reviewsService } from '@/services/reviews';
import type { OrderDto, ProductDto, ProductReviewsSummaryDto } from '@/types/backend';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addItem } = useCart();
  const { token } = useAuth();
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviewsSummary, setReviewsSummary] = useState<ProductReviewsSummaryDto | null>(null);
  const [eligibleOrders, setEligibleOrders] = useState<OrderDto[]>([]);
  const [reviewRating, setReviewRating] = useState('5');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        return;
      }

      try {
        const result = await productsService.getById(Number(id));
        setProduct(result);
        const summary = await reviewsService.getSummary(result.productId);
        setReviewsSummary(summary);

        if (token) {
          const favoriteState = await favoritesService.check(result.productId, token);
          setIsFavorite(favoriteState);
          const orders = await ordersService.getMyOrders(token);
          setEligibleOrders(
            orders.filter(
              (order) =>
                order.status === 'Delivered' &&
                order.items.some((item) => item.productId === result.productId)
            )
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить товар');
      }
    };

    void loadProduct();
  }, [id, token]);

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loading}>Загрузка товара...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        {product.imageUrl ? (
          <Image source={{ uri: getImageUrl(product.imageUrl) }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText}>🥕</Text>
          </View>
        )}
        <View style={styles.heroContent}>
          <Text style={styles.categoryBadge}>{product.categoryName}</Text>
          <Text style={styles.heroTitle}>{product.name}</Text>
          <Text style={styles.heroPrice}>{product.basePrice.toFixed(2)} ₽ за {product.unit || 'кг'}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.description}>{product.description || 'Описание скоро будет добавлено.'}</Text>

        <View style={styles.meta}>
          <Text style={styles.metaItem}>Фермер: {product.farmerName}</Text>
          <Text style={styles.metaItem}>Остаток: {product.currentStock} {product.unit || 'кг'}</Text>
          <Text style={styles.metaItem}>Статус: {product.status}</Text>
        </View>

        <AppButton
          title="Добавить в корзину"
          onPress={() => {
            addItem(product, 1, product.weightOptions?.[0] || 1);
            Alert.alert('Добавлено', 'Товар добавлен в корзину');
          }}
        />

        {token ? (
          <AppButton
            title={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
            variant="secondary"
            onPress={async () => {
              try {
                if (isFavorite) {
                  await favoritesService.remove(product.productId, token);
                  setIsFavorite(false);
                } else {
                  await favoritesService.add(product.productId, token);
                  setIsFavorite(true);
                }
              } catch (err) {
                Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось обновить избранное');
              }
            }}
          />
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Отзывы</Text>
        {reviewsSummary ? (
          <>
            <Text style={styles.reviewSummary}>
              Средняя оценка: {reviewsSummary.averageRating.toFixed(1)} из 5
            </Text>
            <Text style={styles.metaText}>Всего отзывов: {reviewsSummary.totalReviews}</Text>
            {reviewsSummary.reviews.filter((review) => review.isApproved).length === 0 ? (
              <Text style={styles.metaText}>Пока нет одобренных отзывов.</Text>
            ) : (
              reviewsSummary.reviews
                .filter((review) => review.isApproved)
                .map((review) => (
                  <View key={review.reviewId} style={styles.reviewCard}>
                    <Text style={styles.reviewAuthor}>{review.customerName || 'Покупатель'}</Text>
                    <Text style={styles.reviewRating}>Оценка: {review.rating}/5</Text>
                    <Text style={styles.reviewText}>{review.comment || 'Без комментария'}</Text>
                  </View>
                ))
            )}
          </>
        ) : (
          <Text style={styles.metaText}>Загрузка отзывов...</Text>
        )}
      </View>

      {token && eligibleOrders.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Оставить отзыв</Text>
          <Text style={styles.metaText}>
            Будет использован доставленный заказ #{eligibleOrders[0].orderNumber}.
          </Text>
          <TextInput
            value={reviewRating}
            onChangeText={setReviewRating}
            keyboardType="number-pad"
            style={styles.reviewInput}
            placeholder="Оценка от 1 до 5"
            placeholderTextColor="#8b9b91"
          />
          <TextInput
            value={reviewComment}
            onChangeText={setReviewComment}
            style={[styles.reviewInput, styles.reviewTextarea]}
            placeholder="Поделись впечатлениями"
            placeholderTextColor="#8b9b91"
            multiline
          />
          <AppButton
            title="Отправить отзыв"
            loading={isSubmittingReview}
            onPress={async () => {
              if (!token || !product) {
                return;
              }

              const rating = Number(reviewRating);
              if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
                Alert.alert('Ошибка', 'Оценка должна быть от 1 до 5');
                return;
              }

              try {
                setIsSubmittingReview(true);
                await reviewsService.create(
                  {
                    productId: product.productId,
                    orderId: eligibleOrders[0].orderId,
                    rating,
                    comment: reviewComment,
                  },
                  token
                );
                setReviewComment('');
                setReviewRating('5');
                const summary = await reviewsService.getSummary(product.productId);
                setReviewsSummary(summary);
                Alert.alert('Отзыв отправлен', 'Он появится после модерации.');
              } catch (err) {
                Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось отправить отзыв');
              } finally {
                setIsSubmittingReview(false);
              }
            }}
          />
        </View>
      ) : null}
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loading: {
    fontSize: 16,
    color: '#587061',
  },
  error: {
    color: '#b42318',
    fontSize: 16,
  },
  hero: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#e9f2eb',
  },
  image: {
    width: '100%',
    height: 320,
    backgroundColor: '#e9f2eb',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 72,
  },
  heroContent: {
    padding: 18,
    gap: 8,
    backgroundColor: '#ffffff',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dff2e4',
    color: '#1f7a45',
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: '#16301f',
  },
  heroPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f7a45',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#587061',
  },
  meta: {
    backgroundColor: '#f7faf7',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  metaItem: {
    color: '#405248',
    fontSize: 15,
  },
  metaText: {
    color: '#587061',
    lineHeight: 21,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16301f',
  },
  reviewSummary: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16301f',
  },
  reviewCard: {
    borderTopWidth: 1,
    borderTopColor: '#edf4ef',
    paddingTop: 12,
    gap: 4,
  },
  reviewAuthor: {
    fontWeight: '700',
    color: '#16301f',
  },
  reviewRating: {
    color: '#1f7a45',
    fontWeight: '700',
  },
  reviewText: {
    color: '#405248',
    lineHeight: 20,
  },
  reviewInput: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d0ddd5',
    backgroundColor: '#f8fbf8',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#16301f',
  },
  reviewTextarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
