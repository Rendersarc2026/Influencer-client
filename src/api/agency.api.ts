import { useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from './axios.client';
import {
  BrandResponse,
  BrandListQuery,
  CreateBrandRequest,
  UpdateBrandRequest,
  CampaignResponse,
  CampaignListQuery,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  AgencyMapperResponse,
  CampaignMapperListQuery,
  AddInfluencerToCampaignRequest,
  ApproveRateRequest,
  RequestRateRevisionRequest,
  RecordMetricRequest,
  MetricResponse,
  PaginatedResult,
} from '@contracts';

// -------------------------------------------------------------
// 1. Brands Queries & Mutations
// -------------------------------------------------------------

export function useAgencyBrands(params?: BrandListQuery) {
  return useQuery<PaginatedResult<BrandResponse>>({
    queryKey: ['agency', 'brands', params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResult<BrandResponse>>('/agency/brands', {
        params,
      });
      return response.data;
    },
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation<BrandResponse, Error, CreateBrandRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<BrandResponse>('/admin/brands', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency', 'brands'] });
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();
  return useMutation<BrandResponse, Error, { id: string; data: UpdateBrandRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch<BrandResponse>(`/admin/brands/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency', 'brands'] });
    },
  });
}

// -------------------------------------------------------------
// 2. Campaigns Queries & Mutations
// -------------------------------------------------------------

export function useAgencyCampaigns(params?: CampaignListQuery) {
  return useQuery<PaginatedResult<CampaignResponse>>({
    queryKey: ['agency', 'campaigns', params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResult<CampaignResponse>>('/agency/campaigns', {
        params,
      });
      return response.data;
    },
    // Paging keeps the previous page on screen while the next one loads, rather
    // than tearing the table down to a skeleton on every page change.
    placeholderData: keepPreviousData,
  });
}

export function useAgencyCampaign(id: string | undefined) {
  return useQuery<CampaignResponse>({
    queryKey: ['agency', 'campaigns', id],
    queryFn: async () => {
      if (!id) throw new Error('Campaign ID required');
      const response = await apiClient.get<CampaignResponse>(`/agency/campaigns/${id}`);
      return response.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation<CampaignResponse, Error, CreateCampaignRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<CampaignResponse>('/agency/campaigns', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency', 'campaigns'] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation<CampaignResponse, Error, { id: string; data: UpdateCampaignRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch<CampaignResponse>(`/agency/campaigns/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agency', 'campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['agency', 'campaigns', variables.id] });
    },
  });
}

// -------------------------------------------------------------
// 3. Campaign Influencer Mappers & Rates
// -------------------------------------------------------------

export function useCampaignInfluencers(
  campaignId: string | undefined,
  params?: CampaignMapperListQuery,
) {
  return useQuery<PaginatedResult<AgencyMapperResponse>>({
    queryKey: ['agency', 'campaigns', campaignId, 'influencers', params],
    queryFn: async () => {
      if (!campaignId) throw new Error('Campaign ID required');
      const response = await apiClient.get<PaginatedResult<AgencyMapperResponse>>(
        `/agency/campaigns/${campaignId}/influencers`,
        { params },
      );
      return response.data;
    },
    enabled: Boolean(campaignId),
  });
}

export function useAddInfluencerToCampaign(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation<AgencyMapperResponse, Error, AddInfluencerToCampaignRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<AgencyMapperResponse>(
        `/agency/campaigns/${campaignId}/influencers`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['agency', 'campaigns', campaignId, 'influencers'],
      });
    },
  });
}

export function useRemoveInfluencerFromCampaign(campaignId?: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (mapperId) => {
      await apiClient.delete(`/agency/mappers/${mapperId}`);
    },
    onSuccess: () => {
      if (campaignId) {
        queryClient.invalidateQueries({
          queryKey: ['agency', 'campaigns', campaignId, 'influencers'],
        });
      }
      queryClient.invalidateQueries({ queryKey: ['agency', 'campaigns'] });
    },
  });
}

/**
 * Approve Rate: Accepts mapperId and margin. Sends ONLY { margin }.
 * Server computes client_rate = influencer_rate + margin and persists it.
 */
export function useApproveRate(campaignId?: string) {
  const queryClient = useQueryClient();
  return useMutation<AgencyMapperResponse, Error, { mapperId: string; margin: number }>({
    mutationFn: async ({ mapperId, margin }) => {
      const payload: ApproveRateRequest = { margin };
      const response = await apiClient.post<AgencyMapperResponse>(
        `/agency/mappers/${mapperId}/approve-rate`,
        payload,
      );
      return response.data;
    },
    onSuccess: () => {
      if (campaignId) {
        queryClient.invalidateQueries({
          queryKey: ['agency', 'campaigns', campaignId, 'influencers'],
        });
      }
      queryClient.invalidateQueries({ queryKey: ['agency', 'campaigns'] });
    },
  });
}

export function useRequestRevision(campaignId?: string) {
  const queryClient = useQueryClient();
  return useMutation<AgencyMapperResponse, Error, { mapperId: string; comment: string }>({
    mutationFn: async ({ mapperId, comment }) => {
      const payload: RequestRateRevisionRequest = { comment };
      const response = await apiClient.post<AgencyMapperResponse>(
        `/agency/mappers/${mapperId}/request-revision`,
        payload,
      );
      return response.data;
    },
    onSuccess: () => {
      if (campaignId) {
        queryClient.invalidateQueries({
          queryKey: ['agency', 'campaigns', campaignId, 'influencers'],
        });
      }
      queryClient.invalidateQueries({ queryKey: ['agency', 'campaigns'] });
    },
  });
}

