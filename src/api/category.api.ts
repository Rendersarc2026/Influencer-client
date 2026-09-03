import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from './axios.client';
import { invalidateEntity } from './invalidate';
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

/**
 * The managed list: paged, filterable, and able to include retired rows.
 *
 * Opted out of the client's 10-minute default staleness, like the location list:
 * this is the screen the taxonomy is edited from, and each filter combination is
 * its own cache key, so a repeated search must not redisplay a pre-edit page.
 */
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
    staleTime: 0,
  });
}

/**
 * Active categories for a dropdown. Cached briefly — it barely changes.
 *
 * The offerable set is asked for explicitly: the agency maintains this list and
 * the server lets it read archived rows, so without this an agency user would be
 * offered categories that were archived out of use.
 */
export function useCategories(type?: CategoryType, search?: string) {
  return useQuery<CategoryResponse[]>({
    queryKey: ['categories', 'options', type ?? 'all', search ?? ''],
    queryFn: async () => {
      const response = await apiClient.get<{ items: CategoryResponse[] }>('/categories', {
        params: {
          type,
          search: search?.trim() || undefined,
          isActive: true,
          isArchived: false,
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
      invalidateEntity(queryClient, 'category');
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
      invalidateEntity(queryClient, 'category');
      queryClient.invalidateQueries({ queryKey: ['categories'], refetchType: 'all' });
    },
  });
}

/** Retire a category from the dropdowns, or bring it back. Not a delete. */
export function useSetCategoryArchived() {
  const queryClient = useQueryClient();
  return useMutation<CategoryResponse, Error, { id: string; archived: boolean }>({
    mutationFn: async ({ id, archived }) => {
      const response = await apiClient.patch<CategoryResponse>(`/categories/${id}`, {
        isArchived: archived,
      });
      return response.data;
    },
    onSuccess: () => {
      invalidateEntity(queryClient, 'category');
      queryClient.invalidateQueries({ queryKey: ['categories'], refetchType: 'all' });
    },
  });
}

/** The soft delete. To retire a category from the dropdowns, archive it instead. */
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      invalidateEntity(queryClient, 'category');
      queryClient.invalidateQueries({ queryKey: ['categories'], refetchType: 'all' });
    },
  });
}
