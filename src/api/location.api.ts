import { useQuery } from '@tanstack/react-query';
import { apiClient } from './axios.client';
import { LocationResponse, PaginatedResult } from '@contracts';

export function useLocations(search?: string) {
  return useQuery<LocationResponse[]>({
    queryKey: ['locations', 'options', search ?? ''],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResult<LocationResponse>>('/locations', {
        params: {
          search: search?.trim() || undefined,
          limit: 100,
        },
      });
      return response.data.items;
    },
    staleTime: 60 * 1000,
  });
}
