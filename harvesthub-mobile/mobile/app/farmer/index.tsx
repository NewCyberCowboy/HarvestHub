import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { Svg } from 'react-native-svg';
import * as Notifications from 'expo-notifications';
import NetInfo from '@react-native-community/netinfo';

import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { useAuth } from '@/hooks/useAuth';
import { categoriesService } from '@/services/categories';
import { ordersService } from '@/services/orders';
import { offlineProductsService, type OfflineProductDraft } from '@/services/offlineProducts';
import { productsService } from '@/services/products';
import { notificationsService } from '@/services/notifications';
import { productDraftsService } from '@/services/productDrafts';
import { productTemplatesService, type ProductTemplate } from '@/services/productTemplates';
import { changeHistoryService, type ProductChangeRecord } from '@/services/changeHistory';
import { productImagesService, type ImageUploadResult } from '@/services/productImages';
import { analyticsService } from '@/services/analytics';
import type { CategoryDto, FarmerAnalyticsDto, OrderDto, ProductDto } from '@/types/backend';

type TabKey = 'products' | 'orders' | 'analytics';

// Voice recording indicator component with modern wave animation
function VoiceIndicator({ active, label }: { active: boolean; label: string }) {
  if (!active) return null;
  return (
    <View style={styles.voiceIndicator}>
      <View style={styles.voiceWave}>
        <View style={[styles.voiceDot, styles.voiceDot1]} />
        <View style={[styles.voiceDot, styles.voiceDot2]} />
        <View style={[styles.voiceDot, styles.voiceDot3]} />
        <View style={[styles.voiceDot, styles.voiceDot4]} />
        <View style={[styles.voiceDot, styles.voiceDot5]} />
      </View>
      <MaterialCommunityIcons name="microphone" size={16} color="#fff" />
      <Text style={styles.voiceText}>{label}</Text>
    </View>
  );
}

// Modern Tab Button Component
function TabButton({
  active,
  label,
  icon,
  onPress,
}: {
  active: boolean;
  label: string;
  icon: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
      activeOpacity={0.8}>
      <MaterialCommunityIcons
        name={icon as any}
        size={22}
        color={active ? '#fff' : '#5a7c6b'}
        style={styles.tabIcon}
      />
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
      {active && <View style={styles.tabIndicator} />}
    </TouchableOpacity>
  );
}

// Modern Card Component with Glassmorphism
function GlassCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[styles.glassCard, style]}>
      <View style={styles.glassCardInner}>{children}</View>
    </View>
  );
}

// Category Chip Component
function CategoryChip({ name, active, onPress }: { name: string; active?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.categoryChip, active && styles.categoryChipActive]}
      onPress={onPress}
      activeOpacity={0.8}>
      <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]} numberOfLines={1}>
        {name}
      </Text>
    </TouchableOpacity>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const getStatusConfig = (s: string) => {
    switch (s) {
      case 'Pending':
        return { color: '#f59e0b', bg: 'rgba(245,158,11,0.2)', icon: 'clock-outline' };
      case 'Confirmed':
        return { color: '#3b82f6', bg: 'rgba(59,130,246,0.2)', icon: 'check-circle-outline' };
      case 'Completed':
        return { color: '#10b981', bg: 'rgba(16,185,129,0.2)', icon: 'check-circle' };
      case 'Cancelled':
        return { color: '#ef4444', bg: 'rgba(239,68,68,0.2)', icon: 'close-circle' };
      default:
        return { color: '#8fa89a', bg: 'rgba(143,168,154,0.2)', icon: 'help-circle' };
    }
  };
  const config = getStatusConfig(status);
  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bg, borderColor: config.color }]}>
      <MaterialCommunityIcons name={config.icon as any} size={14} color={config.color} />
      <Text style={[styles.statusBadgeText, { color: config.color }]}>{status}</Text>
    </View>
  );
}

