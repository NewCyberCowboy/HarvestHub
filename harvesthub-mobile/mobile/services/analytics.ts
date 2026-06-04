import { apiRequest } from '@/lib/api';
import type { FarmerAnalyticsDto } from '@/types/backend';

export const analyticsService = {
  getFarmerAnalytics: async (days: number = 30, token: string): Promise<FarmerAnalyticsDto> => {
    return apiRequest<FarmerAnalyticsDto>(`/Orders/farmer/analytics?days=${days}`, { token });
  },
};
