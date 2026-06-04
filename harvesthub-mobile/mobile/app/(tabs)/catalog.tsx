import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ProductCard } from '@/components/products/ProductCard';
import { productsService } from '@/services/products';
import type { ProductDto } from '@/types/backend';

export default function CatalogScreen() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setError(null);
      const result = search.trim()
        ? await productsService.search(search.trim())
        : await productsService.getAll();
      setProducts(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить каталог');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadProducts();
    }, 350);

    return () => clearTimeout(timeout);
  }, [loadProducts]);

  const headerText = useMemo(() => {
    if (isLoading) {
      return 'Загружаем каталог...';
    }

    return `${products.length} товаров в каталоге`;
  }, [isLoading, products.length]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0d1f15" />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadProducts();
            }}
            tintColor="#74c69d"
          />
        }>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <MaterialCommunityIcons name="basket" size={32} color="#74c69d" />
          </View>
          <View>
            <Text style={styles.title}>Каталог</Text>
            <Text style={styles.subtitle}>{headerText}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={22} color="#5a7c6b" style={styles.searchIcon} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Поиск по продуктам..."
            placeholderTextColor="#5a7c6b"
            style={styles.search}
          />
          {search.length > 0 && (
            <MaterialCommunityIcons
              name="close-circle"
              size={20}
              color="#5a7c6b"
              onPress={() => setSearch('')}
              style={styles.searchClear}
            />
          )}
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#74c69d" />
            <Text style={styles.loadingText}>Загружаем товары...</Text>
          </View>
        )}

        {/* Error */}
        {error ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={40} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Products Grid */}
        {!isLoading && (
          <View style={styles.productsGrid}>
            {products.map((product) => (
              <ProductCard key={product.productId} product={product} />
            ))}
          </View>
        )}

        {/* Empty State */}
        {!isLoading && products.length === 0 && (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="basket-off" size={64} color="#5a7c6b" />
            <Text style={styles.emptyTitle}>Нет товаров</Text>
            <Text style={styles.emptySubtitle}>Попробуйте изменить поиск или зайдите позже</Text>
          </View>
        )}
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
    backgroundColor: '#0d1f15',
  },
  container: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 100,
    gap: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#8fa89a',
    fontSize: 15,
    fontWeight: '400',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchIcon: {
    marginRight: 4,
  },
  search: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
  },
  searchClear: {
    marginLeft: 8,
  },

  // Grid
  productsGrid: {
    gap: 12,
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    gap: 16,
  },
  loadingText: {
    color: '#8fa89a',
    fontSize: 16,
    fontWeight: '500',
  },

  // Error
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    gap: 16,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#8fa89a',
    fontSize: 14,
    textAlign: 'center',
  },
});
