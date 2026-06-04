import { apiRequest } from '@/lib/api';
import type { CreateReviewDto, ProductReviewsSummaryDto, ReviewDto } from '@/types/backend';

export const reviewsService = {
  getSummary: (productId: number) =>
    apiRequest<ProductReviewsSummaryDto>(`/Reviews/product/${productId}/summary`),
  create: (payload: CreateReviewDto, token: string) =>
    apiRequest<ReviewDto>('/Reviews', { method: 'POST', body: payload, token }),
};
