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
  UpdatePreEvalRequest,
  MetricResponse,
  InfluencerResponse,
  InfluencerListQuery,
  CreateInfluencerRequest,
  UpdateInfluencerRequest,
  UserResponse,
  UserListQuery,
  PaginatedResult,
} from '@contracts';

// -------------------------------------------------------------
// 0. Accounts
// -------------------------------------------------------------

/**
 * The logins in this agency's world: its own staff, its brands' managers and
 * the creators it represents. Shared with the boot-time prefetch, so the query
 * key and the fetcher cannot drift apart.
 */
export function agencyUsersQueryOptions(params?: UserListQuery) {
  return {
    queryKey: ['agency', 'users', params] as const,
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResult<UserResponse>>('/agency/users', {
        params,
      });
      return response.data;
    },
  };
}

export function useAgencyUsers(params?: UserListQuery, options?: { enabled?: boolean }) {
  return useQuery<PaginatedResult<UserResponse>>({
    ...agencyUsersQueryOptions(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Blocks or unblocks an account — the only write the agency has over one.
 *
 * A blocked account is `isActive: false`, which the list filters on, so the
 * whole namespace is invalidated rather than one page.
 */
export function useSetUserBlocked() {
  const queryClient = useQueryClient();
  return useMutation<UserResponse, Error, { id: string; blocked: boolean }>({
    mutationFn: async ({ id, blocked }) => {
      const response = await apiClient.patch<UserResponse>(`/agency/users/${id}/blocked`, {
        blocked,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency', 'users'] });
    },
  });
}

// -------------------------------------------------------------
// 1. Brands Queries & Mutations
// -------------------------------------------------------------

/**
 * Shared by the hook below and by the boot-time prefetch, so the query key and
 * the fetcher cannot drift apart — a mismatched key would silently turn a
 * warmed cache entry into a second network request.
 */
export function agencyBrandsQueryOptions(params?: BrandListQuery) {
  return {
    queryKey: ['agency', 'brands', params] as const,
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResult<BrandResponse>>('/agency/brands', {
        params,
      });
      return response.data;
    },
  };
}

export function useAgencyBrands(params?: BrandListQuery, options?: { enabled?: boolean }) {
  return useQuery<PaginatedResult<BrandResponse>>({
    ...agencyBrandsQueryOptions(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Signs up a new client brand under this agency.
 *
 * There is no counterpart that takes on an existing brand: every brand belongs
 * to the agency that created it, so the client list only ever grows this way.
 */
export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation<BrandResponse, Error, CreateBrandRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<BrandResponse>('/agency/brands', data);
      return response.data;
    },
    onSuccess: () => {
      // refetchType: 'all' so a brand picker cached from an earlier visit
      // (mounted elsewhere, currently inactive) is already fresh by the time
      // it is shown again, rather than waiting for its next mount to notice.
      queryClient.invalidateQueries({ queryKey: ['agency', 'brands'], refetchType: 'all' });
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();
  return useMutation<BrandResponse, Error, { id: string; data: UpdateBrandRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch<BrandResponse>(`/agency/brands/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency', 'brands'], refetchType: 'all' });
    },
  });
}

// -------------------------------------------------------------
// 2. Campaigns Queries & Mutations
// -------------------------------------------------------------

/** Shared with the boot-time prefetch — see agencyBrandsQueryOptions. */
export function agencyCampaignsQueryOptions(params?: CampaignListQuery) {
  return {
    queryKey: ['agency', 'campaigns', params] as const,
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResult<CampaignResponse>>('/agency/campaigns', {
        params,
      });
      return response.data;
    },
  };
}

export function useAgencyCampaigns(params?: CampaignListQuery) {
  return useQuery<PaginatedResult<CampaignResponse>>({
    ...agencyCampaignsQueryOptions(params),
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
      queryClient.invalidateQueries({ queryKey: ['brand', 'campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['brand', 'campaigns', variables.id] });
    },
  });
}

// -------------------------------------------------------------
// 3. Creators
// -------------------------------------------------------------

/** The creators this agency represents — also the assign-to-campaign picker. */
export function useAgencyInfluencers(params?: InfluencerListQuery, options?: { enabled?: boolean }) {
  return useQuery<PaginatedResult<InfluencerResponse>>({
    queryKey: ['agency', 'influencers', params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResult<InfluencerResponse>>(
        '/agency/influencers',
        { params },
      );
      return response.data;
    },
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Enters a creator this agency represents, before that creator has signed in
 * themselves. The row is owned by this agency from the first write, so it lands
 * on the list above straight away.
 */
export function useCreateInfluencer() {
  const queryClient = useQueryClient();
  return useMutation<InfluencerResponse, Error, CreateInfluencerRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<InfluencerResponse>('/agency/influencers', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency', 'influencers'], refetchType: 'all' });
    },
  });
}

export function useUpdateInfluencer() {
  const queryClient = useQueryClient();
  return useMutation<InfluencerResponse, Error, { id: string; data: UpdateInfluencerRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch<InfluencerResponse>(`/agency/influencers/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency', 'influencers'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['agency', 'campaigns'], refetchType: 'all' });
    },
  });
}

// -------------------------------------------------------------
// 4. Campaign Influencer Mappers & Rates
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
    placeholderData: keepPreviousData,
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
  return useMutation<
    AgencyMapperResponse,
    Error,
    {
      mapperId: string;
      margin: number;
      influencerRate?: number;
      committedViews?: number;
      preEvalEr?: number;
      reachFromRegion?: string;
      brandFit?: string;
      deliverables?: string;
    }
  >({
    mutationFn: async ({
      mapperId,
      margin,
      influencerRate,
      committedViews,
      preEvalEr,
      reachFromRegion,
      brandFit,
      deliverables,
    }) => {
      const payload: ApproveRateRequest = {
        margin,
        influencerRate,
        committedViews,
        preEvalEr,
        reachFromRegion,
        brandFit,
        deliverables,
      };
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
        queryClient.invalidateQueries({
          queryKey: ['brand', 'campaigns', campaignId, 'influencers'],
        });
      }
      queryClient.invalidateQueries({ queryKey: ['agency', 'campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['brand', 'campaigns'] });
    },
  });
}

export function useUpdatePreEval(campaignId?: string) {
  const queryClient = useQueryClient();
  return useMutation<
    AgencyMapperResponse,
    Error,
    {
      mapperId: string;
      data: UpdatePreEvalRequest;
    }
  >({
    mutationFn: async ({ mapperId, data }) => {
      const response = await apiClient.patch<AgencyMapperResponse>(
        `/agency/mappers/${mapperId}/pre-eval`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      if (campaignId) {
        queryClient.invalidateQueries({
          queryKey: ['agency', 'campaigns', campaignId, 'influencers'],
        });
        queryClient.invalidateQueries({
          queryKey: ['brand', 'campaigns', campaignId, 'influencers'],
        });
      }
      queryClient.invalidateQueries({ queryKey: ['agency', 'campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['brand', 'campaigns'] });
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

export function useRevertApproval(campaignId?: string) {
  const queryClient = useQueryClient();
  return useMutation<AgencyMapperResponse, Error, { mapperId: string; comment?: string }>({
    mutationFn: async ({ mapperId, comment }) => {
      const response = await apiClient.post<AgencyMapperResponse>(
        `/agency/mappers/${mapperId}/revert-approval`,
        { comment },
      );
      return response.data;
    },
    onSuccess: () => {
      if (campaignId) {
        queryClient.invalidateQueries({
          queryKey: ['agency', 'campaigns', campaignId, 'influencers'],
        });
        queryClient.invalidateQueries({
          queryKey: ['brand', 'campaigns', campaignId, 'influencers'],
        });
      }
      queryClient.invalidateQueries({ queryKey: ['agency', 'campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['brand', 'campaigns'] });
    },
  });
}

// -------------------------------------------------------------
// 5. Metrics Recording & Viewing
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

// -------------------------------------------------------------
// 6. Reports & Metrics Aggregates
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

/**
 * Fetches the aggregate report for several campaigns in a single request.
 *
 * This used to issue one request per campaign, which put a full page of
 * round trips between the dashboard and its first painted number. The server
 * now accepts the whole id set at once, so the screen waits on one response
 * regardless of how many campaigns are on the page.
 *
 * Each report is also written into its own per-campaign cache key, so a
 * detail screen opened from the dashboard can render from cache instead of
 * refetching what the dashboard already has.
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
    isFetching: key.length > 0 && query.isFetching,
    isError: query.isError,
  };
}
