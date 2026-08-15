import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from './axios.client';
import {
  AgencyResponse,
  AgencyListQuery,
  CreateAgencyRequest,
  UpdateAgencyRequest,
  BrandResponse,
  BrandListQuery,
  CreateBrandRequest,
  UpdateBrandRequest,
  UserResponse,
  UserListQuery,
  InfluencerResponse,
  InfluencerListQuery,
  CreateUserRequest,
  UpdateUserRequest,
  CampaignResponse,
  CampaignListQuery,
  AgencyMapperResponse,
  CampaignMapperListQuery,
  AdminPlatformStatsResponse,
  PaginatedResult,
} from '@contracts';

// -------------------------------------------------------------
// 1. Agencies
// -------------------------------------------------------------

export function useAdminAgencies(params?: AgencyListQuery) {
  return useQuery<PaginatedResult<AgencyResponse>>({
    queryKey: ['admin', 'agencies', params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResult<AgencyResponse>>('/admin/agencies', {
        params,
      });
      return response.data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useCreateAgency() {
  const queryClient = useQueryClient();
  return useMutation<AgencyResponse, Error, CreateAgencyRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<AgencyResponse>('/admin/agencies', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'agencies'] });
    },
  });
}

export function useUpdateAgency() {
  const queryClient = useQueryClient();
  return useMutation<AgencyResponse, Error, { id: string; data: UpdateAgencyRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch<AgencyResponse>(`/admin/agencies/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'agencies'] });
    },
  });
}

export function useDeactivateAgency() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/admin/agencies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'agencies'] });
    },
  });
}

// -------------------------------------------------------------
// 2. Brands
// -------------------------------------------------------------

export function useAdminBrands(params?: BrandListQuery) {
  return useQuery<PaginatedResult<BrandResponse>>({
    queryKey: ['admin', 'brands', params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResult<BrandResponse>>('/admin/brands', {
        params,
      });
      return response.data;
    },
    placeholderData: keepPreviousData,
  });
}

/** The creator directory. */
export function useAdminInfluencers(params?: InfluencerListQuery) {
  return useQuery<PaginatedResult<InfluencerResponse>>({
    queryKey: ['admin', 'influencers', params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResult<InfluencerResponse>>(
        '/admin/influencers',
        { params },
      );
      return response.data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useAdminCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation<BrandResponse, Error, CreateBrandRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<BrandResponse>('/admin/brands', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'brands'] });
    },
  });
}

export function useAdminUpdateBrand() {
  const queryClient = useQueryClient();
  return useMutation<BrandResponse, Error, { id: string; data: UpdateBrandRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch<BrandResponse>(`/admin/brands/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'brands'] });
    },
  });
}

export function useAdminDeactivateBrand() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/admin/brands/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'brands'] });
    },
  });
}

// -------------------------------------------------------------
// 3. Campaigns
// -------------------------------------------------------------

export function useAdminCampaigns(params?: CampaignListQuery) {
  return useQuery<PaginatedResult<CampaignResponse>>({
    queryKey: ['admin', 'campaigns', params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResult<CampaignResponse>>('/admin/campaigns', {
        params,
      });
      return response.data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useAdminCampaign(id: string | undefined) {
  return useQuery<CampaignResponse>({
    queryKey: ['admin', 'campaigns', id],
    queryFn: async () => {
      if (!id) throw new Error('Campaign ID required');
      const response = await apiClient.get<CampaignResponse>(`/admin/campaigns/${id}`);
      return response.data;
    },
    enabled: Boolean(id),
  });
}

export function useAdminCampaignInfluencers(
  campaignId: string | undefined,
  params?: CampaignMapperListQuery,
) {
  return useQuery<PaginatedResult<AgencyMapperResponse>>({
    queryKey: ['admin', 'campaigns', campaignId, 'influencers', params],
    queryFn: async () => {
      if (!campaignId) throw new Error('Campaign ID required');
      const response = await apiClient.get<PaginatedResult<AgencyMapperResponse>>(
        `/admin/campaigns/${campaignId}/influencers`,
        { params },
      );
      return response.data;
    },
    enabled: Boolean(campaignId),
    placeholderData: keepPreviousData,
  });
}

// -------------------------------------------------------------
// 4. Users
// -------------------------------------------------------------

/**
 * Shared by the hook below and by the boot-time prefetch, so the query key and
 * the fetcher cannot drift apart — a mismatched key would silently turn a
 * warmed cache entry into a second network request.
 */
export function adminUsersQueryOptions(params?: UserListQuery) {
  return {
    queryKey: ['admin', 'users', params] as const,
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResult<UserResponse>>('/admin/users', {
        params,
      });
      return response.data;
    },
  };
}

export function useAdminUsers(params?: UserListQuery) {
  return useQuery<PaginatedResult<UserResponse>>({
    ...adminUsersQueryOptions(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdminCreateUser() {
  const queryClient = useQueryClient();
  return useMutation<UserResponse, Error, CreateUserRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<UserResponse>('/admin/users', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useAdminUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation<UserResponse, Error, { id: string; data: UpdateUserRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch<UserResponse>(`/admin/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useAdminDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useAdminResendInvite() {
  return useMutation<{ message: string }, Error, string>({
    mutationFn: async (email) => {
      const response = await apiClient.post<{ message: string }>('/auth/otp/request', { email });
      return response.data;
    },
  });
}

// -------------------------------------------------------------
// 5. Platform Stats (Ultra-fast pre-aggregated SQL view/function)
// -------------------------------------------------------------

export function adminPlatformStatsQueryOptions() {
  return {
    queryKey: ['admin', 'stats'] as const,
    queryFn: async () => {
      const response = await apiClient.get<AdminPlatformStatsResponse>('/admin/stats');
      return response.data;
    },
    staleTime: 30_000,
  };
}

export function useAdminPlatformStats() {
  return useQuery<AdminPlatformStatsResponse>(adminPlatformStatsQueryOptions());
}
