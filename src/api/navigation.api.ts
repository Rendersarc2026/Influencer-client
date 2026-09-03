import { useQuery } from '@tanstack/react-query';
import { apiClient } from './axios.client';
import { NavItemResponse, NavigationListResponse } from '@contracts';

export function useNavigation(roleCode?: string | null) {
  return useQuery<NavItemResponse[]>({
    queryKey: ['navigation', roleCode],
    queryFn: async () => {
      const response = await apiClient.get<NavigationListResponse>('/navigation');
      return response.data.items;
    },
  });
}
