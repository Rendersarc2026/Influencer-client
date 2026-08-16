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
 * Admin list of categories with pagination, filters, and status.
 */
export function useAdminCategories(params?: CategoryListQuery) {
  return useQuery<PaginatedResult<CategoryResponse>>({
    queryKey: ['admin', 'categories', params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResult<CategoryResponse>>('/admin/categories', {
        params,
      });
      return response.data;
    },
    placeholderData: keepPreviousData,
  });
}

/**
 * Public/authenticated active categories list for dropdowns.
 */
export function useCategories(type?: CategoryType, search?: string) {
  return useQuery<CategoryResponse[]>({
    queryKey: ['categories', type ?? 'all', search ?? ''],
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['categories'], refetchType: 'all' });
    },
  });
}

export function useAdminCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation<CategoryResponse, Error, CreateCategoryRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<CategoryResponse>('/categories', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['categories'], refetchType: 'all' });
    },
  });
}

export function useAdminUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation<CategoryResponse, Error, { id: string; data: UpdateCategoryRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch<CategoryResponse>(`/admin/categories/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['categories'], refetchType: 'all' });
    },
  });
}

export function useAdminDeactivateCategory() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['categories'], refetchType: 'all' });
    },
  });
}
