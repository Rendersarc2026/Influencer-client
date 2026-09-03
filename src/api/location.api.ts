import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from './axios.client';
import { invalidateEntity } from './invalidate';
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

/**
 * The managed list: paged, filterable, and able to include retired rows.
 *
 * Opted out of the client's 10-minute default staleness. This is the screen the
 * list is edited from, and every filter combination is its own cache key — so a
 * repeated search would otherwise redisplay a page built before the last edit
 * without ever asking the server.
 */
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
    staleTime: 0,
  });
}

export interface LocationOptionsOptions {
  /**
   * Filter controls pass this. A creator recorded against a location that was
   * later archived still has to be findable, so the filter keeps offering it —
   * while the forms that write new rows do not, which is what archiving is for.
   */
  includeArchived?: boolean;
}

/**
 * Locations for a dropdown. Cached briefly — the list barely changes.
 *
 * The agency is allowed to read deleted and archived rows (it maintains the
 * list), so this asks for the offerable set explicitly rather than relying on
 * the server's per-role default — otherwise an agency user picks from a list
 * carrying rows nobody should be able to choose.
 */
export function useLocations(search?: string, options?: LocationOptionsOptions) {
  const includeArchived = options?.includeArchived ?? false;

  return useQuery<LocationResponse[]>({
    queryKey: ['locations', 'options', search ?? '', includeArchived],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResult<LocationResponse>>('/locations', {
        params: {
          search: search?.trim() || undefined,
          isActive: true,
          ...(includeArchived ? {} : { isArchived: false }),
          limit: 100,
        },
      });
      return response.data.items;
    },
  });
}

/** Retire a location from the dropdowns, or bring it back. Not a delete. */
export function useSetLocationArchived() {
  const queryClient = useQueryClient();
  return useMutation<LocationResponse, Error, { id: string; archived: boolean }>({
    mutationFn: async ({ id, archived }) => {
      const response = await apiClient.patch<LocationResponse>(`/locations/${id}`, {
        isArchived: archived,
      });
      return response.data;
    },
    onSuccess: () => {
      invalidateEntity(queryClient, 'location');
      queryClient.invalidateQueries({ queryKey: ['locations'], refetchType: 'all' });
    },
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
      invalidateEntity(queryClient, 'location');
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
      invalidateEntity(queryClient, 'location');
      queryClient.invalidateQueries({ queryKey: ['locations'], refetchType: 'all' });
    },
  });
}

/** The soft delete. To retire a location from the dropdowns, archive it instead. */
export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/locations/${id}`);
    },
    onSuccess: () => {
      invalidateEntity(queryClient, 'location');
      queryClient.invalidateQueries({ queryKey: ['locations'], refetchType: 'all' });
    },
  });
}
