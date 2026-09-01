import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from './axios.client';
import {
  LocationResponse,
  LocationListQuery,
  CreateLocationRequest,
  UpdateLocationRequest,
  PaginatedResult,
} from '@contracts';

/**
 * The master list of platform locations.
 *
 * One endpoint serves both readers: every role fetches it to populate the
 * location dropdowns on profiles, brand/creator forms and search filters, and
 * the agency — which maintains it — reads the same list with paging and an
 * `isActive` filter so it can see what it archived. The writes are the
 * agency's alone; the server rejects them from anyone else.
 */

/** The managed list: paged, filterable, and able to include retired rows. */
export function useLocationList(params?: LocationListQuery) {
  return useQuery<PaginatedResult<LocationResponse>>({
    queryKey: ['locations', 'list', params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResult<LocationResponse>>('/locations', {
        params,
      });
      return response.data;
    },
    placeholderData: keepPreviousData,
  });
}

/** Active locations for a dropdown. Cached briefly — it barely changes. */
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

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation<LocationResponse, Error, CreateLocationRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<LocationResponse>('/locations', data);
      return response.data;
    },
    // Both the managed list and every dropdown live under this prefix, so one
    // invalidation covers them; refetchType 'all' so a dropdown cached from an
    // earlier visit is fresh when it is next shown.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'], refetchType: 'all' });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  return useMutation<LocationResponse, Error, { id: string; data: UpdateLocationRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch<LocationResponse>(`/locations/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'], refetchType: 'all' });
    },
  });
}

export function useDeactivateLocation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/locations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'], refetchType: 'all' });
    },
  });
}
