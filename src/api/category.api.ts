import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from './axios.client';
import {
  CategoryResponse,
  CategoryListQuery,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  PaginatedResult,
  CategoryType,
} from '@contracts';

/**
 * The shared brand/creator taxonomy.
 *
 * One endpoint serves both readers: every role fetches it to populate form
 * dropdowns, and the agency — which maintains it — reads the same list with
 * paging and an `isActive` filter so it can see what it archived. The writes
 * are the agency's alone; the server rejects them from anyone else.
 */

/** The managed list: paged, filterable, and able to include retired rows. */
export function useCategoryList(params?: CategoryListQuery) {
  return useQuery<PaginatedResult<CategoryResponse>>({
    queryKey: ['categories', 'list', params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResult<CategoryResponse>>('/categories', {
        params,
      });
      return response.data;
    },
    placeholderData: keepPreviousData,
  });
}

/** Active categories for a dropdown. Cached briefly — it barely changes. */
export function useCategories(type?: CategoryType, search?: string) {
  return useQuery<CategoryResponse[]>({
    queryKey: ['categories', 'options', type ?? 'all', search ?? ''],
    queryFn: async () => {
      const response = await apiClient.get<{ items: CategoryResponse[] }>('/categories', {
        params: {
          type,
          search: search?.trim() || undefined,
        },
      });
      return response.data.items;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation<CategoryResponse, Error, CreateCategoryRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<CategoryResponse>('/categories', data);
      return response.data;
    },
    // Both the managed list and every dropdown live under this prefix, so one
    // invalidation covers them; refetchType 'all' so a dropdown cached from an
    // earlier visit is fresh when it is next shown.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'], refetchType: 'all' });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation<CategoryResponse, Error, { id: string; data: UpdateCategoryRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch<CategoryResponse>(`/categories/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'], refetchType: 'all' });
    },
  });
}

export function useDeactivateCategory() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'], refetchType: 'all' });
    },
  });
}
