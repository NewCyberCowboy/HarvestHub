// src/types/product.ts
import { imagesApi } from '@/api/images.api'
import { ProductDto } from '@/types/backend';

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    discountPrice?: number;
    images: string[];
    categoryId: string;
    categoryName: string;
    farmerId: string;
    farmerName: string;
    stock: number;
    unit?: string;
    rating?: number;
    reviewCount?: number;
    isOrganic?: boolean;
    tags?: string[];
    isAvailable: boolean;
    status: string;
    createdAt?: string;
    updatedAt?: string;
}

// Добавляем export для функции
export const mapDtoToProduct = (dto: ProductDto): Product & { weightOptions?: number[], allowCustomWeight?: boolean } => ({
    id: dto.productId.toString(),
    name: dto.name,
    description: dto.description || '',
    price: dto.basePrice,
    images: dto.imageUrl ? [imagesApi.getImageUrl(dto.imageUrl)] : [],
    categoryId: dto.categoryId.toString(),
    categoryName: dto.categoryName,
    farmerId: dto.farmerId.toString(),
    farmerName: dto.farmerName,
    stock: dto.currentStock,
    unit: (dto.unit && dto.unit !== 'шт' && dto.unit !== 'коробка') ? dto.unit : 'кг', // Заменяем 'шт' и 'коробка' на 'кг'
    isAvailable: dto.status === 'Available' && dto.currentStock > 0,
    status: dto.status,
    createdAt: dto.createdAt,
    weightOptions: dto.weightOptions, // Добавляем варианты веса
    allowCustomWeight: dto.allowCustomWeight, // Добавляем флаг произвольного веса
    // Опциональные поля - можно не указывать, они undefined по умолчанию
});

// Дополнительная функция для карточки товара
export const mapDtoToProductForCard = (dto: ProductDto): Product => ({
    ...mapDtoToProduct(dto),
    unit: 'кг', // Всегда 'кг' для карточки
    rating: 0,
    reviewCount: 0,
    isOrganic: false,
    tags: [],
    updatedAt: dto.createdAt,
});