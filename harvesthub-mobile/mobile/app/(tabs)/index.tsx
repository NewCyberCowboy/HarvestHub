import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ProductCard } from '@/components/products/ProductCard';
import { useAuth } from '@/hooks/useAuth';
import { categoriesService } from '@/services/categories';
import { productsService } from '@/services/products';
import type { CategoryDto, ProductDto } from '@/types/backend';

const categoryIcons: Record<string, string> = {
  vegetables: 'basket',
  fruits: 'fruit-cherries',
  dairy: 'bottle-tonic',
  eggs: 'egg',
  honey: 'honey-pot',
  meat: 'food-steak',
};

const featureCards = [
  {
    icon: 'sprout',
    title: '100% органик',
    description: 'Продукты от фермеров без лишних посредников',
  },
  {
    icon: 'truck-delivery',
    title: 'Быстрая доставка',
    description: 'Свежие продукты прямо к вашей двери',
  },
  {
    icon: 'shield-check',
    title: 'Контроль качества',
    description: 'Проверка каждого товара перед отправкой',
  },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHome = async () => {
      try {
        const [loadedProducts, loadedCategories] = await Promise.all([
          productsService.getAll(),
          categoriesService.getAll(),
        ]);

        setProducts(loadedProducts);
        setCategories(loadedCategories);
      } finally {
        setIsLoading(false);
      }
    };

    void loadHome();
  }, []);

  const featuredProducts = useMemo(() => products.slice(0, 4), [products]);
  const visibleCategories = useMemo(() => categories.slice(0, 8), [categories]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0d1f15" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View style={styles.logoMark} />
            <Text style={styles.heroBrand}>HarvestHub</Text>
          </View>

          <Text style={styles.heroOverline}>Местные фермеры</Text>
          <Text style={styles.heroTitle}>
            Свежие продукты{'\n'}
            <Text style={styles.heroTitleAccent}>прямо с фермы</Text>
          </Text>
          <Text style={styles.heroDescription}>
            Заказывай овощи, фрукты и фермерские продукты напрямую у локальных производителей.
          </Text>
          <TouchableOpacity style={styles.heroCTA} onPress={() => router.push('/(tabs)/catalog')}>
            <Text style={styles.heroCTAText}>В каталог</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#0d1f15" />
          </TouchableOpacity>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Почему выбирают нас</Text>
          <View style={styles.featuresGrid}>
            {featureCards.map((feature) => (
              <View key={feature.title} style={styles.featureCard}>
                <View style={styles.featureIconWrap}>
                  <MaterialCommunityIcons name={feature.icon as any} size={28} color="#74c69d" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Популярные категории</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/catalog')}>
              <Text style={styles.linkText}>Весь каталог →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesGrid}>
            {visibleCategories.map((category) => (
              <TouchableOpacity
                key={category.categoryId}
                style={styles.categoryCard}
                onPress={() => router.push('/(tabs)/catalog')}>
                <View style={styles.categoryIconWrap}>
                  <MaterialCommunityIcons
                    name={categoryIcons[category.name.toLowerCase()] || 'basket' as any}
                    size={28}
                    color="#74c69d"
                  />
                </View>
                <Text style={styles.categoryName} numberOfLines={2}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Products Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Свежая витрина</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/catalog')}>
              <Text style={styles.linkText}>Смотреть все →</Text>
            </TouchableOpacity>
          </View>

          {featuredProducts.map((product) => (
            <ProductCard key={product.productId} product={product} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0d1f15',
    paddingTop: 0,
  },
  screen: {
    flex: 1,
    backgroundColor: '#0d1f15',
  },
  container: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 100,
    gap: 20,
  },
  hero: {
    backgroundColor: 'rgba(116,198,157,0.15)',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(116,198,157,0.3)',
    overflow: 'hidden',
    gap: 18,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoMark: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: '#1f7a45',
  },
  heroBrand: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  heroCopy: {
    gap: 12,
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 8,
    letterSpacing: -0.5,
  },
  heroTitleAccent: {
    color: '#74c69d',
  },
  heroOverline: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: '#74c69d',
    letterSpacing: 1,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#8fa89a',
    marginTop: 10,
    lineHeight: 24,
  },
  heroCTA: {
    marginTop: 18,
    backgroundColor: '#74c69d',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroCTAText: {
    color: '#0d1f15',
    fontWeight: '700',
    fontSize: 16,
  },
  heroDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#8fa89a',
    maxWidth: '92%',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#1f7a45',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#b8d9bf',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1f7a45',
    fontSize: 16,
    fontWeight: '700',
  },
  heroVisual: {
    minHeight: 172,
    justifyContent: 'flex-end',
  },
  heroCircleLarge: {
    position: 'absolute',
    top: 6,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: 'rgba(31,122,69,0.12)',
  },
  heroCircleSmall: {
    position: 'absolute',
    top: 64,
    right: 80,
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  heroProduceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    width: '74%',
    shadowColor: '#86b394',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  heroProduceEmoji: {
    fontSize: 36,
    marginBottom: 6,
  },
  heroProduceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16301f',
  },
  heroProduceSubtext: {
    marginTop: 4,
    color: '#5e7868',
    lineHeight: 20,
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sectionHeader: {
    gap: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  sectionSubtitle: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 20,
    color: '#678171',
    maxWidth: 250,
  },
  linkText: {
    color: '#74c69d',
    fontWeight: '700',
    fontSize: 14,
  },
  featuresGrid: {
    gap: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  featureIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(116,198,157,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(116,198,157,0.3)',
  },
  featureContent: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  featureDescription: {
    color: '#8fa89a',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 14,
    minHeight: 98,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(116,198,157,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(116,198,157,0.3)',
  },
  categoryName: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 20,
  },
  bottomBanner: {
    backgroundColor: 'rgba(45,106,79,0.3)',
    borderRadius: 24,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(116,198,157,0.3)',
  },
  bottomBannerTitle: {
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  bottomBannerText: {
    color: '#8fa89a',
    lineHeight: 21,
  },
});
