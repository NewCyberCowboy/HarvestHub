export interface Category {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    parentId?: string;
    children?: Category[];
    productsCount: number;
}

export interface ProductFilter {
    categoryId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    isOrganic?: boolean;
    farmerId?: string;
    page?: number;
    pageSize?: number;
    sortBy?: 'name' | 'price' | 'rating' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
}