// src/utils/product.mappers.ts
import { ProductDto } from '@/types/backend';
import { Product } from '@/types/product';

export const mapDtoToProduct = (dto: ProductDto): Product => ({
    // Обязательные поля
    id: dto.productId.toString(),
    name: dto.name,
    description: dto.description || '',
    price: dto.basePrice,
    stock: dto.currentStock,
    categoryId: dto.categoryId.toString(),
    categoryName: dto.categoryName,
    farmerName: dto.farmerName,
    isAvailable: dto.status === 'Available' && dto.currentStock > 0,
    status: dto.status,
    images: [], // Пустой массив как заглушка
    createdAt: dto.createdAt,

    // Опциональные поля с дефолтными значениями
    farmerId: '0', // Временное значение
    unit: undefined,
    rating: undefined,
    reviewCount: undefined,
    isOrganic: undefined,
    tags: undefined,
    updatedAt: undefined,
    discountPrice: undefined,
});

// Упрощенная версия только с обязательными полями
export const mapDtoToProductBasic = (dto: ProductDto): Product => ({
    id: dto.productId.toString(),
    name: dto.name,
    description: dto.description || '',
    price: dto.basePrice,
    stock: dto.currentStock,
    categoryId: dto.categoryId.toString(),
    categoryName: dto.categoryName,
    farmerName: dto.farmerName,
    isAvailable: dto.status === 'Available' && dto.currentStock > 0,
    status: dto.status,
    images: [],
    createdAt: dto.createdAt,
    farmerId: '0',
});