// Metric Card Component
function MetricCard({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricCardHeader}>
        <MaterialCommunityIcons name={icon as any} size={24} color="#74c69d" />
        <Text style={styles.metricValue}>{value}</Text>
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const initialProductForm = {
  name: '',
  description: '',
  basePrice: '',
  currentStock: '',
  unit: 'кг',
  categoryId: '',
  storageConditions: '',
  imageUri: '',
};

const CONNECTIVITY_CHECK_INTERVAL_MS = 60_000;
const REQUIRED_STABLE_CONNECTION_CHECKS = 5;

export default function FarmerScreen() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('products');
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [analytics, setAnalytics] = useState<FarmerAnalyticsDto | null>(null);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingOfflineProductId, setEditingOfflineProductId] = useState<string | null>(null);
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [offlineDrafts, setOfflineDrafts] = useState<OfflineProductDraft[]>([]);
  const [serverDrafts, setServerDrafts] = useState<any[]>([]);
  const [stableConnectionChecks, setStableConnectionChecks] = useState(0);
  const [isSyncingOfflineProducts, setIsSyncingOfflineProducts] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [connectionStatusText, setConnectionStatusText] = useState('Подключено к интернету');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [productForm, setProductForm] = useState(initialProductForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const syncInProgressRef = useRef(false);

  // Templates
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  // Bulk edit
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [bulkPriceChange, setBulkPriceChange] = useState('');
  const [bulkStockChange, setBulkStockChange] = useState('');

  // Change history
  const [changeHistory, setChangeHistory] = useState<ProductChangeRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyStats, setHistoryStats] = useState({ totalChanges: 0, todayChanges: 0, priceChanges: 0, stockChanges: 0 });

  // Analytics loading state
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Order status modal
  const [statusModalOrder, setStatusModalOrder] = useState<OrderDto | null>(null);
  const [statusModalNotes, setStatusModalNotes] = useState('');

  // Order weight modal
  const [weightModalOrder, setWeightModalOrder] = useState<OrderDto | null>(null);
  const [orderWeights, setOrderWeights] = useState<Record<number, number>>({});

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingField, setRecordingField] = useState<string | null>(null);
  const recordingFieldRef = useRef<string | null>(null);

  useEffect(() => {
    recordingFieldRef.current = recordingField;
  }, [recordingField]);

  useSpeechRecognitionEvent('result', (event: any) => {
    console.log('Voice result event:', event);
    const currentField = recordingFieldRef.current;
    console.log('Current field:', currentField);
    if (event.results && event.results.length > 0) {
      const text = event.results[0].transcript;
      console.log('Recognized text:', text, 'Field:', currentField);
      if (currentField === 'search') {
        setSearch(text);
        Alert.alert('Голосовой ввод', `Поиск: ${text}`);
      } else if (currentField === 'basePrice') {
        // Extract numbers from text for price
        const numbers = text.match(/\d+/g);
        if (numbers) {
          const price = numbers.join('.');
          setProductForm((prev) => ({ ...prev, basePrice: price }));
          Alert.alert('Голосовой ввод', `Цена: ${price}`);
        } else {
          Alert.alert('Ошибка', 'Не удалось распознать число');
        }
      } else if (currentField === 'currentStock') {
        // Extract numbers from text for stock
        const numbers = text.match(/\d+/g);
        if (numbers) {
          const stock = numbers.join('');
          setProductForm((prev) => ({ ...prev, currentStock: stock }));
          Alert.alert('Голосовой ввод', `Количество: ${stock}`);
        } else {
          Alert.alert('Ошибка', 'Не удалось распознать число');
        }
      } else if (currentField) {
        setProductForm((prev) => ({ ...prev, [currentField]: text }));
        const fieldName = currentField === 'name' ? 'Название' : currentField === 'description' ? 'Описание' : currentField === 'storageConditions' ? 'Условия хранения' : 'Поле';
        Alert.alert('Голосовой ввод', `${fieldName}: ${text}`);
      }
      setIsRecording(false);
      setRecordingField(null);
      recordingFieldRef.current = null;
    } else {
      console.log('No results in event');
    }
  });

  useSpeechRecognitionEvent('error', (error: any) => {
    console.log('Voice error event:', error);
    Alert.alert('Ошибка распознавания', error?.message || 'Неизвестная ошибка');
    setIsRecording(false);
    setRecordingField(null);
  });

  useSpeechRecognitionEvent('end', () => {
    console.log('Voice recognition ended');
  });

  const startVoiceInput = useCallback(async (field: 'name' | 'description' | 'search' | 'basePrice' | 'currentStock' | 'storageConditions') => {
    try {
      setRecordingField(field);
      setIsRecording(true);

      await ExpoSpeechRecognitionModule.start({
        lang: 'ru-RU',
      });
    } catch (error) {
      console.error('Voice input error:', error);
      Alert.alert('Ошибка', 'Не удалось запустить голосовой ввод. Проверьте разрешение на микрофон.');
      setIsRecording(false);
      setRecordingField(null);
    }
  }, []);

  const stopVoiceInput = useCallback(async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
      setIsRecording(false);
      setRecordingField(null);
    } catch (error) {
      console.error('Stop voice error:', error);
      setIsRecording(false);
    }
  }, []);

  const loadOfflineDrafts = useCallback(async () => {
    if (!user || (user.role !== 'Farmer' && user.role !== 'Admin')) {
      setOfflineDrafts([]);
      return;
    }

    const drafts = await offlineProductsService.getForUser(user.userId);
    setOfflineDrafts(drafts);
  }, [user]);

  const loadTemplates = useCallback(async () => {
    const loaded = await productTemplatesService.getAll();
    setTemplates(loaded);
  }, []);

  const loadChangeHistory = useCallback(async () => {
    if (!user) return;
    const history = await changeHistoryService.getForUser(user.userId, 20);
    const stats = await changeHistoryService.getStats(user.userId);
    setChangeHistory(history);
    setHistoryStats(stats);
  }, [user]);

  const loadServerDrafts = useCallback(async () => {
    if (!token) return;
    try {
      const drafts = await productDraftsService.getMyDrafts(token);
      setServerDrafts(drafts);
    } catch (error) {
      console.error('Failed to load server drafts:', error);
    }
  }, [token]);

  const loadAnalytics = useCallback(async () => {
    if (!token) return;
    setIsLoadingAnalytics(true);
    try {
      const data = await analyticsService.getFarmerAnalytics(30, token);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [token]);

  const loadData = useCallback(async () => {
    if (!token || !user || (user.role !== 'Farmer' && user.role !== 'Admin')) {
      return;
    }

    try {
      const [loadedCategories, loadedProducts, loadedOrders, loadedAnalytics] = await Promise.all([
        categoriesService.getAll(token),
        productsService.getMyProducts(token),
        ordersService.getFarmerOrders(token),
        ordersService.getFarmerAnalytics(token, 30),
      ]);

      setCategories(loadedCategories);
      setProducts(loadedProducts);
      setOrders(loadedOrders);
      setAnalytics(loadedAnalytics);
      await loadOfflineDrafts();
      await loadServerDrafts();
      await loadTemplates();
      await loadChangeHistory();
    } catch (err) {
      Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось загрузить панель фермера');
      await loadOfflineDrafts();
    } finally {
      setRefreshing(false);
    }
  }, [loadOfflineDrafts, loadServerDrafts, loadTemplates, loadChangeHistory, token, user]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  // Monitor network connection
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      setIsConnected(connected);

      if (connected) {
        setConnectionStatusText('Подключено к интернету');
        setStableConnectionChecks((prev) => Math.min(prev + 1, REQUIRED_STABLE_CONNECTION_CHECKS));
      } else {
        setConnectionStatusText('Нет подключения к интернету');
        setStableConnectionChecks(0);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!token || !user || (user.role !== 'Farmer' && user.role !== 'Admin')) {
      return;
    }

    const checkConnection = async () => {
      if (!token) {
        return;
      }
      try {
        await categoriesService.getAll(token);
        setStableConnectionChecks((prev) => Math.min(prev + 1, REQUIRED_STABLE_CONNECTION_CHECKS));
      } catch {
        setStableConnectionChecks(0);
      }
    };

    void checkConnection();
    const intervalId = setInterval(checkConnection, CONNECTIVITY_CHECK_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [token, user]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalytics();
    }
  }, [activeTab, loadAnalytics]);

  useEffect(() => {
    if (
      !token ||
      !user ||
      offlineDrafts.length === 0 ||
      stableConnectionChecks < REQUIRED_STABLE_CONNECTION_CHECKS ||
      syncInProgressRef.current
    ) {
      return;
    }

    const syncDrafts = async () => {
      syncInProgressRef.current = true;
      setIsSyncingOfflineProducts(true);
      try {
        const result = await offlineProductsService.syncForUser(user.userId, token);
        await loadOfflineDrafts();
        if (result.syncedIds.length > 0) {
          await loadData();
          Alert.alert(
            'Синхронизация завершена',
            `Отправлено товаров: ${result.syncedIds.length}. Их можно редактировать после проверки в веб-версии.`
          );
        }
      } finally {
        setIsSyncingOfflineProducts(false);
        syncInProgressRef.current = false;
      }
    };

    void syncDrafts();
  }, [loadData, loadOfflineDrafts, offlineDrafts.length, stableConnectionChecks, token, user]);

  // Initialize notifications and register push token
  useEffect(() => {
    if (!token || !user || (user.role !== 'Farmer' && user.role !== 'Admin')) {
      return;
    }

    const initNotifications = async () => {
      try {
        // Request permissions
        const granted = await notificationsService.requestPermissions();
        if (!granted) {
          console.log('Notification permissions not granted');
          return;
        }

        // Get and register push token
        const pushToken = await notificationsService.getPushToken();
        if (pushToken) {
          console.log('Push token obtained:', pushToken);
          try {
            await notificationsService.registerDeviceToken(pushToken, token);
          } catch (error) {
            console.error('Failed to register device token:', error);
          }
        }

        // Set up notification listeners
        const subscription = Notifications.addNotificationReceivedListener((notification) => {
          console.log('Notification received:', notification);
          const data = notification.request.content.data as any;

          // Handle different notification types
          if (data.type === 'new_order') {
            // Refresh orders when new order notification received
            loadData();
          }
        });

        const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
          console.log('Notification response:', response);
          const data = response.notification.request.content.data as any;

          // Navigate based on notification type
          if (data.type === 'new_order' || data.type === 'order_status_changed') {
            setActiveTab('orders');
          }
        });

        return () => {
          subscription.remove();
          responseSubscription.remove();
        };
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    const cleanupPromise = initNotifications();
    return () => {
      cleanupPromise.then(cleanup => cleanup?.());
    };
  }, [token, user, loadData]);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return products;
    }

    return products.filter((product) =>
      [product.name, product.description || '', product.categoryName || '']
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [products, search]);

  if (!user || (user.role !== 'Farmer' && user.role !== 'Admin')) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Панель фермера</Text>
        <Text style={styles.meta}>Этот раздел доступен только фермерам и администраторам.</Text>
      </View>
    );
  }

  const resetForm = () => {
    setProductForm(initialProductForm);
    setEditingProductId(null);
    setEditingOfflineProductId(null);
    setFieldErrors({});
  };

  const saveAsDraft = async () => {
    if (!user) {
      Alert.alert('Ошибка', 'Необходимо авторизоваться');
      return;
    }

    const errors: Record<string, boolean> = {};
    if (!productForm.name.trim()) errors.name = true;
    if (!productForm.basePrice) errors.basePrice = true;
    if (!productForm.currentStock) errors.currentStock = true;
    if (!productForm.categoryId) errors.categoryId = true;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      Alert.alert('Ошибка', 'Заполните обязательные поля');
      return;
    }

    setFieldErrors({});

    try {
      // Upload image first if there is one
      let imageUrl: string | undefined;
      if (productForm.imageUri && !productForm.imageUri.startsWith('http')) {
        try {
          imageUrl = await productImagesService.uploadToBackend(productForm.imageUri, token || '');
        } catch (uploadError) {
          Alert.alert('Предупреждение', 'Изображение не загружено, черновик будет сохранен без изображения');
        }
      } else if (productForm.imageUri && productForm.imageUri.startsWith('http')) {
        // It's already a server URL, use it as is
        imageUrl = productForm.imageUri;
      }

      await offlineProductsService.add(user.userId, {
        name: productForm.name.trim(),
        description: productForm.description.trim() || undefined,
        basePrice: Number(productForm.basePrice),
        currentStock: Number(productForm.currentStock),
        unit: productForm.unit,
        categoryId: Number(productForm.categoryId),
        storageConditions: productForm.storageConditions.trim() || undefined,
        allowCustomWeight: true,
        imageUrl: imageUrl || undefined,
      });
      await loadOfflineDrafts();
      resetForm();

      // Auto-sync immediately
      if (token) {
        try {
          setIsSyncingOfflineProducts(true);
          const result = await offlineProductsService.syncForUser(user.userId, token);
          await loadOfflineDrafts();
          if (result.syncedIds.length > 0) {
            await loadData();
            Alert.alert('Черновик синхронизирован', 'Товар отправлен на сервер и доступен во веб-версии');
          }
        } catch (error) {
          console.error('Sync error:', error);
          Alert.alert('Черновик сохранён локально', 'Не удалось синхронизировать с сервером. Попробуйте позже.');
        } finally {
          setIsSyncingOfflineProducts(false);
        }
      } else {
        Alert.alert('Черновик сохранён', 'Товар сохранён локально. Войдите в аккаунт для синхронизации.');
      }
    } catch (error) {
      console.error('Save draft error:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить черновик');
    }
  };

  const submitProduct = async () => {
    if (!token) {
      return;
    }

    if (!productForm.name.trim() || !productForm.basePrice || !productForm.currentStock || !productForm.categoryId) {
      Alert.alert('Заполни обязательные поля продукта');
      return;
    }

    try {
      setIsSubmittingProduct(true);

      // Upload image first if there is one
      let imageUrl: string | undefined;
      if (productForm.imageUri && !productForm.imageUri.startsWith('http')) {
        try {
          imageUrl = await productImagesService.uploadToBackend(productForm.imageUri, token);
        } catch (uploadError) {
          Alert.alert('Ошибка загрузки изображения', 'Не удалось загрузить изображение на сервер');
          setIsSubmittingProduct(false);
          return;
        }
      } else if (productForm.imageUri && productForm.imageUri.startsWith('http')) {
        // It's already a server URL, use it as is
        imageUrl = productForm.imageUri;
      }

      const payload = {
        name: productForm.name.trim(),
        description: productForm.description.trim() || undefined,
        basePrice: Number(productForm.basePrice),
        currentStock: Number(productForm.currentStock),
        unit: productForm.unit,
        categoryId: Number(productForm.categoryId),
        storageConditions: productForm.storageConditions.trim() || undefined,
        allowCustomWeight: true,
        imageUrl: imageUrl || undefined,
      };

      if (editingOfflineProductId) {
        await offlineProductsService.update(editingOfflineProductId, payload);
        await loadOfflineDrafts();
        resetForm();
        Alert.alert('Черновик обновлён', 'Изменения сохранены локально и будут отправлены после стабильного соединения.');
        return;
      }

      if (editingDraftId) {
        await productDraftsService.updateDraft(editingDraftId, payload, token);
        await loadServerDrafts();
        resetForm();
        Alert.alert('Черновик обновлён', 'Изменения сохранены на сервере.');
        return;
      }

      if (editingProductId) {
        await productsService.update(editingProductId, payload, token);
      } else {
        await productsService.create(payload, token);
      }

      resetForm();
      await loadData();
    } catch (err) {
      if (!editingProductId) {
        await offlineProductsService.add(user.userId, {
          name: productForm.name.trim(),
          description: productForm.description.trim() || undefined,
          basePrice: Number(productForm.basePrice),
          currentStock: Number(productForm.currentStock),
          unit: productForm.unit,
          categoryId: Number(productForm.categoryId),
          storageConditions: productForm.storageConditions.trim() || undefined,
          allowCustomWeight: true,
          imageUrl: productForm.imageUri || undefined,
        });
        await loadOfflineDrafts();
        resetForm();
        Alert.alert(
          'Товар сохранён локально',
          'Интернет недоступен или сервер не ответил. Предложение будет автоматически отправлено после 5 минут стабильной связи.'
        );
      } else {
        Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось сохранить продукт');
      }
    } finally {
      setIsSubmittingProduct(false);
    }
  };

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
              void loadData();
            }}
          />
        }>
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <MaterialCommunityIcons name="sprout" size={32} color="#74c69d" />
          </View>
          <View>
            <Text style={styles.title}>Панель фермера</Text>
            <Text style={styles.meta}>Управление товарами, заказами и аналитикой</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          <TabButton
            active={activeTab === 'products'}
            label="Товары"
            icon="package-variant"
            onPress={() => setActiveTab('products')}
          />
          <TabButton
            active={activeTab === 'orders'}
            label="Заказы"
            icon="clipboard-list"
            onPress={() => setActiveTab('orders')}
          />
          <TabButton
            active={activeTab === 'analytics'}
            label="Аналитика"
            icon="chart-line"
            onPress={() => setActiveTab('analytics')}
          />
        </View>

        {activeTab === 'products' ? (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                {editingProductId || editingOfflineProductId ? 'Редактирование товара' : 'Новый товар'}
              </Text>

              {/* Connection Status Indicator */}
              <View style={[
                styles.connectionIndicator,
                { borderColor: isConnected ? '#1f7a45' : '#ef4444', backgroundColor: isConnected ? 'rgba(31, 122, 69, 0.1)' : 'rgba(239, 68, 68, 0.1)' }
              ]}>
                <MaterialCommunityIcons
                  name={isConnected ? 'wifi' : 'wifi-off'}
                  size={16}
                  color={isConnected ? '#1f7a45' : '#ef4444'}
                />
                <Text style={[
                  styles.connectionText,
                  { color: isConnected ? '#1f7a45' : '#ef4444' }
                ]}>
                  {connectionStatusText}
                  {!isConnected && ` • Авто-синхронизация через ${5 - Math.floor(stableConnectionChecks / (REQUIRED_STABLE_CONNECTION_CHECKS / 5))} мин`}
                </Text>
              </View>

              <Text style={styles.meta}>
                Офлайн-режим: если связи нет, новый товар сохранится на телефоне и отправится после 5 минут стабильного соединения.
              </Text>
              {/* Name with voice input */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <Text style={styles.inputLabel}>Название товара</Text>
                  <TouchableOpacity
                    style={[styles.voiceButtonSmall, isRecording && recordingField === 'name' && styles.voiceButtonRecording]}
                    onPress={() => isRecording ? stopVoiceInput() : startVoiceInput('name')}>
                    <MaterialCommunityIcons name={isRecording && recordingField === 'name' ? 'stop' : 'microphone'} size={14} color={isRecording && recordingField === 'name' ? '#ef4444' : '#74c69d'} />
                    <Text style={[styles.voiceButtonText, isRecording && recordingField === 'name' && { color: '#ef4444' }]}>
                      {isRecording && recordingField === 'name' ? 'Запись...' : 'Голос'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  value={productForm.name}
                  onChangeText={(value) => {
                    setProductForm((prev) => ({ ...prev, name: value }));
                    if (fieldErrors.name) {
                      setFieldErrors((prev) => ({ ...prev, name: false }));
                    }
                  }}
                  style={[styles.input, fieldErrors.name && styles.inputError]}
                  placeholder="Введите название"
                  placeholderTextColor="#5a7c6b"
                />
              </View>

              {/* Description with voice input */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <Text style={styles.inputLabel}>Описание</Text>
                  <TouchableOpacity
                    style={[styles.voiceButtonSmall, isRecording && recordingField === 'description' && styles.voiceButtonRecording]}
                    onPress={() => isRecording ? stopVoiceInput() : startVoiceInput('description')}>
                    <MaterialCommunityIcons name={isRecording && recordingField === 'description' ? 'stop' : 'microphone'} size={14} color={isRecording && recordingField === 'description' ? '#ef4444' : '#74c69d'} />
                    <Text style={[styles.voiceButtonText, isRecording && recordingField === 'description' && { color: '#ef4444' }]}>
                      {isRecording && recordingField === 'description' ? 'Запись...' : 'Голос'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  value={productForm.description}
                  onChangeText={(value) => setProductForm((prev) => ({ ...prev, description: value }))}
                  multiline
                  style={[styles.input, styles.inputMultiline]}
                  placeholder="Описание товара"
                  placeholderTextColor="#5a7c6b"
                  textAlignVertical="top"
                />
              </View>
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <Text style={styles.inputLabel}>Цена</Text>
                  <TouchableOpacity
                    style={[styles.voiceButtonSmall, isRecording && recordingField === 'basePrice' && styles.voiceButtonRecording]}
                    onPress={() => isRecording ? stopVoiceInput() : startVoiceInput('basePrice')}>
                    <MaterialCommunityIcons name={isRecording && recordingField === 'basePrice' ? 'stop' : 'microphone'} size={14} color={isRecording && recordingField === 'basePrice' ? '#ef4444' : '#74c69d'} />
                    <Text style={[styles.voiceButtonText, isRecording && recordingField === 'basePrice' && { color: '#ef4444' }]}>
                      {isRecording && recordingField === 'basePrice' ? 'Запись...' : 'Голос'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  value={productForm.basePrice}
                  onChangeText={(value) => {
                    setProductForm((prev) => ({ ...prev, basePrice: value }));
                    if (fieldErrors.basePrice) {
                      setFieldErrors((prev) => ({ ...prev, basePrice: false }));
                    }
                  }}
                  style={[styles.input, fieldErrors.basePrice && styles.inputError]}
                  placeholder="Цена товара"
                  placeholderTextColor="#5a7c6b"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <Text style={styles.inputLabel}>Остаток</Text>
                  <TouchableOpacity
                    style={[styles.voiceButtonSmall, isRecording && recordingField === 'currentStock' && styles.voiceButtonRecording]}
                    onPress={() => isRecording ? stopVoiceInput() : startVoiceInput('currentStock')}>
                    <MaterialCommunityIcons name={isRecording && recordingField === 'currentStock' ? 'stop' : 'microphone'} size={14} color={isRecording && recordingField === 'currentStock' ? '#ef4444' : '#74c69d'} />
                    <Text style={[styles.voiceButtonText, isRecording && recordingField === 'currentStock' && { color: '#ef4444' }]}>
                      {isRecording && recordingField === 'currentStock' ? 'Запись...' : 'Голос'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  value={productForm.currentStock}
                  onChangeText={(value) => {
                    setProductForm((prev) => ({ ...prev, currentStock: value }));
                    if (fieldErrors.currentStock) {
                      setFieldErrors((prev) => ({ ...prev, currentStock: false }));
                    }
                  }}
                  style={[styles.input, fieldErrors.currentStock && styles.inputError]}
                  placeholder="Количество на складе"
                  placeholderTextColor="#5a7c6b"
                  keyboardType="numeric"
                />
              </View>
              <AppInput
                label="Единица"
                value={productForm.unit}
                onChangeText={(value) => setProductForm((prev) => ({ ...prev, unit: value }))}
              />
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Категория</Text>
                <TouchableOpacity
                  style={[styles.categorySelector, fieldErrors.categoryId && styles.categorySelectorError]}
                  onPress={() => setShowCategoryPicker(true)}
                >
                  <Text style={styles.categorySelectorText}>
                    {categories.find(c => c.categoryId === Number(productForm.categoryId))?.name || 'Выберите категорию'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#74c69d" />
                </TouchableOpacity>
              </View>
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <Text style={styles.inputLabel}>Условия хранения</Text>
                  <TouchableOpacity
                    style={[styles.voiceButtonSmall, isRecording && recordingField === 'storageConditions' && styles.voiceButtonRecording]}
                    onPress={() => isRecording ? stopVoiceInput() : startVoiceInput('storageConditions')}>
                    <MaterialCommunityIcons name={isRecording && recordingField === 'storageConditions' ? 'stop' : 'microphone'} size={14} color={isRecording && recordingField === 'storageConditions' ? '#ef4444' : '#74c69d'} />
                    <Text style={[styles.voiceButtonText, isRecording && recordingField === 'storageConditions' && { color: '#ef4444' }]}>
                      {isRecording && recordingField === 'storageConditions' ? 'Запись...' : 'Голос'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  value={productForm.storageConditions}
                  onChangeText={(value) => setProductForm((prev) => ({ ...prev, storageConditions: value }))}
                  multiline
                  style={[styles.input, styles.inputMultiline]}
                  placeholder="Условия хранения товара"
                  placeholderTextColor="#5a7c6b"
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Фото товара</Text>
                {productForm.imageUri ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: productForm.imageUri }}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.deleteImageButton}
                      onPress={() => setProductForm((prev) => ({ ...prev, imageUri: '' }))}>
                      <MaterialCommunityIcons name="delete" size={16} color="#ef4444" />
                      <Text style={styles.deleteImageText}>Удалить</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.photoButtonsRow}>
                    <TouchableOpacity
                      style={styles.photoButton}
                      onPress={async () => {
                        const result = await productImagesService.takePhoto();
                        if (result?.uri) {
                          setProductForm((prev) => ({ ...prev, imageUri: result.uri || '' }));
                        }
                      }}>
                      <MaterialCommunityIcons name="camera" size={20} color="#74c69d" />
                      <Text style={styles.photoButtonText}>Камера</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.photoButton}
                      onPress={async () => {
                        const result = await productImagesService.pickFromGallery();
                        if (result?.uri) {
                          setProductForm((prev) => ({ ...prev, imageUri: result.uri || '' }));
                        }
                      }}>
                      <MaterialCommunityIcons name="image" size={20} color="#74c69d" />
                      <Text style={styles.photoButtonText}>Галерея</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <AppButton
                title={editingProductId || editingOfflineProductId ? 'Сохранить товар' : 'Добавить товар'}
                onPress={submitProduct}
                loading={isSubmittingProduct}
              />
              {editingProductId || editingOfflineProductId ? (
                <AppButton title="Отменить" variant="secondary" onPress={resetForm} />
              ) : (
                <AppButton
                  title="Сохранить как черновик"
                  variant="secondary"
                  onPress={saveAsDraft}
                />
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Быстрые шаблоны</Text>
                <View style={styles.templatesRow}>
                  {templates.slice(0, 5).map((template) => (
                    <TouchableOpacity
                      key={template.id}
                      style={styles.templateChip}
                      onPress={() => {
                        const values = productTemplatesService.applyTemplate(template);
                        setProductForm({
                          name: values.name || '',
                          description: values.description || '',
                          basePrice: '',
                          currentStock: '',
                          unit: values.unit || 'кг',
                          categoryId: values.categoryId ? String(values.categoryId) : '',
                          storageConditions: values.storageConditions || '',
                          imageUri: '',
                        });
                        Alert.alert('✅ Шаблон применён', `Заполнены поля для "${template.name}". Добавьте цену и остаток.`);
                      }}>
                      <MaterialCommunityIcons name="plus-circle" size={14} color="#74c69d" />
                      <Text style={styles.templateChipText}>{template.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Локальные предложения</Text>
              <Text style={styles.meta}>
                Статус связи: {stableConnectionChecks >= REQUIRED_STABLE_CONNECTION_CHECKS ? 'стабильная' : `проверка ${stableConnectionChecks}/${REQUIRED_STABLE_CONNECTION_CHECKS}`}
              </Text>
              {isSyncingOfflineProducts ? <Text style={styles.meta}>Идёт синхронизация...</Text> : null}
              {offlineDrafts.length > 0 && !isSyncingOfflineProducts && (
                <TouchableOpacity
                  style={styles.syncButton}
                  onPress={async () => {
                    if (!token || !user) return;
                    try {
                      setIsSyncingOfflineProducts(true);
                      const result = await offlineProductsService.syncForUser(user.userId, token);
                      await loadOfflineDrafts();
                      if (result.syncedIds.length > 0) {
                        await loadData();
                        Alert.alert(
                          'Синхронизация завершена',
                          `Отправлено товаров: ${result.syncedIds.length}. Их можно редактировать после проверки в веб-версии.`
                        );
                      } else {
                        Alert.alert('Синхронизация', 'Нет черновиков для отправки');
                      }
                    } catch (error) {
                      console.error('Sync error:', error);
                      Alert.alert('Ошибка синхронизации', 'Не удалось отправить черновики');
                    } finally {
                      setIsSyncingOfflineProducts(false);
                    }
                  }}
                >
                  <Text style={styles.syncButtonText}>Синхронизировать сейчас</Text>
                </TouchableOpacity>
              )}
              {offlineDrafts.map((draft) => (
                <View key={draft.localId} style={styles.listItem}>
                  <Text style={styles.itemTitle}>{draft.payload.name}</Text>
                  <Text style={styles.meta}>
                    {draft.payload.basePrice.toFixed(2)} ₽, остаток {draft.payload.currentStock} {draft.payload.unit || 'кг'}
                  </Text>
                  <Text style={styles.meta}>
                    Статус: {draft.status === 'pending' ? 'ожидает отправки' : draft.status === 'syncing' ? 'отправляется' : draft.status === 'synced' ? 'отправлен' : 'ошибка'}
                  </Text>
                  {draft.lastError ? <Text style={styles.errorText}>{draft.lastError}</Text> : null}
                  <View style={styles.actionsRow}>
                    {draft.status !== 'synced' ? (
                      <AppButton
                        title="Изменить локально"
                        variant="secondary"
                        onPress={() => {
                          setEditingProductId(null);
                          setEditingOfflineProductId(draft.localId);
                          setProductForm({
                            name: draft.payload.name,
                            description: draft.payload.description || '',
                            basePrice: String(draft.payload.basePrice),
                            currentStock: String(draft.payload.currentStock),
                            unit: draft.payload.unit || 'кг',
                            categoryId: String(draft.payload.categoryId || ''),
                            storageConditions: draft.payload.storageConditions || '',
                            imageUri: draft.payload.imageUrl || '',
                          });
                        }}
                      />
                    ) : null}
                    <AppButton
                      title="Удалить локально"
                      variant="danger"
                      onPress={async () => {
                        await offlineProductsService.remove(draft.localId);
                        await loadOfflineDrafts();
                      }}
                    />
                  </View>
                </View>
              ))}
              {offlineDrafts.length === 0 ? <Text style={styles.meta}>Локальных предложений нет.</Text> : null}
            </View>

            {/* Server Drafts Section */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Черновики на сервере</Text>
              {serverDrafts.length === 0 ? <Text style={styles.meta}>Черновиков на сервере нет.</Text> : null}
              {serverDrafts.map((draft) => (
                <View key={draft.draftId} style={styles.listItem}>
                  <Text style={styles.itemTitle}>{draft.name}</Text>
                  <Text style={styles.meta}>
                    {draft.basePrice.toFixed(2)} ₽, остаток {draft.currentStock} {draft.unit}
                  </Text>
                  <Text style={styles.meta}>
                    Статус: {draft.status === 'pending' ? 'ожидает' : draft.status === 'syncing' ? 'синхронизация' : draft.status === 'synced' ? 'синхронизирован' : 'ошибка'}
                  </Text>
                  <View style={styles.actionsRow}>
                    <AppButton
                      title="Изменить"
                      variant="secondary"
                      onPress={() => {
                        setEditingProductId(null);
                        setEditingOfflineProductId(null);
                        setEditingDraftId(draft.draftId);
                        setProductForm({
                          name: draft.name,
                          description: draft.description || '',
                          basePrice: String(draft.basePrice),
                          currentStock: String(draft.currentStock),
                          unit: draft.unit,
                          categoryId: String(draft.categoryId),
                          storageConditions: draft.storageConditions || '',
                          imageUri: draft.imageUrl || '',
                        });
                      }}
                    />
                    <AppButton
                      title="Удалить"
                      variant="danger"
                      onPress={async () => {
                        if (!token) return;
                        await productDraftsService.deleteDraft(draft.draftId, token);
                        await loadServerDrafts();
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Change History Section */}
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>📋 История изменений</Text>
                <TouchableOpacity onPress={() => setShowHistory(!showHistory)}>
                  <Text style={styles.sectionToggle}>{showHistory ? 'Скрыть' : 'Показать'}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{historyStats.totalChanges}</Text>
                  <Text style={styles.statLabel}>Всего</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{historyStats.todayChanges}</Text>
                  <Text style={styles.statLabel}>Сегодня</Text>
                </View>
              </View>
              {showHistory && (
                <View style={styles.historyList}>
                  {changeHistory.length === 0 ? (
                    <Text style={styles.meta}>История изменений пуста.</Text>
                  ) : (
                    changeHistory.slice(0, 10).map((record) => (
                      <View key={record.id} style={styles.historyItem}>
                        <View style={styles.historyIcon}>
                          <MaterialCommunityIcons name="history" size={20} color="#74c69d" />
                        </View>
                        <View style={styles.historyContent}>
                          <Text style={styles.historyTitle}>{record.productName}</Text>
                          <Text style={styles.historyDetail}>
                            {record.changeType === 'price' && record.oldPrice !== undefined && record.newPrice !== undefined
                              ? `Цена: ${record.oldPrice.toFixed(0)}→${record.newPrice.toFixed(0)}₽`
                              : record.changeType === 'stock' && record.oldStock !== undefined && record.newStock !== undefined
                                ? `Остаток: ${record.oldStock}→${record.newStock}`
                                : record.changeType === 'both' ? 'Цена и остаток' : 'Изменение'}
                          </Text>
                          <Text style={styles.historyDate}>
                            {new Date(record.timestamp).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>

            {/* Bulk Edit Section */}
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>📦 Мои товары</Text>
                <TouchableOpacity
                  style={[styles.bulkEditToggle, bulkEditMode && styles.bulkEditToggleActive]}
                  onPress={() => {
                    setBulkEditMode(!bulkEditMode);
                    setSelectedProducts([]);
                  }}>
                  <Text style={styles.bulkEditToggleText}>
                    {bulkEditMode ? '✓ Готово' : 'Выбрать'}
                  </Text>
                </TouchableOpacity>
              </View>

              {bulkEditMode && (
                <View style={{ marginTop: 12, gap: 8 }}>
                  <Text style={styles.meta}>Выбрано: {selectedProducts.length} товаров</Text>
                  {selectedProducts.length > 0 && (
                    <>
                      <AppInput
                        label="Новая цена (₽)"
                        value={bulkPriceChange}
                        onChangeText={setBulkPriceChange}
                        placeholder="Оставить без изменений"
                      />
                      <AppInput
                        label="Новый остаток"
                        value={bulkStockChange}
                        onChangeText={setBulkStockChange}
                        placeholder="Оставить без изменений"
                      />
                      <AppButton
                        title={`Применить к ${selectedProducts.length} товарам`}
                        onPress={async () => {
                          if (!token) return;
                          const newPrice = bulkPriceChange ? Number(bulkPriceChange) : null;
                          const newStock = bulkStockChange ? Number(bulkStockChange) : null;

                          for (const productId of selectedProducts) {
                            const product = products.find((p) => p.productId === productId);
                            if (!product) continue;

                            const updatePayload: any = {};
                            if (newPrice !== null) {
                              updatePayload.basePrice = newPrice;
                            }
                            if (newStock !== null) {
                              updatePayload.currentStock = newStock;
                            }

                            if (Object.keys(updatePayload).length > 0) {
                              try {
                                await productsService.update(productId, updatePayload, token);
                                // Log the change
                                if (newPrice !== null && newStock !== null) {
                                  await changeHistoryService.logBothChange(
                                    productId,
                                    product.name,
                                    product.basePrice,
                                    newPrice,
                                    product.currentStock,
                                    newStock,
                                    user.userId,
                                    `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
                                  );
                                } else if (newPrice !== null) {
                                  await changeHistoryService.logPriceChange(
                                    productId,
                                    product.name,
                                    product.basePrice,
                                    newPrice,
                                    user.userId,
                                    `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
                                  );
                                } else if (newStock !== null) {
                                  await changeHistoryService.logStockChange(
                                    productId,
                                    product.name,
                                    product.currentStock,
                                    newStock,
                                    user.userId,
                                    `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
                                  );
                                }
                              } catch (err) {
                                console.error('Failed to update product:', err);
                              }
                            }
                          }

                          setBulkPriceChange('');
                          setBulkStockChange('');
                          setSelectedProducts([]);
                          setBulkEditMode(false);
                          await loadData();
                          await loadChangeHistory();
                          Alert.alert('Готово', `Обновлено ${selectedProducts.length} товаров`);
                        }}
                      />
                      <AppButton
                        title="Отменить выбор"
                        variant="secondary"
                        onPress={() => setSelectedProducts([])}
                      />
                    </>
                  )}
                </View>
              )}

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Поиск по моим товарам"
                placeholderTextColor="#8b9b91"
                style={[styles.search, { marginTop: bulkEditMode ? 12 : 0 }]}
              />
              {visibleProducts.map((product) => (
                <View key={product.productId} style={styles.listItem}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {bulkEditMode && (
                      <TouchableOpacity
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 4,
                          borderWidth: 2,
                          borderColor: selectedProducts.includes(product.productId) ? '#1f7a45' : '#8b9b91',
                          backgroundColor: selectedProducts.includes(product.productId) ? '#1f7a45' : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onPress={() => {
                          setSelectedProducts((prev) =>
                            prev.includes(product.productId)
                              ? prev.filter((id) => id !== product.productId)
                              : [...prev, product.productId]
                          );
                        }}>
                        {selectedProducts.includes(product.productId) && (
                          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>✓</Text>
                        )}
                      </TouchableOpacity>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{product.name}</Text>
                      <Text style={styles.meta}>
                        {product.basePrice.toFixed(2)} ₽, остаток {product.currentStock} {product.unit || 'кг'}
                      </Text>
                      <Text style={styles.meta}>Категория: {product.categoryName}</Text>
                    </View>
                  </View>
                  {!bulkEditMode && (
                    <View style={styles.productActions}>
                      <TouchableOpacity
                        style={styles.actionIconButton}
                        onPress={() => {
                          setEditingProductId(product.productId);
                          setEditingOfflineProductId(null);
                          setProductForm({
                            name: product.name,
                            description: product.description || '',
                            basePrice: String(product.basePrice),
                            currentStock: String(product.currentStock),
                            unit: product.unit || 'кг',
                            categoryId: String(product.categoryId),
                            storageConditions: product.storageConditions || '',
                            imageUri: '',
                          });
                        }}>
                        <MaterialCommunityIcons name="pencil" size={20} color="#74c69d" />
                        <Text style={styles.actionIconText}>Изменить</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionIconButton}
                        onPress={async () => {
                          if (!token) return;
                          try {
                            await productsService.remove(product.productId, token);
                            await loadData();
                          } catch (err) {
                            Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось удалить продукт');
                          }
                        }}>
                        <MaterialCommunityIcons name="delete" size={20} color="#ef4444" />
                        <Text style={[styles.actionIconText, { color: '#ef4444' }]}>Удалить</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
              {visibleProducts.length === 0 ? <Text style={styles.meta}>Товаров пока нет.</Text> : null}
            </View>
          </>
        ) : null}

        {activeTab === 'orders' ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Мои заказы</Text>
            {orders.map((order) => (
              <View key={order.orderId} style={styles.orderItem}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNumber} numberOfLines={1}>#{order.orderNumber}</Text>
                  <StatusBadge status={order.status} />
                </View>
                <Text style={styles.orderAmount}>{order.totalAmount.toFixed(2)} ₽</Text>
                <Text style={styles.meta} numberOfLines={2}>📍 {order.deliveryAddress}</Text>

                {/* Order Items */}
                {order.items && order.items.length > 0 && (
                  <View style={styles.orderItemsContainer}>
                    <Text style={styles.orderItemsTitle}>Состав заказа ({order.items.length} поз.)</Text>
                    {order.items.map((item, index) => (
                      <View key={`${order.orderId}-${index}`} style={styles.orderItemRow}>
                        <Text style={styles.orderItemName} numberOfLines={1}>
                          {item.productName || `Товар #${item.productId}`}
                        </Text>
                        <Text style={styles.orderItemQuantity}>
                          {item.expectedWeight ? `${item.expectedWeight} кг` : `${item.quantity} кг`}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Smart status buttons based on current status */}
                {order.status === 'Pending' && (
                  <View style={styles.statusButtonsContainer}>
                    <TouchableOpacity
                      style={styles.statusChip}
                      onPress={async () => {
                        if (!token) return;
                        try {
                          await ordersService.updateStatus(order.orderId, { status: 'Confirmed' }, token);
                          await loadData();
                        } catch (err) {
                          Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось обновить статус');
                        }
                      }}
                    >
                      <Text style={styles.statusChipText}>Подтвердить</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.statusChip, { borderColor: '#ef4444' }]}
                      onPress={async () => {
                        if (!token) return;
                        try {
                          await ordersService.updateStatus(order.orderId, { status: 'Cancelled' }, token);
                          await loadData();
                        } catch (err) {
                          Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось обновить статус');
                        }
                      }}
                    >
                      <Text style={[styles.statusChipText, { color: '#ef4444' }]}>Отменить</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {order.status === 'Confirmed' && (
                  <View style={styles.statusButtonsContainer}>
                    <TouchableOpacity
                      style={styles.statusChip}
                      onPress={async () => {
                        if (!token) return;
                        try {
                          await ordersService.updateStatus(order.orderId, { status: 'Processing' }, token);
                          await loadData();
                        } catch (err) {
                          Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось обновить статус');
                        }
                      }}
                    >
                      <Text style={styles.statusChipText}>В обработку</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.statusChip, { borderColor: '#ef4444' }]}
                      onPress={async () => {
                        if (!token) return;
                        try {
                          await ordersService.updateStatus(order.orderId, { status: 'Cancelled' }, token);
                          await loadData();
                        } catch (err) {
                          Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось обновить статус');
                        }
                      }}
                    >
                      <Text style={[styles.statusChipText, { color: '#ef4444' }]}>Отменить</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {order.status === 'Processing' && (
                  <View style={styles.statusButtonsContainer}>
                    <TouchableOpacity
                      style={styles.statusChip}
                      onPress={async () => {
                        if (!token) return;
                        try {
                          await ordersService.updateStatus(order.orderId, { status: 'AwaitingWeight' }, token);
                          await loadData();
                        } catch (err) {
                          Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось обновить статус');
                        }
                      }}
                    >
                      <Text style={styles.statusChipText}>Ожидает веса</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {order.status === 'AwaitingWeight' && (
                  <View style={styles.statusButtonsContainer}>
                    <TouchableOpacity
                      style={styles.statusChip}
                      onPress={() => {
                        setWeightModalOrder(order);
                        const initialWeights: Record<number, number> = {};
                        order.items.forEach((item, index) => {
                          initialWeights[index] = item.actualWeight || item.expectedWeight || 0;
                        });
                        setOrderWeights(initialWeights);
                      }}
                    >
                      <Text style={styles.statusChipText}>Указать вес</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.statusChip}
                      onPress={async () => {
                        if (!token) return;
                        try {
                          await ordersService.updateStatus(order.orderId, { status: 'ReadyToShip' }, token);
                          await loadData();
                        } catch (err) {
                          Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось обновить статус');
                        }
                      }}
                    >
                      <Text style={styles.statusChipText}>Готов к отправке</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {order.status === 'ReadyToShip' && (
                  <View style={styles.statusButtonsContainer}>
                    <TouchableOpacity
                      style={styles.statusChip}
                      onPress={async () => {
                        if (!token) return;
                        try {
                          await ordersService.updateStatus(order.orderId, { status: 'Shipped' }, token);
                          await loadData();
                        } catch (err) {
                          Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось обновить статус');
                        }
                      }}
                    >
                      <Text style={styles.statusChipText}>Отправлен</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {order.status === 'Shipped' && (
                  <View style={styles.statusButtonsContainer}>
                    <TouchableOpacity
                      style={styles.statusChip}
                      onPress={async () => {
                        if (!token) return;
                        try {
                          await ordersService.updateStatus(order.orderId, { status: 'Delivered' }, token);
                          await loadData();
                        } catch (err) {
                          Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось обновить статус');
                        }
                      }}
                    >
                      <Text style={styles.statusChipText}>Доставлен</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Always show "Change Status" button for manual override */}
                <TouchableOpacity
                  style={styles.changeStatusButton}
                  onPress={() => {
                    setStatusModalOrder(order);
                    setStatusModalNotes('');
                  }}
                >
                  <MaterialCommunityIcons name="swap-horizontal" size={16} color="#74c69d" />
                  <Text style={styles.changeStatusButtonText}>Изменить статус</Text>
                </TouchableOpacity>
              </View>
            ))}
            {orders.length === 0 ? <Text style={styles.meta}>Фермерских заказов пока нет.</Text> : null}
          </View>
        ) : null}

        {activeTab === 'analytics' ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>📊 Аналитика за {analytics?.periodDays || 30} дней</Text>
            {analytics ? (
              <>
                <View style={styles.metricsGrid}>
                  <MetricCard
                    value={`${analytics.revenueTotal.toFixed(0)}₽`}
                    label="Выручка"
                    icon="currency-usd"
                  />
                  <MetricCard
                    value={String(analytics.ordersCount)}
                    label="Заказы"
                    icon="shopping"
                  />
                </View>
                <View style={styles.metricsGrid}>
                  <MetricCard
                    value={`${analytics.averageOrderValue.toFixed(0)}₽`}
                    label="Средний чек"
                    icon="receipt"
                  />
                  <MetricCard
                    value={String(analytics.newCustomers)}
                    label="Новые клиенты"
                    icon="account-plus"
                  />
                </View>

                <View style={styles.analyticsSection}>
                  <Text style={styles.sectionSubtitle}>📈 Динамика выручки</Text>
                  {analytics.revenueByDay.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                      <View style={{ minWidth: Dimensions.get('window').width - 32 }}>
                        <LineChart
                          data={{
                            labels: [...analytics.revenueByDay].reverse().map(d => new Date(d.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })),
                            datasets: [
                              {
                                data: [...analytics.revenueByDay].reverse().map(d => d.revenue),
                                color: (opacity = 1) => `rgba(116, 198, 157, ${opacity})`,
                                strokeWidth: 2,
                              },
                            ],
                          }}
                          width={Math.max(Dimensions.get('window').width - 64, analytics.revenueByDay.length * 50)}
                          height={200}
                          chartConfig={{
                            backgroundColor: 'rgba(255,255,255,0.02)',
                            backgroundGradientFrom: 'rgba(255,255,255,0.02)',
                            backgroundGradientTo: 'rgba(255,255,255,0.02)',
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(143, 168, 154, ${opacity})`,
                            style: {
                              borderRadius: 16,
                            },
                          }}
                          bezier
                          style={styles.chart}
                        />
                      </View>
                    </ScrollView>
                  ) : (
                    <Text style={styles.meta}>Нет данных за период</Text>
                  )}
                </View>

                <View style={styles.analyticsSection}>
                  <Text style={styles.sectionSubtitle}>📈 Статистика заказов</Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="check-circle" size={24} color="#10b981" />
                      <Text style={styles.statValue}>{analytics.completedOrders}</Text>
                      <Text style={styles.statLabel}>Завершено</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="close-circle" size={24} color="#ef4444" />
                      <Text style={styles.statValue}>{analytics.cancelledOrders}</Text>
                      <Text style={styles.statLabel}>Отменено</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="repeat" size={24} color="#74c69d" />
                      <Text style={styles.statValue}>{analytics.repeatCustomers}</Text>
                      <Text style={styles.statLabel}>Повторные</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.analyticsSection}>
                  <Text style={styles.sectionSubtitle}>📊 Статусы заказов</Text>
                  <View style={styles.statusList}>
                    {analytics.statusBreakdown.map((status) => (
                      <View key={status.status} style={styles.statusItem}>
                        <Text style={styles.statusLabel}>{status.status}</Text>
                        <Text style={styles.statusCount}>{status.count}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {analytics.categoryBreakdown.length > 0 && (
                  <View style={styles.analyticsSection}>
                    <Text style={styles.sectionSubtitle}>📦 Категории продаж</Text>
                    <PieChart
                      data={analytics.categoryBreakdown.map(cat => ({
                        name: cat.categoryName,
                        population: cat.revenue,
                        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
                        legendFontColor: '#8fa89a',
                        legendFontSize: 12,
                      }))}
                      width={Dimensions.get('window').width - 64}
                      height={200}
                      chartConfig={{
                        backgroundColor: 'rgba(255,255,255,0.02)',
                        backgroundGradientFrom: 'rgba(255,255,255,0.02)',
                        backgroundGradientTo: 'rgba(255,255,255,0.02)',
                        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                      }}
                      accessor="population"
                      backgroundColor="transparent"
                      paddingLeft="15"
                      absolute
                      style={styles.chart}
                    />
                  </View>
                )}

                {analytics.topProducts.length > 0 && (
                  <View style={styles.analyticsSection}>
                    <Text style={styles.sectionSubtitle}>🏆 Топ товары</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                      <View style={{ minWidth: Dimensions.get('window').width - 32 }}>
                        <BarChart
                          data={{
                            labels: analytics.topProducts.slice(0, 5).map(p => p.productName.length > 15 ? p.productName.substring(0, 15) + '...' : p.productName),
                            datasets: [{
                              data: analytics.topProducts.slice(0, 5).map(p => p.revenue)
                            }]
                          }}
                          width={Math.max(Dimensions.get('window').width - 64, analytics.topProducts.slice(0, 5).length * 80)}
                          height={200}
                          yAxisLabel="₽"
                          yAxisSuffix=""
                          chartConfig={{
                            backgroundColor: 'rgba(255,255,255,0.02)',
                            backgroundGradientFrom: 'rgba(255,255,255,0.02)',
                            backgroundGradientTo: 'rgba(255,255,255,0.02)',
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(116, 198, 157, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(143, 168, 154, ${opacity})`,
                            style: {
                              borderRadius: 16,
                            },
                          }}
                          style={styles.chart}
                        />
                      </View>
                    </ScrollView>
                  </View>
                )}

                <View style={styles.analyticsSection}>
                  <Text style={styles.sectionSubtitle}>📋 CRM-заметки и задачи</Text>
                  <View style={styles.crmGrid}>
                    <View style={styles.crmCard}>
                      <Text style={styles.crmCardTitle}>Повторные заказы</Text>
                      <Text style={styles.crmCardText}>
                        Клиентов без повторной покупки за период: {Math.max(analytics.uniqueCustomers - analytics.newCustomers, 0)}
                      </Text>
                    </View>
                    <View style={styles.crmCard}>
                      <Text style={styles.crmCardTitle}>Категории роста</Text>
                      <Text style={styles.crmCardText}>
                        Топ категория: {analytics.categoryBreakdown[0]?.categoryName || 'Нет данных'}
                      </Text>
                    </View>
                    <View style={styles.crmCard}>
                      <Text style={styles.crmCardTitle}>Заказы в ожидании</Text>
                      <Text style={styles.crmCardText}>
                        Всего: {analytics.statusBreakdown.find((s) => s.status.toLowerCase() === 'awaitingweight')?.count || 0}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#74c69d" />
                <Text style={styles.meta}>Загрузка аналитики...</Text>
              </View>
            )}
          </View>
        ) : null}

        {/* Status Modal */}
        <Modal
          visible={statusModalOrder !== null}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setStatusModalOrder(null);
            setStatusModalNotes('');
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Изменить статус заказа #{statusModalOrder?.orderNumber}</Text>
                <TouchableOpacity onPress={() => {
                  setStatusModalOrder(null);
                  setStatusModalNotes('');
                }}>
                  <MaterialCommunityIcons name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <View style={styles.statusOptions}>
                {['Pending', 'Confirmed', 'Processing', 'AwaitingWeight', 'ReadyToShip', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      statusModalOrder?.status === status && styles.statusOptionActive
                    ]}
                    onPress={async () => {
                      if (!token || !statusModalOrder) return;
                      try {
                        await ordersService.updateStatus(statusModalOrder.orderId, {
                          status,
                          notes: statusModalNotes.trim() || undefined
                        }, token);

                        // Send notification to user about status change
                        await notificationsService.showOrderStatusNotification(
                          statusModalOrder.orderNumber,
                          status
                        );

                        await loadData();
                        setStatusModalOrder(null);
                        setStatusModalNotes('');
                        Alert.alert('Успех', 'Статус заказа обновлен');
                      } catch (err) {
                        Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось обновить статус');
                      }
                    }}
                  >
                    <Text style={[
                      styles.statusOptionText,
                      statusModalOrder?.status === status && styles.statusOptionTextActive
                    ]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalNotesSection}>
                <Text style={styles.modalNotesLabel}>Заметки (опционально)</Text>
                <TextInput
                  style={styles.modalNotesInput}
                  value={statusModalNotes}
                  onChangeText={setStatusModalNotes}
                  placeholder="Добавьте заметку к изменению статуса..."
                  placeholderTextColor="#5a7c6b"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Weight Modal */}
        <Modal
          visible={weightModalOrder !== null}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setWeightModalOrder(null);
            setOrderWeights({});
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Указать вес заказа #{weightModalOrder?.orderNumber}</Text>
                <TouchableOpacity onPress={() => {
                  setWeightModalOrder(null);
                  setOrderWeights({});
                }}>
                  <MaterialCommunityIcons name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 300 }}>
                {weightModalOrder?.items.map((item, index) => (
                  <View key={index} style={styles.weightItemRow}>
                    <Text style={styles.weightItemName} numberOfLines={2}>
                      {item.productName || `Товар #${item.productId}`}
                    </Text>
                    <View style={styles.weightInputWrapper}>
                      <TextInput
                        style={styles.weightInput}
                        value={orderWeights[index]?.toString() || ''}
                        onChangeText={(text) => {
                          setOrderWeights(prev => ({
                            ...prev,
                            [index]: parseFloat(text) || 0
                          }));
                        }}
                        placeholder="0"
                        placeholderTextColor="#5a7c6b"
                        keyboardType="decimal-pad"
                      />
                      <Text style={styles.weightUnit}>кг</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={async () => {
                  if (!token || !weightModalOrder) return;
                  try {
                    const weightsData = weightModalOrder.items.map((item, index) => ({
                      productId: item.productId,
                      actualWeight: orderWeights[index] || 0
                    }));

                    await ordersService.updateOrderWeights(weightModalOrder.orderId, weightsData, token);

                    // Send notification to user about weight update
                    for (const item of weightModalOrder.items) {
                      await notificationsService.showWeightUpdatedNotification(
                        weightModalOrder.orderNumber,
                        item.productName || `Товар #${item.productId}`,
                        orderWeights[weightModalOrder.items.indexOf(item)] || 0
                      );
                    }

                    await loadData();
                    setWeightModalOrder(null);
                    setOrderWeights({});
                    Alert.alert('Успех', 'Вес заказа обновлен');
                  } catch (err) {
                    Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось обновить вес');
                  }
                }}
              >
                <Text style={styles.modalSubmitButtonText}>Сохранить веса</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Category Picker Modal */}
        <Modal
          visible={showCategoryPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCategoryPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Выберите категорию</Text>
                <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 400 }}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.categoryId}
                    style={[
                      styles.categoryOption,
                      Number(productForm.categoryId) === category.categoryId && styles.categoryOptionSelected
                    ]}
                    onPress={() => {
                      setProductForm(prev => ({ ...prev, categoryId: String(category.categoryId) }));
                      setShowCategoryPicker(false);
                      if (fieldErrors.categoryId) {
                        setFieldErrors(prev => ({ ...prev, categoryId: false }));
                      }
                    }}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      Number(productForm.categoryId) === category.categoryId && styles.categoryOptionTextSelected
                    ]}>
                      {category.name}
                    </Text>
                    {Number(productForm.categoryId) === category.categoryId && (
                      <MaterialCommunityIcons name="check" size={20} color="#74c69d" />
                    )}
                  </TouchableOpacity>
                ))}
                {categories.length === 0 && (
                  <Text style={styles.meta}>Категории не загружены. Проверьте подключение к интернету.</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // 2026 Modern Design System - Deep Forest & Glassmorphism
  safeArea: {
    flex: 1,
    backgroundColor: '#0d1f15', // Deep forest background
  },
  screen: {
    backgroundColor: '#0d1f15',
  },
  container: {
    padding: 20,
    gap: 20,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0d1f15',
    gap: 16,
  },

  // Typography - 2026 Style
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  meta: {
    color: '#8fa89a',
    lineHeight: 22,
    fontSize: 15,
    fontWeight: '400',
  },

  // Header with Icon
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
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

  // Modern Tab Bar - Floating Pill Design
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tab: {
    flex: 1,
    minWidth: 80,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#2d6a4f',
    shadowColor: '#2d6a4f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  tabIcon: {
    marginBottom: 0,
  },
  tabText: {
    fontWeight: '600',
    color: '#8fa89a',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: '#74c69d',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#74c69d',
  },

  // Glassmorphism Cards
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  glassCardInner: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  // Section Headers
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8fa89a',
    fontWeight: '500',
  },

  // Modern Inputs
  search: {
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    width: '100%',
  },

  // Input Groups - Form Fields
  inputGroup: {
    gap: 8,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    color: '#8fa89a',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },

  // Voice Button Small
  voiceButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(45,106,79,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(116,198,157,0.3)',
  },
  voiceButtonRecording: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderColor: 'rgba(239,68,68,0.5)',
  },
  voiceButtonText: {
    color: '#74c69d',
    fontSize: 12,
    fontWeight: '600',
  },

  // Photo Upload
  photoButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  photoButtonText: {
    color: '#74c69d',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    alignItems: 'center',
    gap: 12,
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  deleteImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  deleteImageText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },

  // List Items - 2026 Style (No flexWrap to prevent vertical text)
  listItem: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#74c69d',
    letterSpacing: -0.2,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#8fa89a',
    fontWeight: '500',
  },

  // Action Buttons Row
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  // Status Buttons - Modern Pill
  statusButton: {
    borderRadius: 12,
    backgroundColor: 'rgba(45,106,79,0.3)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(116,198,157,0.3)',
  },
  statusButtonText: {
    color: '#74c69d',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 13,
  },

  // Metrics - Large Numbers
  metric: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  metricLabel: {
    color: '#8fa89a',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Error States
  errorText: {
    color: '#ff6b6b',
    lineHeight: 21,
    fontSize: 14,
    fontWeight: '500',
  },

  // Voice Indicator - Modern Wave
  voiceIndicator: {
    backgroundColor: 'rgba(45,106,79,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(116,198,157,0.4)',
    shadowColor: '#2d6a4f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  voiceWave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 20,
  },
  voiceDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#74c69d',
  },
  voiceDot1: {
    height: 8,
  },
  voiceDot2: {
    height: 16,
  },
  voiceDot3: {
    height: 12,
  },
  voiceDot4: {
    height: 18,
  },
  voiceDot5: {
    height: 10,
  },
  voiceText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Skeleton Loading
  skeleton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  skeletonPulse: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // Gradient Overlays
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },

  // Status Badges
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(116,198,157,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(116,198,157,0.4)',
  },
  badgeText: {
    color: '#74c69d',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Category Chips - Horizontal Scroll
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginRight: 8,
    marginBottom: 8,
  },
  categoryChipActive: {
    backgroundColor: 'rgba(45,106,79,0.4)',
    borderColor: '#74c69d',
  },
  categoryChipText: {
    color: '#8fa89a',
    fontSize: 14,
    fontWeight: '600',
    maxWidth: 120,
  },
  categoryChipTextActive: {
    color: '#74c69d',
  },
  categoryChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },

  // Status Badge with Icon
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Metric Cards - Grid Layout
  metricCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flex: 1,
    minWidth: 140,
    gap: 8,
  },
  metricCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricValue: {
    color: '#74c69d',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  // Horizontal Scroll Container
  horizontalScroll: {
    flexDirection: 'row',
    gap: 12,
  },

  // Product Card Improved
  productCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  productInfo: {
    flex: 1,
    flexShrink: 1,
    minWidth: 200,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // Order Item - No flexWrap to prevent vertical text
  orderItem: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 10,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#74c69d',
    flex: 1,
  },
  orderAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#74c69d',
  },
  orderItemsContainer: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  orderItemsTitle: {
    color: '#8fa89a',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  orderItemName: {
    color: '#74c69d',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  orderItemQuantity: {
    color: '#74c69d',
    fontSize: 13,
    fontWeight: '600',
  },
  changeStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(116,198,157,0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(116,198,157,0.3)',
  },
  changeStatusButtonText: {
    color: '#74c69d',
    fontSize: 14,
    fontWeight: '600',
  },

  // Status Buttons in Grid
  statusButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statusChipText: {
    color: '#8fa89a',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Product Actions - Icon buttons
  productActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  actionIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  actionIconText: {
    color: '#74c69d',
    fontSize: 13,
    fontWeight: '600',
  },

  // Analytics Layout
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  analyticsSection: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statItem: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  statValue: {
    color: '#74c69d',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: '#8fa89a',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  chartContainer: {
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chartPlaceholder: {
    color: '#8fa89a',
    fontSize: 14,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statusList: {
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 8,
  },
  statusLabel: {
    color: '#74c69d',
    fontSize: 14,
    fontWeight: '500',
  },
  statusCount: {
    color: '#74c69d',
    fontSize: 16,
    fontWeight: '700',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 8,
  },
  categoryName: {
    color: '#74c69d',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryRevenue: {
    color: '#74c69d',
    fontSize: 16,
    fontWeight: '700',
  },
  crmGrid: {
    gap: 12,
  },
  crmCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  crmCardTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  crmCardMeta: {
    color: '#8fa89a',
    fontSize: 13,
    marginTop: 8,
  },
  crmCardText: {
    color: '#ffffff',
    fontSize: 13,
    marginTop: 4,
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  connectionText: {
    fontSize: 13,
    fontWeight: '600',
  },

  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d0ddd5',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#16301f',
  },
  categorySelectorError: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239,68,68,0.1)',
  },

  categorySelectorText: {
    fontSize: 16,
    color: '#16301f',
  },

  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },

  categoryOptionSelected: {
    backgroundColor: 'rgba(116,198,157,0.1)',
  },

  categoryOptionText: {
    fontSize: 16,
    color: '#74c69d',
  },

  categoryOptionTextSelected: {
    color: '#74c69d',
    fontWeight: '600',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a2f23',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(116,198,157,0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  statusOptions: {
    gap: 8,
    marginBottom: 20,
  },
  statusOption: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusOptionActive: {
    backgroundColor: 'rgba(116,198,157,0.2)',
    borderColor: '#74c69d',
  },
  statusOptionText: {
    color: '#74c69d',
    fontSize: 14,
    fontWeight: '600',
  },
  statusOptionTextActive: {
    color: '#74c69d',
  },
  modalNotesSection: {
    marginTop: 10,
  },
  modalNotesLabel: {
    color: '#8fa89a',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  modalNotesInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minHeight: 80,
  },
  weightItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  weightItemName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  weightInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weightInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 8,
    color: '#ffffff',
    fontSize: 14,
    width: 80,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  weightUnit: {
    color: '#8fa89a',
    fontSize: 12,
  },
  modalSubmitButton: {
    backgroundColor: '#74c69d',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  modalSubmitButtonText: {
    color: '#0d1f15',
    fontSize: 16,
    fontWeight: '700',
  },

  // Top Products List
  topProductItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  topProductRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(116,198,157,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(116,198,157,0.4)',
  },
  topProductRankText: {
    color: '#74c69d',
    fontSize: 13,
    fontWeight: '700',
  },
  topProductName: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  topProductRevenue: {
    color: '#74c69d',
    fontSize: 14,
    fontWeight: '700',
  },

  // Loading State
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },

  // Template Chips
  templatesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  templateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(116,198,157,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(116,198,157,0.3)',
  },
  templateChipText: {
    color: '#74c69d',
    fontSize: 13,
    fontWeight: '600',
  },

  // Section Header Row
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionToggle: {
    color: '#74c69d',
    fontWeight: '600',
    fontSize: 14,
  },

  // Bulk Edit
  bulkEditToggle: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(45,106,79,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(116,198,157,0.4)',
  },
  bulkEditToggleActive: {
    backgroundColor: '#74c69d',
  },
  bulkEditToggleText: {
    color: '#0d1f15',
    fontWeight: '600',
    fontSize: 13,
  },

  // History List
  historyList: {
    marginTop: 12,
    gap: 10,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(45,106,79,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyContent: {
    flex: 1,
    gap: 4,
  },
  historyTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  historyDetail: {
    color: '#74c69d',
    fontSize: 13,
    fontWeight: '500',
  },
  historyDate: {
    color: '#5a7c6b',
    fontSize: 11,
  },

  // Sync Button
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(116,198,157,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(116,198,157,0.4)',
    marginTop: 8,
  },
  syncButtonText: {
    color: '#74c69d',
    fontSize: 14,
    fontWeight: '600',
  },
});