export function useSubmitForBrandReview(campaignId?: string) {
  const queryClient = useQueryClient();
  return useMutation<AgencyMapperResponse, Error, string>({
    mutationFn: async (mapperId) => {
      const response = await apiClient.post<AgencyMapperResponse>(
        `/agency/mappers/${mapperId}/submit-for-review`,
      );
      return response.data;
    },
    onSuccess: () => {
      if (campaignId) {
        queryClient.invalidateQueries({
          queryKey: ['agency', 'campaigns', campaignId, 'influencers'],
        });
      }
    },
  });
}

// -------------------------------------------------------------
// 4. Metrics Recording & Viewing
// -------------------------------------------------------------

export function useRecordMetric(campaignId?: string) {
  const queryClient = useQueryClient();
  return useMutation<MetricResponse, Error, { mapperId: string; data: RecordMetricRequest }>({
    mutationFn: async ({ mapperId, data }) => {
      const response = await apiClient.post<MetricResponse>(
        `/agency/mappers/${mapperId}/metrics`,
        data,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['agency', 'mappers', variables.mapperId, 'metrics'],
      });
      if (campaignId) {
        queryClient.invalidateQueries({
          queryKey: ['agency', 'campaigns', campaignId, 'influencers'],
        });
      }
    },
  });
}

export function useMapperMetrics(mapperId: string | undefined) {
  return useQuery<MetricResponse[]>({
    queryKey: ['agency', 'mappers', mapperId, 'metrics'],
    queryFn: async () => {
      if (!mapperId) return [];
      const response = await apiClient.get<MetricResponse[]>(`/agency/mappers/${mapperId}/metrics`);
      return response.data;
    },
    enabled: Boolean(mapperId),
  });
}

// -------------------------------------------------------------
// 5. Reports & Metrics Aggregates
// -------------------------------------------------------------

export interface CampaignReportResponse {
  campaign: CampaignResponse;
  influencerCount: number;
  totalInfluencerRate: number;
  totalClientRate: number;
  totalMargin: number;
  totalReach: number;
  totalEngagements: number;
  averageErPercent: number;
  mappers: AgencyMapperResponse[];
}

export function useCampaignReport(campaignId: string | undefined) {
  return useQuery<CampaignReportResponse>({
    queryKey: ['agency', 'reports', 'campaigns', campaignId],
    queryFn: async () => {
      if (!campaignId) throw new Error('Campaign ID required');
      const response = await apiClient.get<CampaignReportResponse>(
        `/agency/reports/campaigns/${campaignId}`,
      );
      return response.data;
    },
    enabled: Boolean(campaignId),
  });
}

/**
 * Fetches the aggregate report for several campaigns in a single request.
 *
 * This used to issue one request per campaign, which put a full page of
 * round trips between the dashboard and its first painted number. The server
 * now accepts the whole id set at once, so the screen waits on one response
 * regardless of how many campaigns are on the page.
 *
 * Each report is also written into the per-campaign cache key that
 * `useCampaignReport` reads, so opening a campaign detail screen renders from
 * cache instead of refetching what the dashboard already has.
 */
export function useCampaignReports(campaignIds: Array<string>) {
  const queryClient = useQueryClient();

  // Sorted so that the same set of campaigns in a different order is one cache
  // entry rather than two.
  const key = useMemo(() => [...campaignIds].sort(), [campaignIds]);

  const query = useQuery<CampaignReportResponse[]>({
    queryKey: ['agency', 'reports', 'campaigns', 'batch', key],
    queryFn: async () => {
      const response = await apiClient.get<CampaignReportResponse[]>('/agency/reports/campaigns', {
        params: { ids: key.join(',') },
      });
      return response.data;
    },
    enabled: key.length > 0,
    staleTime: 1000 * 60,
    placeholderData: keepPreviousData,
  });

  const reports = useMemo(() => query.data ?? [], [query.data]);

  useEffect(() => {
    for (const report of reports) {
      if (!report?.campaign?.id) continue;
      queryClient.setQueryData(['agency', 'reports', 'campaigns', report.campaign.id], report);
    }
  }, [reports, queryClient]);

  return {
    reports,
    isLoading: key.length > 0 && query.isPending,
    isError: query.isError,
  };
}

export interface InfluencerReportResponse {
  influencer: { id: string; name: string; email: string };
  campaignCount: number;
  totalInfluencerRate: number;
  totalReach: number;
  totalEngagements: number;
  averageErPercent: number;
}

export function useInfluencerReport(influencerId: string | undefined) {
  return useQuery<InfluencerReportResponse>({
    queryKey: ['agency', 'reports', 'influencers', influencerId],
    queryFn: async () => {
      if (!influencerId) throw new Error('Influencer ID required');
      const response = await apiClient.get<InfluencerReportResponse>(
        `/agency/reports/influencers/${influencerId}`,
      );
      return response.data;
    },
    enabled: Boolean(influencerId),
  });
}
