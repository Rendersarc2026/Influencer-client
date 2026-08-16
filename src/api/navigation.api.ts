import { useQuery } from '@tanstack/react-query';
import { apiClient } from './axios.client';
import { NavItemResponse, NavigationListResponse } from '@contracts';

export function useNavigation() {
  return useQuery<NavItemResponse[]>({
    queryKey: ['navigation'],
    queryFn: async () => {
      const response = await apiClient.get<NavigationListResponse>('/navigation');
      return response.data.items;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}
