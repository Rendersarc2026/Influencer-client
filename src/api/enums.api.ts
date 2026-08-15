import { useQuery } from '@tanstack/react-query';
import { apiClient } from './axios.client';
import { EnumCodeResponse } from '@contracts';

/**
 * The coded-value registry: statuses, roles, chat types.
 *
 * The rows change only when a migration adds one, so this is cached for the
 * session rather than refetched — it is reference data, not state.
 */
export function useEnumCodes(category?: string) {
  return useQuery<EnumCodeResponse[]>({
    queryKey: ['enums', category ?? 'all'],
    queryFn: async () => {
      const response = await apiClient.get<{ items: EnumCodeResponse[] }>('/enums', {
        params: category ? { category } : undefined,
      });
      return response.data.items;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
