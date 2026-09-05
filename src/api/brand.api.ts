import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from './axios.client';
import { invalidateEntity } from './invalidate';
import {
  CampaignResponse,
  CampaignListQuery,
  BrandMapperResponse,
  CampaignMapperListQuery,
  BrandDecisionRequest,
  PaginatedResult,
  BrandResponse,
  UpdateBrandRequest,
  BrandDashboardSummary,
} from '@contracts';

/**
 * The home screen's tiles, aggregated in Postgres rather than by counting every
 * campaign and every assignment the brand has in the browser.
 */
/** Shared with the boot-time prefetch, so the key cannot drift from the hook's. */
export function brandDashboardSummaryQueryOptions() {
  return {
    queryKey: ['brand', 'dashboard', 'summary'] as const,
    queryFn: async () => {
      const response = await apiClient.get<BrandDashboardSummary>('/brand/dashboard/summary');
      return response.data;
    },
  };
}

export function useBrandDashboardSummary() {
  return useQuery<BrandDashboardSummary>({
    ...brandDashboardSummaryQueryOptions(),
    staleTime: 1000 * 60,
  });
}

/** Shared with the boot-time prefetch, so the key cannot drift from the hook's. */
export function brandCampaignsQueryOptions(params?: CampaignListQuery) {
  return {
    queryKey: ['brand', 'campaigns', params] as const,
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResult<CampaignResponse>>('/brand/campaigns', {
        params,
      });
      return response.data;
    },
  };
}

export function useBrandCampaigns(params?: CampaignListQuery) {
  return useQuery<PaginatedResult<CampaignResponse>>({
    ...brandCampaignsQueryOptions(params),
    // Keep the current page on screen while the next one loads — the table
    // shows its backlit refetch state instead of collapsing to a skeleton.
    placeholderData: keepPreviousData,
  });
}

export function useBrandCampaign(campaignId: string | undefined) {
  return useQuery<CampaignResponse>({
    queryKey: ['brand', 'campaigns', campaignId],
    queryFn: async () => {
      if (!campaignId) throw new Error('Campaign ID required');
      const response = await apiClient.get<CampaignResponse>(`/brand/campaigns/${campaignId}`);
      return response.data;
    },
    enabled: Boolean(campaignId),
  });
}

export function useBrandCampaignInfluencers(
  campaignId: string | undefined,
  params?: CampaignMapperListQuery,
) {
  return useQuery<PaginatedResult<BrandMapperResponse>>({
    queryKey: ['brand', 'campaigns', campaignId, 'influencers', params],
    queryFn: async () => {
      if (!campaignId) throw new Error('Campaign ID required');
      const response = await apiClient.get<PaginatedResult<BrandMapperResponse>>(
        `/brand/campaigns/${campaignId}/influencers`,
        { params },
      );
      return response.data;
    },
    enabled: Boolean(campaignId),
    placeholderData: keepPreviousData,
  });
}

export function useBrandDecision(campaignId?: string) {
  const queryClient = useQueryClient();
  return useMutation<
    BrandMapperResponse,
    Error,
    { mapperId: string; decision: BrandDecisionRequest }
  >({
    mutationFn: async ({ mapperId, decision }) => {
      const response = await apiClient.post<BrandMapperResponse>(
        `/brand/mappers/${mapperId}/decision`,
        decision,
      );
      return response.data;
    },
    onSuccess: () => {
      invalidateEntity(queryClient, 'assignment');
      if (campaignId) {
        queryClient.invalidateQueries({
          queryKey: ['brand', 'campaigns', campaignId, 'influencers'],
        });
      }
      queryClient.invalidateQueries({ queryKey: ['brand', 'campaigns'] });
    },
  });
}

export function brandProfileQueryOptions() {
  return {
    queryKey: ['brand', 'profile'] as const,
    queryFn: async () => {
      const response = await apiClient.get<BrandResponse>('/brand/profile');
      return response.data;
    },
  };
}

export function useBrandProfile(enabled = true) {
  return useQuery<BrandResponse>({
    ...brandProfileQueryOptions(),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useUpdateBrandProfile() {
  const queryClient = useQueryClient();
  return useMutation<BrandResponse, Error, UpdateBrandRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.patch<BrandResponse>('/brand/profile', data);
      return response.data;
    },
    onSuccess: () => {
      invalidateEntity(queryClient, 'brand');
      queryClient.invalidateQueries({ queryKey: ['brand', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['agency', 'brands'] });
    },
  });
}
